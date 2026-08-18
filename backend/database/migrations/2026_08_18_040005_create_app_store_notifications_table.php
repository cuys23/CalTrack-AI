<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_store_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('notification_uuid')->unique()->index();
            $table->string('notification_type')->index(); // SUBSCRIBED, DID_RENEW, EXPIRED, REFUND, etc.
            $table->string('subtype')->nullable();
            $table->string('original_transaction_id')->nullable()->index();
            $table->string('environment')->default('Sandbox');
            $table->json('raw_payload')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_store_notifications');
    }
};
