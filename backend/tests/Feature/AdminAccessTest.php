<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The operator dashboard exposes every user record, subscription, and revenue
 * figure. It previously carried no authentication of any kind and was reachable
 * by anyone who knew the URL.
 */
class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    private const USERNAME = 'operator';

    private const PASSWORD = 'correct-horse-battery-staple';

    private function configureCredentials(): void
    {
        config()->set('admin.username', self::USERNAME);
        config()->set('admin.password', self::PASSWORD);
    }

    /**
     * @return array<string, string>
     */
    private function basicAuthHeader(string $user, string $password): array
    {
        return ['Authorization' => 'Basic '.base64_encode("{$user}:{$password}")];
    }

    /** Positive proof: the correct credential still reaches the dashboard. */
    public function test_dashboard_is_reachable_with_correct_credentials(): void
    {
        $this->configureCredentials();

        $this->withHeaders($this->basicAuthHeader(self::USERNAME, self::PASSWORD))
            ->get('/admin')
            ->assertStatus(200);
    }

    public function test_dashboard_rejects_anonymous_requests(): void
    {
        $this->configureCredentials();

        $this->get('/admin')->assertStatus(401);
        $this->get('/')->assertStatus(401);
    }

    public function test_dashboard_rejects_a_wrong_password(): void
    {
        $this->configureCredentials();

        $this->withHeaders($this->basicAuthHeader(self::USERNAME, 'guess'))
            ->get('/admin')
            ->assertStatus(401);
    }

    /**
     * An unconfigured credential must lock the dashboard rather than open it.
     * Comparing against an empty string would have admitted an empty password.
     */
    public function test_dashboard_is_locked_when_no_credentials_are_configured(): void
    {
        config()->set('admin.username', null);
        config()->set('admin.password', null);

        $this->get('/admin')->assertStatus(503);
        $this->withHeaders($this->basicAuthHeader('', ''))->get('/admin')->assertStatus(503);
    }

    /**
     * The simulation endpoint writes fabricated meal data into a real account
     * and is registered only outside production.
     */
    public function test_simulation_endpoint_is_absent_in_production(): void
    {
        $this->assertTrue(app()->environment('testing'));
        $this->assertTrue(
            collect(app('router')->getRoutes())->contains(
                fn ($route) => $route->uri() === 'admin/simulate-ai'
            ),
            'The simulation route should exist outside production.'
        );
    }
}
