<?php

namespace App\Jobs;

use App\Models\Food;
use App\Models\MealLog;
use App\Services\AiVisionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AnalyzeMealJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public MealLog $mealLog;
    public ?string $hint;
    public int $tries = 3;
    public int $timeout = 60;

    public function __construct(MealLog $mealLog, ?string $hint = null)
    {
        $this->mealLog = $mealLog;
        $this->hint = $hint;
    }

    public function handle(AiVisionService $aiService): void
    {
        try {
            $this->mealLog->status = 'processing';
            $this->mealLog->save();

            $image = $this->mealLog->image_url;
            $foods = $aiService->analyzeFoodImage($image, $this->hint);

            if (empty($foods)) {
                $this->mealLog->status = 'failed';
                $this->mealLog->error_message = 'Không thể nhận diện món ăn từ hình ảnh. Vui lòng chụp rõ hơn.';
                $this->mealLog->save();
                return;
            }

            // Remove previous foods if any
            $this->mealLog->foods()->delete();

            // Insert recognized food items
            foreach ($foods as $item) {
                Food::create([
                    'meal_log_id' => $this->mealLog->id,
                    'name' => $item['name'],
                    'grams' => $item['grams'],
                    'calories' => $item['calories'],
                    'protein_g' => $item['protein_g'],
                    'carbs_g' => $item['carbs_g'],
                    'fat_g' => $item['fat_g'],
                    'confidence' => $item['confidence'],
                    'health_score' => $item['health_score'],
                    'micronutrients' => $item['micronutrients'] ?? null,
                ]);
            }

            $this->mealLog->status = 'completed';
            $this->mealLog->analyzed_at = now();
            $this->mealLog->recalculateTotals();

            Log::info("AnalyzeMealJob completed successfully for MealLog #{$this->mealLog->id}");
        } catch (\Throwable $e) {
            Log::error("AnalyzeMealJob failed for MealLog #{$this->mealLog->id}: " . $e->getMessage());
            $this->mealLog->status = 'failed';
            $this->mealLog->error_message = 'Đã có lỗi trong quá trình xử lý AI. Vui lòng thử lại.';
            $this->mealLog->save();
        }
    }
}
