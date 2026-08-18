<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_products', function (Blueprint $table) {
            $table->id();
            $table->string('product_id')->unique(); // e.g., com.caltrack.monthly_pro, com.caltrack.yearly_pro
            $table->string('name');
            $table->string('type')->default('auto_renewable'); // auto_renewable, non_consumable
            $table->string('duration'); // 1_month, 1_year, lifetime
            $table->decimal('price_usd', 8, 2)->default(0.00);
            $table->integer('trial_days')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_products');
    }
};
