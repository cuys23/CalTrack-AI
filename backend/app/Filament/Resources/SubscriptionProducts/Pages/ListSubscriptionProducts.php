<?php

namespace App\Filament\Resources\SubscriptionProducts\Pages;

use App\Filament\Resources\SubscriptionProducts\SubscriptionProductResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListSubscriptionProducts extends ListRecords
{
    protected static string $resource = SubscriptionProductResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
