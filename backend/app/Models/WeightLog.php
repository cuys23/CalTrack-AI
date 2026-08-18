<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeightLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'weight_kg',
        'body_fat_percentage',
        'waist_cm',
        'chest_cm',
        'hips_cm',
        'notes',
        'logged_date',
    ];

    protected function casts(): array
    {
        return [
            'weight_kg' => 'decimal:2',
            'body_fat_percentage' => 'decimal:1',
            'waist_cm' => 'decimal:2',
            'chest_cm' => 'decimal:2',
            'hips_cm' => 'decimal:2',
            'logged_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
