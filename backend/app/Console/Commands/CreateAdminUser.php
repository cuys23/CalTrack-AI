<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

class CreateAdminUser extends Command
{
    protected $signature = 'admin:create {email?}';

    protected $description = 'Tạo (hoặc nâng quyền) một tài khoản admin truy cập /admin';

    public function handle(): int
    {
        $email = $this->argument('email') ?: text(
            label: 'Email admin',
            required: true,
        );

        $validator = Validator::make(['email' => $email], ['email' => 'required|email']);
        if ($validator->fails()) {
            $this->error('Email không hợp lệ.');

            return self::FAILURE;
        }

        $user = User::withTrashed()->where('email', $email)->first();

        if ($user) {
            $user->restore();
            $user->is_admin = true;
            $user->save();

            $this->info("Đã nâng quyền admin cho tài khoản sẵn có: {$email}");

            return self::SUCCESS;
        }

        $secret = password(label: 'Mật khẩu (tối thiểu 12 ký tự)', required: true);

        if (strlen($secret) < 12) {
            $this->error('Mật khẩu quá ngắn. Trang /admin toàn quyền trên database, đừng đặt ngắn.');

            return self::FAILURE;
        }

        if ($secret !== password(label: 'Nhập lại mật khẩu', required: true)) {
            $this->error('Hai lần nhập không khớp.');

            return self::FAILURE;
        }

        $user = new User([
            'name' => text(label: 'Tên hiển thị', default: 'Admin'),
            'email' => $email,
        ]);
        $user->password = Hash::make($secret);
        $user->email_verified_at = now();
        $user->is_admin = true;
        $user->save();

        $this->info("Đã tạo admin {$email}. Đăng nhập tại /admin");

        return self::SUCCESS;
    }
}
