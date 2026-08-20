<?php

namespace App\Filament\Resources\MealLogs\Pages;

use App\Filament\Resources\MealLogs\MealLogResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditMealLog extends EditRecord
{
    protected static string $resource = MealLogResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
