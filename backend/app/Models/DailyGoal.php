<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyGoal extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'target_calories',
        'protein_g',
        'carbs_g',
        'fat_g',
        'goal_type',
        'water_target_ml',
    ];

    protected function casts(): array
    {
        return [
            'target_calories' => 'integer',
            'protein_g' => 'integer',
            'carbs_g' => 'integer',
            'fat_g' => 'integer',
            'water_target_ml' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
