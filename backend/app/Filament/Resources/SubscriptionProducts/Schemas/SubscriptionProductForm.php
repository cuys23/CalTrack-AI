<?php

namespace App\Filament\Resources\SubscriptionProducts\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class SubscriptionProductForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('product_id')
                    ->required(),
                TextInput::make('name')
                    ->required(),
                TextInput::make('type')
                    ->required()
                    ->default('auto_renewable'),
                TextInput::make('duration')
                    ->required(),
                TextInput::make('price_usd')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('trial_days')
                    ->required()
                    ->numeric()
                    ->default(0),
                Toggle::make('is_active')
                    ->required(),
            ]);
    }
}
