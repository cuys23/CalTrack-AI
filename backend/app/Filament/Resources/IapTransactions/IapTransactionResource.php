<?php

namespace App\Filament\Resources\IapTransactions;

use App\Filament\Resources\IapTransactions\Pages\CreateIapTransaction;
use App\Filament\Resources\IapTransactions\Pages\EditIapTransaction;
use App\Filament\Resources\IapTransactions\Pages\ListIapTransactions;
use App\Filament\Resources\IapTransactions\Schemas\IapTransactionForm;
use App\Filament\Resources\IapTransactions\Tables\IapTransactionsTable;
use App\Models\IapTransaction;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class IapTransactionResource extends Resource
{
    protected static ?string $model = IapTransaction::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return IapTransactionForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return IapTransactionsTable::configure($table);
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
            'index' => ListIapTransactions::route('/'),
            'create' => CreateIapTransaction::route('/create'),
            'edit' => EditIapTransaction::route('/{record}/edit'),
        ];
    }
}
