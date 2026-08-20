<?php

namespace App\Filament\Resources\IapTransactions\Pages;

use App\Filament\Resources\IapTransactions\IapTransactionResource;
use Filament\Resources\Pages\CreateRecord;

class CreateIapTransaction extends CreateRecord
{
    protected static string $resource = IapTransactionResource::class;
}
