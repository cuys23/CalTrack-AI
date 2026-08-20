<?php

namespace App\Filament\Resources\AppStoreNotifications;

use App\Filament\Resources\AppStoreNotifications\Pages\CreateAppStoreNotification;
use App\Filament\Resources\AppStoreNotifications\Pages\EditAppStoreNotification;
use App\Filament\Resources\AppStoreNotifications\Pages\ListAppStoreNotifications;
use App\Filament\Resources\AppStoreNotifications\Schemas\AppStoreNotificationForm;
use App\Filament\Resources\AppStoreNotifications\Tables\AppStoreNotificationsTable;
use App\Models\AppStoreNotification;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class AppStoreNotificationResource extends Resource
{
    protected static ?string $model = AppStoreNotification::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return AppStoreNotificationForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return AppStoreNotificationsTable::configure($table);
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
            'index' => ListAppStoreNotifications::route('/'),
            'create' => CreateAppStoreNotification::route('/create'),
            'edit' => EditAppStoreNotification::route('/{record}/edit'),
        ];
    }
}
