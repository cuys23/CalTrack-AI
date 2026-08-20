<?php

namespace App\Filament\Resources\IapTransactions\Pages;

use App\Filament\Resources\IapTransactions\IapTransactionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListIapTransactions extends ListRecords
{
    protected static string $resource = IapTransactionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
