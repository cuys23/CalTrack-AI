<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Food extends Model
{
    use HasFactory;

    protected $table = 'foods';

    protected $fillable = [
        'meal_log_id',
        'name',
        'grams',
        'calories',
        'protein_g',
        'carbs_g',
        'fat_g',
        'confidence',
        'health_score',
        'micronutrients',
    ];

    protected function casts(): array
    {
        return [
            'grams' => 'decimal:2',
            'calories' => 'integer',
            'protein_g' => 'decimal:2',
            'carbs_g' => 'decimal:2',
            'fat_g' => 'decimal:2',
            'confidence' => 'decimal:2',
            'health_score' => 'integer',
            'micronutrients' => 'array',
        ];
    }

    public function mealLog(): BelongsTo
    {
        return $this->belongsTo(MealLog::class);
    }
}
