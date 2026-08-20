<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Google sign-in previously matched accounts by email address alone, which let
 * anyone who knew an address sign in as its owner. Accounts are now keyed on the
 * Google subject, which requires storing it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_user_id')->nullable()->unique()->after('apple_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['google_user_id']);
            $table->dropColumn('google_user_id');
        });
    }
};
