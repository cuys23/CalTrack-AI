<?php

namespace App\Filament\Resources\MealLogs\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class MealLogsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('user.name')
                    ->searchable(),
                ImageColumn::make('image_url'),
                TextColumn::make('meal_type')
                    ->searchable(),
                TextColumn::make('status')
                    ->searchable(),
                TextColumn::make('total_calories')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('total_protein_g')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('total_carbs_g')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('total_fat_g')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('health_score')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('logged_date')
                    ->date()
                    ->sortable(),
                TextColumn::make('analyzed_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
