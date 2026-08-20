<?php

namespace App\Filament\Resources\SubscriptionProducts\Pages;

use App\Filament\Resources\SubscriptionProducts\SubscriptionProductResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditSubscriptionProduct extends EditRecord
{
    protected static string $resource = SubscriptionProductResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
