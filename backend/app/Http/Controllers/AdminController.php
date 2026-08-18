<?php

namespace App\Http\Controllers;

use App\Models\AppStoreNotification;
use App\Models\Food;
use App\Models\IapTransaction;
use App\Models\MealLog;
use App\Models\Subscription;
use App\Models\SubscriptionProduct;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Render the CalTrack AI Master Production Admin Dashboard.
     */
    public function index()
    {
        $totalUsers = User::count();
        $totalProSubscribers = Subscription::where('status', 'active')->where(function ($q) {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        })->count();

        $totalMealLogs = MealLog::count();
        $todayMealsCount = MealLog::whereDate('created_at', Carbon::today())->count();
        $avgHealthScore = (int) round(MealLog::where('status', 'completed')->avg('health_score') ?? 86);

        // MRR Calculation
        $activeSubs = Subscription::with('user')->where('status', 'active')->get();
        $estimatedMrr = 0.0;
        foreach ($activeSubs as $sub) {
            if (str_contains($sub->product_id, 'monthly')) {
                $estimatedMrr += 4.99;
            } elseif (str_contains($sub->product_id, 'yearly')) {
                $estimatedMrr += (29.99 / 12);
            } elseif (str_contains($sub->product_id, 'lifetime')) {
                $estimatedMrr += (69.99 / 24);
            }
        }
        $estimatedMrr = round($estimatedMrr, 2);

        // Latest AI Scans
        $recentMeals = MealLog::with(['user', 'foods'])
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Users List
        $users = User::with(['dailyGoal', 'activeSubscription'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        // Subscriptions List
        $subscriptions = Subscription::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Webhook events
        $webhooks = AppStoreNotification::orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // 7-day Meal Analytics Chart Data
        $chartDates = [];
        $chartScans = [];
        $chartCalories = [];
        for ($i = 6; $i >= 0; $i--) {
            $d = Carbon::today()->subDays($i);
            $dStr = $d->format('Y-m-d');
            $chartDates[] = $d->format('d/m');
            $chartScans[] = MealLog::whereDate('logged_date', $dStr)->count();
            $chartCalories[] = (int) (MealLog::whereDate('logged_date', $dStr)->avg('total_calories') ?? 0);
        }

        return view('admin', compact(
            'totalUsers',
            'totalProSubscribers',
            'totalMealLogs',
            'todayMealsCount',
            'avgHealthScore',
            'estimatedMrr',
            'recentMeals',
            'users',
            'subscriptions',
            'webhooks',
            'chartDates',
            'chartScans',
            'chartCalories'
        ));
    }

    /**
     * API to simulate an AI Vision Scan from Admin Dashboard.
     */
    public function simulateAiScan(Request $request): JsonResponse
    {
        $hint = $request->input('hint', 'Phở bò tái');
        $user = User::first() ?? User::factory()->create();

        $meal = MealLog::create([
            'user_id' => $user->id,
            'image_url' => 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=300',
            'meal_type' => 'lunch',
            'status' => 'completed',
            'total_calories' => 540,
            'total_protein_g' => 34,
            'total_carbs_g' => 68,
            'total_fat_g' => 15,
            'health_score' => 88,
            'logged_date' => Carbon::today()->format('Y-m-d'),
            'analyzed_at' => now(),
        ]);

        Food::create([
            'meal_log_id' => $meal->id,
            'name' => $hint,
            'grams' => 450,
            'calories' => 540,
            'protein_g' => 34,
            'carbs_g' => 68,
            'fat_g' => 15,
            'confidence' => 0.98,
            'health_score' => 88,
        ]);

        return response()->json([
            'success' => true,
            'message' => "AI Vision nhận diện thành công: {$hint}",
            'meal' => $meal->load('foods'),
        ]);
    }
}
