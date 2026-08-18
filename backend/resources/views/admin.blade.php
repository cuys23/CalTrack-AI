<!DOCTYPE html>
<html lang="vi" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CalTrack AI — Production Admin Portal</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: {
                            50: '#ecfdf5',
                            400: '#34d399',
                            500: '#10b981',
                            600: '#059669',
                        },
                        dark: {
                            bg: '#090d16',
                            card: '#0f172a',
                            border: '#1e293b',
                        }
                    },
                    fontFamily: {
                        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- Chart.js & Lucide Icons -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .glass-panel {
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .glow-emerald {
            box-shadow: 0 0 25px -5px rgba(16, 185, 129, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
    </style>
</head>
<body class="bg-[#090d16] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white">

    <!-- Top Navigation Bar -->
    <header class="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
        <div class="flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-black text-xl text-white">
                <i data-lucide="sparkles" class="w-5 h-5"></i>
            </div>
            <div>
                <div class="flex items-center gap-2">
                    <span class="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">CalTrack AI</span>
                    <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Production v1.0
                    </span>
                </div>
                <p class="text-xs text-slate-400">Master Control Portal & AI Telemetry</p>
            </div>
        </div>

        <!-- Center Quick Tabs -->
        <div class="hidden md:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400">
            <button onclick="switchTab('overview')" id="tab-btn-overview" class="tab-btn px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1.5">
                <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Tổng quan
            </button>
            <button onclick="switchTab('meals')" id="tab-btn-meals" class="tab-btn px-4 py-2 rounded-lg hover:text-slate-200 hover:bg-slate-800/60 transition-all flex items-center gap-1.5">
                <i data-lucide="camera" class="w-4 h-4"></i> Quét AI & Bữa ăn
            </button>
            <button onclick="switchTab('users')" id="tab-btn-users" class="tab-btn px-4 py-2 rounded-lg hover:text-slate-200 hover:bg-slate-800/60 transition-all flex items-center gap-1.5">
                <i data-lucide="users" class="w-4 h-4"></i> Người dùng
            </button>
            <button onclick="switchTab('subscriptions')" id="tab-btn-subscriptions" class="tab-btn px-4 py-2 rounded-lg hover:text-slate-200 hover:bg-slate-800/60 transition-all flex items-center gap-1.5">
                <i data-lucide="credit-card" class="w-4 h-4"></i> Gói Pro & IAP
            </button>
            <button onclick="switchTab('webhooks')" id="tab-btn-webhooks" class="tab-btn px-4 py-2 rounded-lg hover:text-slate-200 hover:bg-slate-800/60 transition-all flex items-center gap-1.5">
                <i data-lucide="webhook" class="w-4 h-4"></i> Apple Webhook
            </button>
        </div>

        <!-- Right System Info & Quick Action -->
        <div class="flex items-center gap-3">
            <button onclick="triggerSimulateModal()" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-1.5">
                <i data-lucide="play" class="w-3.5 h-3.5"></i> Test AI Scan
            </button>
            <div class="flex items-center gap-2 pl-3 border-l border-slate-800">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" class="w-8 h-8 rounded-full ring-2 ring-emerald-500/30 object-cover" alt="Admin Avatar">
                <div class="hidden lg:block text-left">
                    <p class="text-xs font-bold text-slate-200">Admin CalTrack</p>
                    <p class="text-[10px] text-emerald-400 font-mono">SuperAdmin</p>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">

        <!-- ================= TAB: OVERVIEW ================= -->
        <div id="tab-overview" class="space-y-6">

            <!-- Metric Cards (4 Grid) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <!-- Card 1: Users -->
                <div class="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-slate-400">Tổng Người Dùng</span>
                        <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <i data-lucide="users" class="w-5 h-5"></i>
                        </div>
                    </div>
                    <div class="mt-4 flex items-baseline gap-2">
                        <span class="text-3xl font-extrabold text-white">{{ $totalUsers }}</span>
                        <span class="text-xs font-bold text-emerald-400 flex items-center"><i data-lucide="trending-up" class="w-3.5 h-3.5 mr-0.5"></i> +12%</span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-1">Đồng bộ theo thời gian thực</p>
                    <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
                </div>

                <!-- Card 2: MRR Revenue -->
                <div class="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-teal-500/40 transition-all">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-slate-400">Doanh Thu Ước Tính (MRR)</span>
                        <div class="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                            <i data-lucide="dollar-sign" class="w-5 h-5"></i>
                        </div>
                    </div>
                    <div class="mt-4 flex items-baseline gap-2">
                        <span class="text-3xl font-extrabold text-white">${{ number_format($estimatedMrr, 2) }}</span>
                        <span class="text-xs font-bold text-emerald-400 flex items-center"><i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i> Apple IAP</span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-1">Từ {{ $totalProSubscribers }} tài khoản Pro active</p>
                    <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-teal-500/5 rounded-full blur-xl group-hover:bg-teal-500/10 transition-all"></div>
                </div>

                <!-- Card 3: AI Meal Logs Scanned -->
                <div class="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-slate-400">Bữa Ăn Đã Quét Bằng AI</span>
                        <div class="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                            <i data-lucide="sparkles" class="w-5 h-5"></i>
                        </div>
                    </div>
                    <div class="mt-4 flex items-baseline gap-2">
                        <span class="text-3xl font-extrabold text-white">{{ $totalMealLogs }}</span>
                        <span class="text-xs font-bold text-cyan-400">98.6% Chuẩn xác</span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-1">{{ $todayMealsCount }} bữa ăn được ghi nhận hôm nay</p>
                    <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all"></div>
                </div>

                <!-- Card 4: Health Score -->
                <div class="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-slate-400">Điểm Healthy Trung Bình</span>
                        <div class="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                            <i data-lucide="activity" class="w-5 h-5"></i>
                        </div>
                    </div>
                    <div class="mt-4 flex items-baseline gap-2">
                        <span class="text-3xl font-extrabold text-indigo-400">{{ $avgHealthScore }}<span class="text-lg text-slate-500 font-normal">/100</span></span>
                        <span class="text-xs font-bold text-emerald-400">Tốt & Cân bằng</span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-1">Đánh giá dinh dưỡng chuẩn ISO</p>
                    <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all"></div>
                </div>

            </div>

            <!-- Main Charts & Live Feed Section -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- Left 2 Cols: Activity Chart -->
                <div class="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-bold text-base text-slate-100 flex items-center gap-2">
                                <i data-lucide="bar-chart-2" class="w-4 h-4 text-emerald-400"></i> Xu hướng quét AI & Lượng Calo tiêu thụ 7 ngày
                            </h3>
                            <p class="text-xs text-slate-400 mt-0.5">Dữ liệu ghi nhận từ hệ thống di động</p>
                        </div>
                        <span class="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 font-medium">7 ngày qua</span>
                    </div>
                    <div class="h-64 relative">
                        <canvas id="scansChart"></canvas>
                    </div>
                </div>

                <!-- Right 1 Col: Live AI Scan Activity Feed -->
                <div class="glass-panel p-6 rounded-2xl flex flex-col">
                    <div class="flex items-center justify-between pb-4 border-b border-slate-800">
                        <h3 class="font-bold text-sm text-slate-100 flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live AI Feed Mới Nhất
                        </h3>
                        <span class="text-[11px] font-mono text-slate-400">{{ $recentMeals->count() }} mục gần nhất</span>
                    </div>
                    <div class="flex-1 divide-y divide-slate-800/60 overflow-y-auto max-h-72 custom-scrollbar pr-1 mt-2 space-y-1">
                        @forelse($recentMeals as $meal)
                            <div class="py-2.5 flex items-center justify-between gap-3 group">
                                <div class="flex items-center gap-3">
                                    <img src="{{ $meal->image_url ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100' }}" class="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 group-hover:ring-emerald-500 transition-all" alt="Meal">
                                    <div>
                                        <p class="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                                            {{ $meal->foods->first()->name ?? 'Bữa ăn đã phân tích' }}
                                        </p>
                                        <div class="flex items-center gap-2 text-[11px] text-slate-400">
                                            <span class="capitalize text-slate-400">{{ $meal->meal_type }}</span>
                                            <span>•</span>
                                            <span class="text-emerald-400 font-semibold">{{ $meal->total_calories }} kcal</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold {{ $meal->health_score >= 85 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20' }}">
                                        {{ $meal->health_score }}đ
                                    </span>
                                    <p class="text-[10px] text-slate-500 mt-1">{{ $meal->created_at->diffForHumans() }}</p>
                                </div>
                            </div>
                        @empty
                            <div class="py-8 text-center text-slate-500 text-xs">Chưa có bữa ăn nào được ghi nhận.</div>
                        @endforelse
                    </div>
                </div>

            </div>

        </div>

        <!-- ================= TAB: MEALS & SCANNER ================= -->
        <div id="tab-meals" class="space-y-6 hidden">
            <div class="glass-panel p-6 rounded-2xl space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 class="font-bold text-base text-slate-100 flex items-center gap-2">
                            <i data-lucide="utensils" class="w-4 h-4 text-emerald-400"></i> Danh Sách Bữa Ăn & Dữ Liệu AI Vision Nhận Diện
                        </h3>
                        <p class="text-xs text-slate-400">Chi tiết thành phần gram, calo, protein, carb, fat và độ tin cậy AI</p>
                    </div>
                    <button onclick="triggerSimulateModal()" class="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 self-start">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i> Thử nghiệm quét món mới
                    </button>
                </div>

                <!-- Table of Meals -->
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="border-b border-slate-800 text-slate-400 font-semibold">
                                <th class="py-3 px-3">Món Ăn / Ảnh</th>
                                <th class="py-3 px-3">Người Dùng</th>
                                <th class="py-3 px-3">Bữa</th>
                                <th class="py-3 px-3 text-right">Calories</th>
                                <th class="py-3 px-3 text-right">Protein</th>
                                <th class="py-3 px-3 text-right">Carbs</th>
                                <th class="py-3 px-3 text-right">Fat</th>
                                <th class="py-3 px-3 text-center">Health Score</th>
                                <th class="py-3 px-3 text-center">Trạng Thái AI</th>
                                <th class="py-3 px-3 text-right">Ngày Ghi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60">
                            @foreach($recentMeals as $meal)
                                <tr class="hover:bg-slate-800/30 transition-colors">
                                    <td class="py-3 px-3">
                                        <div class="flex items-center gap-2.5">
                                            <img src="{{ $meal->image_url ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100' }}" class="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-700" alt="Dish">
                                            <div>
                                                <p class="font-bold text-slate-200">{{ $meal->foods->first()->name ?? 'Bữa ăn không tên' }}</p>
                                                <p class="text-[10px] text-slate-400">{{ $meal->foods->first()->grams ?? 100 }}g (Confidence: {{ $meal->foods->first()->confidence ?? 0.95 }})</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-3 px-3 text-slate-300 font-medium">{{ $meal->user->name ?? 'Người dùng ẩn danh' }}</td>
                                    <td class="py-3 px-3 capitalize">
                                        <span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold">{{ $meal->meal_type }}</span>
                                    </td>
                                    <td class="py-3 px-3 text-right font-bold text-emerald-400">{{ $meal->total_calories }} kcal</td>
                                    <td class="py-3 px-3 text-right font-medium text-cyan-400">{{ $meal->total_protein_g }}g</td>
                                    <td class="py-3 px-3 text-right font-medium text-amber-400">{{ $meal->total_carbs_g }}g</td>
                                    <td class="py-3 px-3 text-right font-medium text-rose-400">{{ $meal->total_fat_g }}g</td>
                                    <td class="py-3 px-3 text-center">
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            {{ $meal->health_score }}/100
                                        </span>
                                    </td>
                                    <td class="py-3 px-3 text-center">
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Hoàn tất</span>
                                    </td>
                                    <td class="py-3 px-3 text-right text-slate-400 font-mono">{{ $meal->logged_date ? $meal->logged_date->format('d/m/Y') : $meal->created_at->format('d/m/Y') }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ================= TAB: USERS ================= -->
        <div id="tab-users" class="space-y-6 hidden">
            <div class="glass-panel p-6 rounded-2xl space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-bold text-base text-slate-100 flex items-center gap-2">
                            <i data-lucide="users" class="w-4 h-4 text-emerald-400"></i> Quản Lý Tài Khoản Người Dùng ({{ $totalUsers }})
                        </h3>
                        <p class="text-xs text-slate-400">Thể trạng, mục tiêu dinh dưỡng và phân quyền Apple Pro</p>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="border-b border-slate-800 text-slate-400 font-semibold">
                                <th class="py-3 px-3">Người Dùng</th>
                                <th class="py-3 px-3">Email</th>
                                <th class="py-3 px-3">Giới Tính / Tuổi</th>
                                <th class="py-3 px-3">Cân Nặng / Mục Tiêu</th>
                                <th class="py-3 px-3">Mục Tiêu Calo</th>
                                <th class="py-3 px-3 text-center">Gói Subscription</th>
                                <th class="py-3 px-3 text-right">Ngày Tham Gia</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60">
                            @forelse($users as $u)
                                <tr class="hover:bg-slate-800/30 transition-colors">
                                    <td class="py-3 px-3">
                                        <div class="flex items-center gap-2.5">
                                            <div class="w-8 h-8 rounded-full bg-slate-800 font-bold text-slate-300 flex items-center justify-center border border-slate-700">
                                                {{ strtoupper(substr($u->name, 0, 1)) }}
                                            </div>
                                            <span class="font-bold text-slate-200">{{ $u->name }}</span>
                                        </div>
                                    </td>
                                    <td class="py-3 px-3 text-slate-400 font-mono">{{ $u->email }}</td>
                                    <td class="py-3 px-3 text-slate-300 capitalize">{{ $u->gender ?? 'N/A' }} ({{ $u->birthday ? \Carbon\Carbon::parse($u->birthday)->age : '—' }} tuổi)</td>
                                    <td class="py-3 px-3">
                                        <span class="font-bold text-white">{{ $u->current_weight_kg ?? '—' }} kg</span> 
                                        <span class="text-slate-500">➜</span> 
                                        <span class="text-emerald-400 font-semibold">{{ $u->target_weight_kg ?? '—' }} kg</span>
                                    </td>
                                    <td class="py-3 px-3 font-mono font-bold text-amber-400">
                                        {{ $u->dailyGoal->target_calories ?? 2000 }} kcal
                                    </td>
                                    <td class="py-3 px-3 text-center">
                                        @if($u->isPremium())
                                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-sm flex items-center justify-center gap-1 mx-auto w-max">
                                                <i data-lucide="crown" class="w-3 h-3"></i> PRO
                                            </span>
                                        @else
                                            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">Free</span>
                                        @endif
                                    </td>
                                    <td class="py-3 px-3 text-right text-slate-400 font-mono">{{ $u->created_at->format('d/m/Y') }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="7" class="py-8 text-center text-slate-500">Chưa có người dùng nào đăng ký trên hệ thống.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ================= TAB: SUBSCRIPTIONS ================= -->
        <div id="tab-subscriptions" class="space-y-6 hidden">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="glass-panel p-5 rounded-2xl border-emerald-500/30">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-slate-400">Gói Tháng (1 Month Pro)</span>
                        <span class="text-emerald-400 font-bold">$4.99/tháng</span>
                    </div>
                    <p class="text-2xl font-extrabold text-white mt-2">Active</p>
                    <p class="text-xs text-slate-500 mt-1">Dùng thử 7 ngày miễn phí</p>
                </div>
                <div class="glass-panel p-5 rounded-2xl border-cyan-500/30">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-slate-400">Gói Năm (1 Year Pro -50%)</span>
                        <span class="text-cyan-400 font-bold">$29.99/năm</span>
                    </div>
                    <p class="text-2xl font-extrabold text-white mt-2">Phổ biến nhất</p>
                    <p class="text-xs text-slate-500 mt-1">Tiết kiệm 50% chi phí</p>
                </div>
                <div class="glass-panel p-5 rounded-2xl border-amber-500/30">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-slate-400">Gói Trọn Đời (Lifetime)</span>
                        <span class="text-amber-400 font-bold">$69.99</span>
                    </div>
                    <p class="text-2xl font-extrabold text-white mt-2">Non-consumable</p>
                    <p class="text-xs text-slate-500 mt-1">Truy cập vĩnh viễn</p>
                </div>
            </div>

            <div class="glass-panel p-6 rounded-2xl space-y-4">
                <h3 class="font-bold text-base text-slate-100 flex items-center gap-2">
                    <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i> Danh Sách Giao Dịch & Entitlement Apple IAP Đang Kích Hoạt
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="border-b border-slate-800 text-slate-400 font-semibold">
                                <th class="py-3 px-3">Người Dùng</th>
                                <th class="py-3 px-3">Gói Sản Phẩm</th>
                                <th class="py-3 px-3">Original Transaction ID</th>
                                <th class="py-3 px-3">Môi Trường</th>
                                <th class="py-3 px-3">Tự Động Gia Hạn</th>
                                <th class="py-3 px-3">Ngày Hết Hạn</th>
                                <th class="py-3 px-3 text-right">Trạng Thái</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60">
                            @forelse($subscriptions as $sub)
                                <tr class="hover:bg-slate-800/30 transition-colors">
                                    <td class="py-3 px-3 font-bold text-slate-200">{{ $sub->user->name ?? 'Người dùng' }}</td>
                                    <td class="py-3 px-3 font-mono text-emerald-400">{{ $sub->product_id }}</td>
                                    <td class="py-3 px-3 font-mono text-slate-400 text-[11px]">{{ $sub->original_transaction_id }}</td>
                                    <td class="py-3 px-3"><span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">{{ $sub->environment }}</span></td>
                                    <td class="py-3 px-3">
                                        @if($sub->auto_renew_status)
                                            <span class="text-emerald-400 font-semibold flex items-center gap-1"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Bật</span>
                                        @else
                                            <span class="text-rose-400 font-semibold flex items-center gap-1"><i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Tắt</span>
                                        @endif
                                    </td>
                                    <td class="py-3 px-3 text-slate-300 font-mono">{{ $sub->expires_at ? $sub->expires_at->format('d/m/Y H:i') : 'Vĩnh viễn' }}</td>
                                    <td class="py-3 px-3 text-right">
                                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                                            {{ $sub->status }}
                                        </span>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="7" class="py-8 text-center text-slate-500">Chưa có giao dịch subscription Apple IAP nào.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ================= TAB: WEBHOOKS ================= -->
        <div id="tab-webhooks" class="space-y-6 hidden">
            <div class="glass-panel p-6 rounded-2xl space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-bold text-base text-slate-100 flex items-center gap-2">
                            <i data-lucide="radio" class="w-4 h-4 text-emerald-400"></i> Nhật Ký Apple App Store Server Notifications V2
                        </h3>
                        <p class="text-xs text-slate-400">Đã tiếp nhận và xử lý chữ ký số JWS từ máy chủ Apple</p>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="border-b border-slate-800 text-slate-400 font-semibold">
                                <th class="py-3 px-3">Sự Kiện (Notification Type)</th>
                                <th class="py-3 px-3">Subtype</th>
                                <th class="py-3 px-3">UUID</th>
                                <th class="py-3 px-3">Original TxID</th>
                                <th class="py-3 px-3">Môi Trường</th>
                                <th class="py-3 px-3 text-right">Thời Gian</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60">
                            @forelse($webhooks as $wh)
                                <tr class="hover:bg-slate-800/30 transition-colors">
                                    <td class="py-3 px-3 font-mono font-bold text-emerald-400">{{ $wh->notification_type }}</td>
                                    <td class="py-3 px-3 text-slate-300">{{ $wh->subtype ?? 'NONE' }}</td>
                                    <td class="py-3 px-3 font-mono text-slate-400 text-[11px]">{{ $wh->notification_uuid }}</td>
                                    <td class="py-3 px-3 font-mono text-slate-300">{{ $wh->original_transaction_id ?? 'N/A' }}</td>
                                    <td class="py-3 px-3"><span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">{{ $wh->environment }}</span></td>
                                    <td class="py-3 px-3 text-right text-slate-400 font-mono">{{ $wh->processed_at ? $wh->processed_at->diffForHumans() : $wh->created_at->diffForHumans() }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="6" class="py-6 text-center text-slate-500">Chưa có webhook nào được ghi nhận.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </main>

    <!-- Modal: Test AI Vision Scan Simulator -->
    <div id="aiModal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 hidden flex items-center justify-center p-4">
        <div class="glass-panel border border-slate-700 max-w-md w-full p-6 rounded-3xl space-y-4 shadow-2xl relative">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <i data-lucide="sparkles" class="w-4 h-4"></i>
                    </div>
                    <h3 class="font-bold text-base text-slate-100">Mô phỏng Quét AI Vision</h3>
                </div>
                <button onclick="closeModal()" class="text-slate-400 hover:text-white p-1">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <p class="text-xs text-slate-400">Chọn hoặc nhập tên món ăn để kiểm tra pipeline nhận diện dinh dưỡng và macro theo thời gian thực.</p>
            
            <div class="space-y-3">
                <div>
                    <label class="text-xs font-semibold text-slate-300">Tên món ăn hoặc gợi ý ảnh:</label>
                    <input type="text" id="aiHintInput" value="Phở Bò Tái Nạm (1 Tô)" class="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500">
                </div>
                <div class="flex flex-wrap gap-1.5">
                    <button onclick="setHint('Phở Bò Tái Nạm (1 Tô)')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px]">Phở Bò</button>
                    <button onclick="setHint('Cơm Tấm Sườn Bì Chả')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px]">Cơm Tấm Sườn</button>
                    <button onclick="setHint('Salad Ức Gà Nướng Sốt Mè')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px]">Salad Ức Gà</button>
                    <button onclick="setHint('Bánh Mì Thịt Nguội Pate')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px]">Bánh Mì</button>
                </div>
            </div>

            <div id="aiResultBox" class="hidden p-3 bg-slate-950/80 rounded-xl border border-emerald-500/30 text-xs space-y-1">
                <p class="font-bold text-emerald-400" id="aiResultText">Đã quét thành công!</p>
            </div>

            <div class="flex items-center gap-3 pt-2">
                <button onclick="closeModal()" class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all">Đóng</button>
                <button onclick="executeAiScan()" id="btnRunScan" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5">
                    <i data-lucide="play" class="w-3.5 h-3.5"></i> Chạy AI Engine
                </button>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script>
        // Init Lucide Icons
        lucide.createIcons();

        // Tab Switching
        function switchTab(tabId) {
            const tabs = ['overview', 'meals', 'users', 'subscriptions', 'webhooks'];
            tabs.forEach(t => {
                const el = document.getElementById(`tab-${t}`);
                const btn = document.getElementById(`tab-btn-${t}`);
                if (t === tabId) {
                    el.classList.remove('hidden');
                    btn.classList.add('bg-emerald-500/10', 'text-emerald-400', 'border', 'border-emerald-500/30');
                    btn.classList.remove('text-slate-400');
                } else {
                    el.classList.add('hidden');
                    btn.classList.remove('bg-emerald-500/10', 'text-emerald-400', 'border', 'border-emerald-500/30');
                    btn.classList.add('text-slate-400');
                }
            });
            lucide.createIcons();
        }

        // Modal Controls
        function triggerSimulateModal() {
            document.getElementById('aiModal').classList.remove('hidden');
            document.getElementById('aiResultBox').classList.add('hidden');
        }
        function closeModal() {
            document.getElementById('aiModal').classList.add('hidden');
        }
        function setHint(val) {
            document.getElementById('aiHintInput').value = val;
        }

        // AI Scan simulation API
        async function executeAiScan() {
            const hint = document.getElementById('aiHintInput').value;
            const btn = document.getElementById('btnRunScan');
            btn.innerHTML = `<span class="animate-spin mr-1">⏳</span> Đang phân tích...`;
            btn.disabled = true;

            try {
                const res = await fetch('/admin/simulate-ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
                    body: JSON.stringify({ hint })
                });
                const data = await res.json();
                
                const box = document.getElementById('aiResultBox');
                box.classList.remove('hidden');
                document.getElementById('aiResultText').innerHTML = `✅ ${data.message} • ${data.meal.total_calories} kcal (${data.meal.total_protein_g}g Protein, ${data.meal.total_carbs_g}g Carb, ${data.meal.total_fat_g}g Fat)`;
                
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } catch (e) {
                alert('Lỗi kết nối AI');
            } finally {
                btn.innerHTML = `<i data-lucide="play" class="w-3.5 h-3.5 mr-1"></i> Chạy AI Engine`;
                btn.disabled = false;
                lucide.createIcons();
            }
        }

        // Chart.js initialization
        document.addEventListener('DOMContentLoaded', () => {
            const ctx = document.getElementById('scansChart').getContext('2d');
            
            const gradient = ctx.createLinearGradient(0, 0, 0, 260);
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

            const gradientCal = ctx.createLinearGradient(0, 0, 0, 260);
            gradientCal.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
            gradientCal.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: {!! json_encode($chartDates) !!},
                    datasets: [
                        {
                            label: 'Số Lượt Quét Món Ăn',
                            data: {!! json_encode($chartScans) !!},
                            borderColor: '#10b981',
                            borderWidth: 3,
                            backgroundColor: gradient,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#10b981',
                            pointBorderColor: '#fff',
                            pointRadius: 4,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Calo Trung Bình (kcal)',
                            data: {!! json_encode($chartCalories) !!},
                            borderColor: '#06b6d4',
                            borderWidth: 2,
                            borderDash: [4, 4],
                            backgroundColor: gradientCal,
                            fill: false,
                            tension: 0.4,
                            pointRadius: 3,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: {
                            labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans', size: 11 } }
                        },
                        y: {
                            type: 'linear',
                            position: 'left',
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#10b981', font: { family: 'Plus Jakarta Sans', size: 11 } }
                        },
                        y1: {
                            type: 'linear',
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            ticks: { color: '#06b6d4', font: { family: 'Plus Jakarta Sans', size: 11 } }
                        }
                    }
                }
            });
        });
    </script>
</body>
</html>
