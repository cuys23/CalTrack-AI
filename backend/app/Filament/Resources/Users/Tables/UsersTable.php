<?php

namespace App\Filament\Resources\Users\Tables;

use App\Models\User;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ForceDeleteBulkAction;
use Filament\Actions\RestoreBulkAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Filters\TrashedFilter;
use Filament\Tables\Table;

class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('id')->sortable(),
                TextColumn::make('name')->searchable(),
                TextColumn::make('email')->label('Email')->searchable()->copyable(),
                IconColumn::make('is_premium')
                    ->label('Pro')
                    ->boolean()
                    ->state(fn (User $record) => $record->isPremium()),
                IconColumn::make('is_admin')->label('Admin')->boolean(),
                TextColumn::make('provider')
                    ->label('Đăng nhập')
                    ->state(fn (User $record) => match (true) {
                        (bool) $record->apple_user_id => 'Apple',
                        (bool) $record->google_user_id => 'Google',
                        default => 'Email',
                    })
                    ->badge(),
                TextColumn::make('created_at')->label('Đăng ký')->dateTime()->sortable(),
                TextColumn::make('activity_level')->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('current_weight_kg')->numeric()->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('target_weight_kg')->numeric()->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('birthday')->date()->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('deleted_at')->dateTime()->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                TernaryFilter::make('is_admin')->label('Chỉ admin'),
                TrashedFilter::make(),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                    ForceDeleteBulkAction::make(),
                    RestoreBulkAction::make(),
                ]),
            ]);
    }
}
