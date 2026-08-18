<?php

namespace Database\Seeders;

use App\Models\SubscriptionProduct;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed only essential production system configurations.
     * No fake users or fake meal logs.
     */
    public function run(): void
    {
        // 1. Subscription Products (Required for Apple IAP StoreKit 2)
        SubscriptionProduct::updateOrCreate(
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
    }
}
