<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;

// The Filament panel owns /admin. Send the bare domain there.
Route::redirect('/', '/admin');

/*
 * Legacy production overview (MRR, biểu đồ 7 ngày, webhook gần đây).
 *
 * Trước đây hai route này nằm ở "/" và "/admin" mà KHÔNG có xác thực gì cả:
 * bất kỳ ai mở URL cũng đọc được email toàn bộ người dùng, doanh thu và log
 * webhook, và POST được dữ liệu bữa ăn giả vào database.
 */
Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/reports', [AdminController::class, 'index'])->name('admin.reports');
    Route::post('/reports/simulate-ai', [AdminController::class, 'simulateAiScan'])->name('admin.simulate');
});
