<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MealLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'image_url',
        'meal_type',
        'status',
        'total_calories',
        'total_protein_g',
        'total_carbs_g',
        'total_fat_g',
        'health_score',
        'notes',
        'error_message',
        'logged_date',
        'analyzed_at',
    ];

    protected function casts(): array
    {
        return [
            'total_calories' => 'integer',
            'total_protein_g' => 'decimal:2',
            'total_carbs_g' => 'decimal:2',
            'total_fat_g' => 'decimal:2',
            'health_score' => 'integer',
            'logged_date' => 'date',
            'analyzed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function foods(): HasMany
    {
        return $this->hasMany(Food::class);
    }

    public function recalculateTotals(): void
    {
        $this->total_calories = (int) $this->foods()->sum('calories');
        $this->total_protein_g = (float) $this->foods()->sum('protein_g');
        $this->total_carbs_g = (float) $this->foods()->sum('carbs_g');
        $this->total_fat_g = (float) $this->foods()->sum('fat_g');
        $avgScore = $this->foods()->avg('health_score');
        $this->health_score = $avgScore ? (int) round($avgScore) : 85;
        $this->save();
    }
}
