<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meal_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('image_url')->nullable();
            $table->string('meal_type')->default('breakfast'); // breakfast, lunch, dinner, snack
            $table->string('status')->default('completed'); // pending, processing, completed, failed
            $table->integer('total_calories')->default(0);
            $table->decimal('total_protein_g', 6, 2)->default(0);
            $table->decimal('total_carbs_g', 6, 2)->default(0);
            $table->decimal('total_fat_g', 6, 2)->default(0);
            $table->integer('health_score')->default(85); // 1-100
            $table->text('notes')->nullable();
            $table->text('error_message')->nullable();
            $table->date('logged_date')->index();
            $table->timestamp('analyzed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meal_logs');
    }
};
