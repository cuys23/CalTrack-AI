<?php

namespace App\Filament\Resources\IapTransactions\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class IapTransactionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('user_id')
                    ->relationship('user', 'name'),
                TextInput::make('original_transaction_id')
                    ->required(),
                TextInput::make('transaction_id')
                    ->required(),
                TextInput::make('product_id')
                    ->required(),
                DateTimePicker::make('purchase_date'),
                DateTimePicker::make('expires_date'),
                TextInput::make('type')
                    ->required()
                    ->default('Auto-Renewable Subscription'),
                TextInput::make('status')
                    ->required()
                    ->default('success'),
                Textarea::make('raw_payload')
                    ->columnSpanFull(),
            ]);
    }
}
