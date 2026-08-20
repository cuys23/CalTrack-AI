<?php

namespace App\Filament\Resources\AppStoreNotifications\Pages;

use App\Filament\Resources\AppStoreNotifications\AppStoreNotificationResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListAppStoreNotifications extends ListRecords
{
    protected static string $resource = AppStoreNotificationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
