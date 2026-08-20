<?php

namespace App\Filament\Resources\AppStoreNotifications\Pages;

use App\Filament\Resources\AppStoreNotifications\AppStoreNotificationResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditAppStoreNotification extends EditRecord
{
    protected static string $resource = AppStoreNotificationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
