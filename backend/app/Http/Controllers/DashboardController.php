<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Get primary dashboard data for today.
     */
    public function getToday(Request $request): JsonResponse
    {
        $user = $request->user();
        $date = $request->input('date');

        $data = $this->dashboardService->todaySummary($user, $date);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get 7-day weekly averages and trend chart.
     */
    public function getWeekly(Request $request): JsonResponse
    {
        $user = $request->user();
        $startDate = $request->input('start_date');

        $data = $this->dashboardService->weeklyAverage($user, $startDate);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
