<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\LegalController;
use Illuminate\Support\Facades\Route;

/*
| Public legal pages. App Store Connect requires a Privacy Policy URL and a
| Support URL that open in a browser, and App Review reads them without an
| account, so these must stay unauthenticated.
*/
Route::get('/legal/privacy', [LegalController::class, 'privacyPage'])->name('legal.privacy');
Route::get('/legal/terms', [LegalController::class, 'termsPage'])->name('legal.terms');
Route::get('/support', [LegalController::class, 'supportPage'])->name('legal.support');

/*
| The dashboard exposes every user record, subscription, and revenue figure, so
| all of its routes sit behind operator credentials.
*/
Route::middleware('admin.auth')->group(function () {
    Route::get('/', [AdminController::class, 'index'])->name('admin.home');
    Route::get('/admin', [AdminController::class, 'index'])->name('admin.dashboard');

    // Writes fabricated meal data into a real account, which has no place in
    // production regardless of who is authenticated.
    if (app()->environment('local', 'testing')) {
        Route::post('/admin/simulate-ai', [AdminController::class, 'simulateAiScan'])->name('admin.simulate');
    }
});
