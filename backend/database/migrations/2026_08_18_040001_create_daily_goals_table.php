<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('target_calories')->default(2000);
            $table->integer('protein_g')->default(150);
            $table->integer('carbs_g')->default(200);
            $table->integer('fat_g')->default(65);
            $table->string('goal_type')->default('maintain'); // lose_weight, maintain, gain_muscle
            $table->integer('water_target_ml')->default(2000);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_goals');
    }
};
