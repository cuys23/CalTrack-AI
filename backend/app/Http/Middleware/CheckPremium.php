<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPremium
{
    /**
     * Handle an incoming request.
     * Check if user has an active premium entitlement without relying on a static boolean column.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$user->isPremium()) {
            return response()->json([
                'success' => false,
                'is_premium' => false,
                'message' => 'This feature requires an active CalTrack Pro subscription.',
                'upgrade_url' => '/api/iap/products',
            ], 403);
        }

        return $next($request);
    }
}
