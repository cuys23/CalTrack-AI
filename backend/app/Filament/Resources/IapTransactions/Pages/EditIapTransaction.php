<?php

namespace App\Filament\Resources\IapTransactions\Pages;

use App\Filament\Resources\IapTransactions\IapTransactionResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditIapTransaction extends EditRecord
{
    protected static string $resource = IapTransactionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
