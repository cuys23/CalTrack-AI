<?php

namespace App\Filament\Resources\MealLogs;

use App\Filament\Resources\MealLogs\Pages\CreateMealLog;
use App\Filament\Resources\MealLogs\Pages\EditMealLog;
use App\Filament\Resources\MealLogs\Pages\ListMealLogs;
use App\Filament\Resources\MealLogs\Schemas\MealLogForm;
use App\Filament\Resources\MealLogs\Tables\MealLogsTable;
use App\Models\MealLog;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class MealLogResource extends Resource
{
    protected static ?string $model = MealLog::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return MealLogForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return MealLogsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListMealLogs::route('/'),
            'create' => CreateMealLog::route('/create'),
            'edit' => EditMealLog::route('/{record}/edit'),
        ];
    }
}
