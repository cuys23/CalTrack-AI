<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('foods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meal_log_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->decimal('grams', 6, 2)->default(100);
            $table->integer('calories')->default(0);
            $table->decimal('protein_g', 6, 2)->default(0);
            $table->decimal('carbs_g', 6, 2)->default(0);
            $table->decimal('fat_g', 6, 2)->default(0);
            $table->decimal('confidence', 3, 2)->default(0.95); // 0.00 to 1.00
            $table->integer('health_score')->default(85);
            $table->json('micronutrients')->nullable(); // fiber, sugar, sodium, etc.
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('foods');
    }
};
