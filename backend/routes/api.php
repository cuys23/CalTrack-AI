<?php

use App\Http\Controllers\AppStoreWebhookController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\IapController;
use App\Http\Controllers\LegalController;
use App\Http\Controllers\MealController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WeightController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'framework' => 'Laravel 12',
        'app' => 'CalTrack AI Production Backend',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Legal & App Store Compliance
Route::get('/legal/privacy', [LegalController::class, 'privacy']);
Route::get('/legal/terms', [LegalController::class, 'terms']);
Route::get('/legal/eula', [LegalController::class, 'eula']);

// IAP Products
Route::get('/iap/products', [IapController::class, 'getProducts']);

// Apple App Store Server Notifications V2 Webhook
Route::post('/webhooks/app-store', [AppStoreWebhookController::class, 'handleWebhook']);

// Authentication with Rate Limiting (10 requests/minute)
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/apple', [AuthController::class, 'appleLogin']);
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    
    // User & Account Management
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/delete-account', [AuthController::class, 'deleteAccount']); // Apple Guideline 5.1.1

    // User Profile
    Route::get('/profile', [ProfileController::class, 'getProfile']);
    Route::put('/profile', [ProfileController::class, 'updateProfile']);

    // Goals & TDEE
    Route::get('/goals', [GoalController::class, 'getGoals']);
    Route::put('/goals', [GoalController::class, 'updateGoals']);
    Route::post('/goals/recalculate', [GoalController::class, 'recalculate']);

    // Apple In-App Purchase & Entitlements
    Route::post('/iap/verify', [IapController::class, 'verify']);
    Route::post('/iap/restore', [IapController::class, 'restore']);
    Route::get('/iap/status', [IapController::class, 'status']);

    // Dashboard & Analytics
    Route::get('/dashboard', [DashboardController::class, 'getToday']);
    Route::get('/dashboard/weekly', [DashboardController::class, 'getWeekly']);

    // Weight Tracking
    Route::post('/weight', [WeightController::class, 'store']);
    Route::get('/weight/history', [WeightController::class, 'history']);
    Route::delete('/weight/{id}', [WeightController::class, 'destroy']);

    // Meal Logs & AI Scanning
    Route::get('/meal', [MealController::class, 'indexByDate']);
    Route::get('/meal/jobs/{id}', [MealController::class, 'getJobStatus']);
    Route::get('/meal/{id}', [MealController::class, 'show']);
    Route::put('/meal/{id}', [MealController::class, 'update']);
    Route::delete('/meal/{id}', [MealController::class, 'destroy']);
    Route::post('/meal/quick-add', [MealController::class, 'quickAdd']);

    // AI Vision Scan (Rate limited to 15 req/min)
    Route::middleware('throttle:15,1')->group(function () {
        Route::post('/meal/analyze', [MealController::class, 'analyze']);
    });
});
