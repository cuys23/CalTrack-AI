<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppStoreNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'notification_uuid',
        'notification_type',
        'subtype',
        'original_transaction_id',
        'environment',
        'raw_payload',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'raw_payload' => 'array',
            'processed_at' => 'datetime',
        ];
    }
}
