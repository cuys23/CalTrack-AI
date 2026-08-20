<?php

namespace App\Filament\Resources\MealLogs\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class MealLogForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('user_id')
                    ->relationship('user', 'name')
                    ->required(),
                FileUpload::make('image_url')
                    ->image(),
                TextInput::make('meal_type')
                    ->required()
                    ->default('breakfast'),
                TextInput::make('status')
                    ->required()
                    ->default('completed'),
                TextInput::make('total_calories')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('total_protein_g')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('total_carbs_g')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('total_fat_g')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('health_score')
                    ->required()
                    ->numeric()
                    ->default(85),
                Textarea::make('notes')
                    ->columnSpanFull(),
                Textarea::make('error_message')
                    ->columnSpanFull(),
                DatePicker::make('logged_date')
                    ->required(),
                DateTimePicker::make('analyzed_at'),
            ]);
    }
}
