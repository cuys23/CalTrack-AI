<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receive_token_and_goals(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Nguyễn Văn A',
            'email' => 'nguyenvana@example.com',
            'password' => 'password123',
            'gender' => 'male',
            'birthday' => '1995-05-15',
            'height_cm' => 175,
            'current_weight_kg' => 70,
            'target_weight_kg' => 65,
            'activity_level' => 'moderate',
            'goal_type' => 'lose_weight',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'token',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'daily_goal' => [
                        'target_calories',
                        'protein_g',
                        'carbs_g',
                        'fat_g',
                    ]
                ]
            ]);

        $this->assertDatabaseHas('users', ['email' => 'nguyenvana@example.com']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('secret123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'token', 'user']);
    }

    public function test_authenticated_user_can_fetch_me_and_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/me');
        $response->assertStatus(200)
            ->assertJsonPath('user.id', $user->id);

        $deleteResponse = $this->actingAs($user)->postJson('/api/auth/delete-account');
        $deleteResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('users', ['id' => $user->id]);
    }
}
