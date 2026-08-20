<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_sent_to_the_login_page(): void
    {
        $this->get('/admin')->assertRedirect('/admin/login');
    }

    public function test_a_normal_app_user_cannot_reach_the_panel(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->get('/admin')->assertForbidden();
    }

    public function test_an_admin_can_reach_the_panel(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->get('/admin')->assertSuccessful();
    }

    public function test_every_resource_page_renders_for_an_admin(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        User::factory()->count(3)->create();

        $pages = [
            '/admin/users',
            '/admin/subscriptions',
            '/admin/subscription-products',
            '/admin/iap-transactions',
            '/admin/app-store-notifications',
            '/admin/meal-logs',
            '/reports',
        ];

        foreach ($pages as $page) {
            $this->actingAs($admin)->get($page)->assertSuccessful();
        }
    }

    public function test_legacy_reports_page_is_no_longer_public(): void
    {
        $this->get('/reports')->assertRedirect('/admin/login');

        $user = User::factory()->create(['is_admin' => false]);
        $this->actingAs($user)->get('/reports')->assertForbidden();
        $this->actingAs($user)->post('/reports/simulate-ai')->assertForbidden();
    }

    public function test_is_admin_cannot_be_granted_by_mass_assignment(): void
    {
        $user = User::factory()->create();

        $user->fill(['is_admin' => true])->save();

        $this->assertFalse($user->fresh()->is_admin);
    }
}
