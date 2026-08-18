<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;

Route::get('/', [AdminController::class, 'index'])->name('admin.home');
Route::get('/admin', [AdminController::class, 'index'])->name('admin.dashboard');
Route::post('/admin/simulate-ai', [AdminController::class, 'simulateAiScan'])->name('admin.simulate');
