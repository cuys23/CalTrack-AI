<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('email')
                    ->label('Email address')
                    ->email()
                    ->required()
                    ->unique(ignoreRecord: true),
                TextInput::make('password')
                    ->password()
                    ->revealable()
                    // Required when creating; on edit, an empty box means
                    // "leave the existing password alone".
                    ->required(fn (string $operation) => $operation === 'create')
                    ->dehydrated(fn (?string $state) => filled($state))
                    ->helperText('Để trống khi sửa nếu không muốn đổi mật khẩu.'),
                DateTimePicker::make('email_verified_at'),
                TextInput::make('gender'),
                DatePicker::make('birthday'),
                TextInput::make('height_cm')->numeric()->suffix('cm'),
                TextInput::make('current_weight_kg')->numeric()->suffix('kg'),
                TextInput::make('target_weight_kg')->numeric()->suffix('kg'),
                TextInput::make('activity_level')
                    ->required()
                    ->default('sedentary'),
                TextInput::make('avatar_url')->url(),
                TextInput::make('apple_user_id')->disabled()
                    ->helperText('Do Apple cấp, chỉ đọc.'),
                TextInput::make('google_user_id')->disabled()
                    ->helperText('Do Google cấp, chỉ đọc.'),
                // is_admin is deliberately absent: it is not mass-assignable and
                // is only granted through `php artisan admin:create`.
            ]);
    }
}
