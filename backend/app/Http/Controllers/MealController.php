<?php

namespace App\Http\Controllers;

use App\Jobs\AnalyzeMealJob;
use App\Models\Food;
use App\Models\MealLog;
use App\Services\AiVisionService;
use App\Services\NutritionValidator;
use App\Services\UploadService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MealController extends Controller
{
    protected UploadService $uploadService;

    protected AiVisionService $aiVisionService;

    protected NutritionValidator $validator;

    public function __construct(
        UploadService $uploadService,
        AiVisionService $aiVisionService,
        NutritionValidator $validator
    ) {
        $this->uploadService = $uploadService;
        $this->aiVisionService = $aiVisionService;
        $this->validator = $validator;
    }

    /**
     * Submit image for AI Vision analysis (Async Queue).
     */
    public function analyze(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'nullable|file|image|max:15360', // 15MB max
            'image_base64' => 'nullable|string',
            'image_url' => 'nullable|string',
            'meal_type' => 'nullable|string|in:breakfast,lunch,dinner,snack',
            'hint' => 'nullable|string|max:500',
            'logged_date' => 'nullable|date',
            'async' => 'nullable|boolean',
        ]);

        $user = $request->user();
        $mealType = $request->input('meal_type', 'breakfast');
        $loggedDate = $request->input('logged_date', Carbon::today()->format('Y-m-d'));
        $hint = $request->input('hint');

        // Store image
        $imageUrl = $request->input('image_url');
        if ($request->hasFile('image')) {
            $imageUrl = $this->uploadService->uploadMealImage($request->file('image'));
        } elseif ($request->filled('image_base64')) {
            $imageUrl = $this->uploadService->uploadMealImage($request->input('image_base64'));
        }

        $mealLog = MealLog::create([
            'user_id' => $user->id,
            'image_url' => $imageUrl,
            'meal_type' => $mealType,
            'status' => 'pending',
            'logged_date' => $loggedDate,
        ]);

        // If async is requested (default)
        $isAsync = $request->boolean('async', true);

        if ($isAsync) {
            AnalyzeMealJob::dispatch($mealLog, $hint);

            return response()->json([
                'success' => true,
                'message' => 'Hình ảnh đang được AI phân tích...',
                'job_id' => $mealLog->id,
                'status' => 'pending',
                'meal_log' => $mealLog,
            ], 202);
        }

        // Synchronous processing fallback
        $foods = $this->aiVisionService->analyzeFoodImage($imageUrl ?? '', $hint);
        foreach ($foods as $item) {
            Food::create([
                'meal_log_id' => $mealLog->id,
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

        $mealLog->status = 'completed';
        $mealLog->analyzed_at = now();
        $mealLog->recalculateTotals();

        return response()->json([
            'success' => true,
            'status' => 'completed',
            'meal_log' => $mealLog->load('foods'),
        ]);
    }

    /**
     * Check processing status of a meal analysis job.
     */
    public function getJobStatus(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $mealLog = $user->mealLogs()->with('foods')->findOrFail($id);

        return response()->json([
            'success' => true,
            'status' => $mealLog->status,
            'meal_log' => $mealLog,
        ]);
    }

    /**
     * Get meals logged for a specific date.
     */
    public function indexByDate(Request $request): JsonResponse
    {
        $user = $request->user();
        $date = $request->input('date', Carbon::today()->format('Y-m-d'));

        $meals = $user->mealLogs()
            ->with('foods')
            ->whereDate('logged_date', $date)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'date' => $date,
            'meals' => $meals,
        ]);
    }

    /**
     * Show single meal details.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $meal = $user->mealLogs()->with('foods')->findOrFail($id);

        return response()->json([
            'success' => true,
            'meal' => $meal,
        ]);
    }

    /**
     * Update meal foods or notes.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $meal = $user->mealLogs()->findOrFail($id);

        $validated = $request->validate([
            'meal_type' => 'sometimes|string|in:breakfast,lunch,dinner,snack',
            'notes' => 'sometimes|nullable|string',
            'foods' => 'sometimes|array',
            'foods.*.id' => 'nullable|integer',
            'foods.*.name' => 'required|string',
            'foods.*.grams' => 'required|numeric',
            'foods.*.calories' => 'required|integer',
            'foods.*.protein_g' => 'required|numeric',
            'foods.*.carbs_g' => 'required|numeric',
            'foods.*.fat_g' => 'required|numeric',
        ]);

        if (isset($validated['meal_type'])) {
            $meal->meal_type = $validated['meal_type'];
        }
        if (isset($validated['notes'])) {
            $meal->notes = $validated['notes'];
        }
        $meal->save();

        if (isset($validated['foods'])) {
            $meal->foods()->delete();
            foreach ($validated['foods'] as $food) {
                Food::create([
                    'meal_log_id' => $meal->id,
                    'name' => $food['name'],
                    'grams' => $food['grams'],
                    'calories' => $food['calories'],
                    'protein_g' => $food['protein_g'],
                    'carbs_g' => $food['carbs_g'],
                    'fat_g' => $food['fat_g'],
                    'confidence' => 1.0,
                    'health_score' => 85,
                ]);
            }
            $meal->recalculateTotals();
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật bữa ăn thành công!',
            'meal' => $meal->fresh()->load('foods'),
        ]);
    }

    /**
     * Delete a meal log.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $meal = $user->mealLogs()->findOrFail($id);
        $meal->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa bữa ăn thành công.',
        ]);
    }

    /**
     * Manually add a meal or food item without photo.
     */
    public function quickAdd(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'meal_type' => 'required|string|in:breakfast,lunch,dinner,snack',
            'name' => 'required|string',
            'grams' => 'nullable|numeric',
            'calories' => 'required|integer',
            'protein_g' => 'nullable|numeric',
            'carbs_g' => 'nullable|numeric',
            'fat_g' => 'nullable|numeric',
            'logged_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $loggedDate = $validated['logged_date'] ?? Carbon::today()->format('Y-m-d');

        $meal = MealLog::create([
            'user_id' => $user->id,
            'meal_type' => $validated['meal_type'],
            'status' => 'completed',
            'logged_date' => $loggedDate,
            'notes' => $validated['notes'] ?? null,
            'analyzed_at' => now(),
        ]);

        Food::create([
            'meal_log_id' => $meal->id,
            'name' => $validated['name'],
            'grams' => $validated['grams'] ?? 100,
            'calories' => $validated['calories'],
            'protein_g' => $validated['protein_g'] ?? 0,
            'carbs_g' => $validated['carbs_g'] ?? 0,
            'fat_g' => $validated['fat_g'] ?? 0,
            'confidence' => 1.0,
            'health_score' => 85,
        ]);

        $meal->recalculateTotals();

        return response()->json([
            'success' => true,
            'message' => 'Thêm món ăn thành công!',
            'meal' => $meal->load('foods'),
        ], 201);
    }
}
