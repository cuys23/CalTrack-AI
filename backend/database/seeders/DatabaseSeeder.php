<?php

namespace Database\Seeders;

use App\Models\AppStoreNotification;
use App\Models\DailyGoal;
use App\Models\Food;
use App\Models\IapTransaction;
use App\Models\MealLog;
use App\Models\Subscription;
use App\Models\SubscriptionProduct;
use App\Models\User;
use App\Models\WeightLog;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Subscription Products
        $monthly = SubscriptionProduct::updateOrCreate(
            ['product_id' => 'com.caltrack.monthly_pro'],
            [
                'name' => 'CalTrack Pro Hàng Tháng',
                'type' => 'auto_renewable',
                'duration' => '1_month',
                'price_usd' => 4.99,
                'trial_days' => 7,
                'is_active' => true,
            ]
        );

        $yearly = SubscriptionProduct::updateOrCreate(
            ['product_id' => 'com.caltrack.yearly_pro'],
            [
                'name' => 'CalTrack Pro 1 Năm (Tiết kiệm 50%)',
                'type' => 'auto_renewable',
                'duration' => '1_year',
                'price_usd' => 29.99,
                'trial_days' => 7,
                'is_active' => true,
            ]
        );

        $lifetime = SubscriptionProduct::updateOrCreate(
            ['product_id' => 'com.caltrack.lifetime_pro'],
            [
                'name' => 'CalTrack Pro Trọn Đời',
                'type' => 'non_consumable',
                'duration' => 'lifetime',
                'price_usd' => 69.99,
                'trial_days' => 0,
                'is_active' => true,
            ]
        );

        // 2. Admin / Demo User
        $admin = User::updateOrCreate(
            ['email' => 'admin@caltrack.ai'],
            [
                'name' => 'Admin CalTrack',
                'password' => Hash::make('admin123456'),
                'gender' => 'male',
                'birthday' => '1996-03-24',
                'height_cm' => 176,
                'current_weight_kg' => 71.5,
                'target_weight_kg' => 68.0,
                'activity_level' => 'moderate',
                'avatar_url' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            ]
        );

        DailyGoal::updateOrCreate(
            ['user_id' => $admin->id],
            [
                'target_calories' => 2150,
                'protein_g' => 160,
                'carbs_g' => 220,
                'fat_g' => 65,
                'goal_type' => 'lose_weight',
                'water_target_ml' => 2500,
            ]
        );

        Subscription::updateOrCreate(
            ['original_transaction_id' => '1000000888888'],
            [
                'user_id' => $admin->id,
                'product_id' => 'com.caltrack.yearly_pro',
                'status' => 'active',
                'starts_at' => now()->subMonths(2),
                'expires_at' => now()->addMonths(10),
                'auto_renew_status' => true,
                'environment' => 'Production',
            ]
        );

        // 3. Sample Users
        $sampleUsersData = [
            ['name' => 'Nguyễn Minh Quân', 'email' => 'quan.nguyen@gmail.com', 'gender' => 'male', 'weight' => 78.5, 'target' => 72.0, 'height' => 178, 'pro' => true, 'plan' => 'com.caltrack.yearly_pro'],
            ['name' => 'Lê Thu Thảo', 'email' => 'thuthao.le@gmail.com', 'gender' => 'female', 'weight' => 54.2, 'target' => 50.0, 'height' => 162, 'pro' => true, 'plan' => 'com.caltrack.monthly_pro'],
            ['name' => 'Trần Hoàng Nam', 'email' => 'nam.tran@gmail.com', 'gender' => 'male', 'weight' => 84.0, 'target' => 76.0, 'height' => 180, 'pro' => false, 'plan' => null],
            ['name' => 'Phạm Quỳnh Anh', 'email' => 'quynhanh.pham@gmail.com', 'gender' => 'female', 'weight' => 49.0, 'target' => 52.0, 'height' => 158, 'pro' => true, 'plan' => 'com.caltrack.monthly_pro'],
            ['name' => 'Vũ Tuấn Kiệt', 'email' => 'tuankiet.vu@gmail.com', 'gender' => 'male', 'weight' => 67.5, 'target' => 70.0, 'height' => 172, 'pro' => true, 'plan' => 'com.caltrack.lifetime_pro'],
            ['name' => 'Hoàng Mai Hương', 'email' => 'maihuong.h@gmail.com', 'gender' => 'female', 'weight' => 61.0, 'target' => 55.0, 'height' => 165, 'pro' => false, 'plan' => null],
            ['name' => 'Đặng Quốc Bảo', 'email' => 'quocbao.dang@gmail.com', 'gender' => 'male', 'weight' => 92.0, 'target' => 82.0, 'height' => 183, 'pro' => true, 'plan' => 'com.caltrack.yearly_pro'],
        ];

        $dishes = [
            ['name' => 'Phở Bò Tái Nạm', 'grams' => 450, 'calories' => 540, 'protein' => 34, 'carbs' => 68, 'fat' => 15, 'score' => 88, 'img' => 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=300'],
            ['name' => 'Cơm Tấm Sườn Bì Chả', 'grams' => 420, 'calories' => 720, 'protein' => 42, 'carbs' => 82, 'fat' => 26, 'score' => 75, 'img' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'],
            ['name' => 'Bún Chả Hà Nội', 'grams' => 380, 'calories' => 580, 'protein' => 36, 'carbs' => 64, 'fat' => 20, 'score' => 82, 'img' => 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=300'],
            ['name' => 'Salad Ức Gà Sốt Mè Rang', 'grams' => 320, 'calories' => 390, 'protein' => 44, 'carbs' => 16, 'fat' => 16, 'score' => 97, 'img' => 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300'],
            ['name' => 'Bánh Mì Thịt Nguội Pate', 'grams' => 190, 'calories' => 460, 'protein' => 19, 'carbs' => 54, 'fat' => 18, 'score' => 78, 'img' => 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300'],
            ['name' => 'Cá Hồi Áp Chảo Măng Tây', 'grams' => 280, 'calories' => 480, 'protein' => 46, 'carbs' => 8, 'fat' => 28, 'score' => 98, 'img' => 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300'],
            ['name' => 'Sinh Tố Bơ Chuối Protein', 'grams' => 350, 'calories' => 340, 'protein' => 25, 'carbs' => 38, 'fat' => 12, 'score' => 92, 'img' => 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=300'],
        ];

        foreach ($sampleUsersData as $uData) {
            $user = User::updateOrCreate(
                ['email' => $uData['email']],
                [
                    'name' => $uData['name'],
                    'password' => Hash::make('password123'),
                    'gender' => $uData['gender'],
                    'birthday' => '1995-06-12',
                    'height_cm' => $uData['height'],
                    'current_weight_kg' => $uData['weight'],
                    'target_weight_kg' => $uData['target'],
                    'activity_level' => 'moderate',
                ]
            );

            DailyGoal::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'target_calories' => $uData['gender'] === 'male' ? 2200 : 1750,
                    'protein_g' => $uData['gender'] === 'male' ? 160 : 120,
                    'carbs_g' => $uData['gender'] === 'male' ? 240 : 180,
                    'fat_g' => 60,
                    'goal_type' => $uData['weight'] > $uData['target'] ? 'lose_weight' : 'maintain',
                    'water_target_ml' => 2200,
                ]
            );

            if ($uData['pro'] && $uData['plan']) {
                $txId = '1000000' . rand(100000, 999999);
                Subscription::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'product_id' => $uData['plan'],
                        'original_transaction_id' => $txId,
                        'status' => 'active',
                        'starts_at' => now()->subDays(rand(5, 60)),
                        'expires_at' => now()->addDays(rand(30, 300)),
                        'auto_renew_status' => true,
                        'environment' => 'Production',
                    ]
                );

                IapTransaction::create([
                    'user_id' => $user->id,
                    'original_transaction_id' => $txId,
                    'transaction_id' => $txId,
                    'product_id' => $uData['plan'],
                    'purchase_date' => now()->subDays(15),
                    'expires_date' => now()->addMonths(1),
                    'type' => 'Auto-Renewable Subscription',
                    'status' => 'success',
                ]);
            }

            // Create 3-5 meal logs across the last 3 days
            for ($d = 0; $d < 3; $d++) {
                $logDate = Carbon::today()->subDays($d)->format('Y-m-d');
                $mealTypes = ['breakfast', 'lunch', 'dinner'];
                foreach ($mealTypes as $mType) {
                    $dish = $dishes[array_rand($dishes)];
                    $mealLog = MealLog::create([
                        'user_id' => $user->id,
                        'image_url' => $dish['img'],
                        'meal_type' => $mType,
                        'status' => 'completed',
                        'total_calories' => $dish['calories'],
                        'total_protein_g' => $dish['protein'],
                        'total_carbs_g' => $dish['carbs'],
                        'total_fat_g' => $dish['fat'],
                        'health_score' => $dish['score'],
                        'logged_date' => $logDate,
                        'analyzed_at' => now()->subDays($d),
                    ]);

                    Food::create([
                        'meal_log_id' => $mealLog->id,
                        'name' => $dish['name'],
                        'grams' => $dish['grams'],
                        'calories' => $dish['calories'],
                        'protein_g' => $dish['protein'],
                        'carbs_g' => $dish['carbs'],
                        'fat_g' => $dish['fat'],
                        'confidence' => 0.96,
                        'health_score' => $dish['score'],
                    ]);
                }

                // Weight log entry
                WeightLog::updateOrCreate(
                    ['user_id' => $user->id, 'logged_date' => $logDate],
                    [
                        'weight_kg' => $uData['weight'] + ($d * 0.2),
                        'body_fat_percentage' => 18.5,
                        'waist_cm' => 78.0,
                    ]
                );
            }
        }

        // 4. Sample Webhook notifications
        AppStoreNotification::create([
            'notification_uuid' => (string) \Illuminate\Support\Str::uuid(),
            'notification_type' => 'SUBSCRIBED',
            'subtype' => 'INITIAL_BUY',
            'original_transaction_id' => '1000000888888',
            'environment' => 'Production',
            'processed_at' => now()->subDays(2),
        ]);

        AppStoreNotification::create([
            'notification_uuid' => (string) \Illuminate\Support\Str::uuid(),
            'notification_type' => 'DID_RENEW',
            'subtype' => 'BILLING_RECOVERY',
            'original_transaction_id' => '1000000123456',
            'environment' => 'Production',
            'processed_at' => now()->subHours(5),
        ]);
    }
}
