<?php

namespace App\Http\Controllers;

use App\Models\WeightLog;
use App\Services\WeightService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WeightController extends Controller
{
    protected WeightService $weightService;

    public function __construct(WeightService $weightService)
    {
        $this->weightService = $weightService;
    }

    /**
     * Log a new weight or body measurement.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'weight_kg' => 'required|numeric|min:20|max:300',
            'body_fat_percentage' => 'nullable|numeric|min:3|max:60',
            'waist_cm' => 'nullable|numeric|min:30|max:200',
            'chest_cm' => 'nullable|numeric|min:30|max:200',
            'hips_cm' => 'nullable|numeric|min:30|max:200',
            'notes' => 'nullable|string|max:500',
            'logged_date' => 'nullable|date',
        ]);

        $user = $request->user();
        $date = $validated['logged_date'] ?? Carbon::today()->format('Y-m-d');

        $log = WeightLog::updateOrCreate(
            [
                'user_id' => $user->id,
                'logged_date' => $date,
            ],
            [
                'weight_kg' => $validated['weight_kg'],
                'body_fat_percentage' => $validated['body_fat_percentage'] ?? null,
                'waist_cm' => $validated['waist_cm'] ?? null,
                'chest_cm' => $validated['chest_cm'] ?? null,
                'hips_cm' => $validated['hips_cm'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        // Update user's current weight attribute
        $user->current_weight_kg = $validated['weight_kg'];
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Đã ghi nhận cân nặng thành công!',
            'log' => $log,
        ], 201);
    }

    /**
     * Get weight logs history and progress metrics.
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        $limit = $request->integer('limit', 30);

        $summary = $this->weightService->getHistory($user, $limit);

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Delete a weight log entry.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $log = $user->weightLogs()->findOrFail($id);
        $log->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa bản ghi cân nặng.',
        ]);
    }
}
