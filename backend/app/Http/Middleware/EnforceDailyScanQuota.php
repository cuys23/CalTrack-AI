<?php

namespace App\Http\Middleware;

use App\Models\MealLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Caps how many AI scans one account may run per day.
 *
 * Every scan costs money at the vision provider. Per-minute throttling limits
 * burst rate but places no ceiling on the daily bill, so a single subscriber —
 * or a stolen token — could run scans continuously for the price of one
 * subscription.
 *
 * The limit is deliberately far above ordinary use: someone logging every meal
 * and retrying a few times stays well beneath it.
 */
class EnforceDailyScanQuota
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $limit = (int) config('services.ai_vision.daily_scan_limit');

        // A non-positive limit disables the cap, which is a deployment choice
        // rather than an accident, so it is honoured rather than treated as an
        // error.
        if ($limit <= 0) {
            return $next($request);
        }

        $usedToday = MealLog::where('user_id', $user->id)
            ->whereDate('created_at', now()->toDateString())
            ->whereNotNull('image_url')
            ->count();

        if ($usedToday >= $limit) {
            return response()->json([
                'success' => false,
                'message' => "Bạn đã dùng hết {$limit} lượt quét AI hôm nay. Vui lòng thử lại vào ngày mai.",
                'quota_used' => $usedToday,
                'quota_limit' => $limit,
            ], 429);
        }

        return $next($request);
    }
}
