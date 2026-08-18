<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('iap_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('original_transaction_id')->index();
            $table->string('transaction_id')->unique()->index();
            $table->string('product_id')->index();
            $table->timestamp('purchase_date')->nullable();
            $table->timestamp('expires_date')->nullable();
            $table->string('type')->default('Auto-Renewable Subscription');
            $table->string('status')->default('success');
            $table->json('raw_payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('iap_transactions');
    }
};
