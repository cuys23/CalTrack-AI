<?php

namespace App\Filament\Resources\MealLogs\Pages;

use App\Filament\Resources\MealLogs\MealLogResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListMealLogs extends ListRecords
{
    protected static string $resource = MealLogResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
