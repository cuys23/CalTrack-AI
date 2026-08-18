<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IapTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'original_transaction_id',
        'transaction_id',
        'product_id',
        'purchase_date',
        'expires_date',
        'type',
        'status',
        'raw_payload',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'datetime',
            'expires_date' => 'datetime',
            'raw_payload' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
