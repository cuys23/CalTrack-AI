<?php

namespace App\Filament\Resources\AppStoreNotifications\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class AppStoreNotificationForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('notification_uuid')
                    ->required(),
                TextInput::make('notification_type')
                    ->required(),
                TextInput::make('subtype'),
                TextInput::make('original_transaction_id'),
                TextInput::make('environment')
                    ->required()
                    ->default('Sandbox'),
                Textarea::make('raw_payload')
                    ->columnSpanFull(),
                DateTimePicker::make('processed_at'),
            ]);
    }
}
