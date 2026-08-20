<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * App Store Connect requires a Privacy Policy URL and a Support URL that open in
 * a browser. The previous implementation returned JSON, which cannot be used for
 * either field, and its Privacy Policy claimed meal photographs were never
 * shared with third parties while the app was sending them to Google and OpenAI.
 */
class LegalPagesTest extends TestCase
{
    use RefreshDatabase;

    /** App Review reads these without an account. */
    public function test_legal_pages_are_public_html(): void
    {
        foreach (['/legal/privacy', '/legal/terms', '/support'] as $path) {
            $this->get($path)
                ->assertStatus(200)
                ->assertHeader('content-type', 'text/html; charset=UTF-8');
        }
    }

    /**
     * The declaration must match what the app actually does. A policy that
     * contradicts the App Privacy details is among the most common rejection
     * causes.
     */
    public function test_privacy_policy_discloses_every_third_party_recipient(): void
    {
        $response = $this->get('/legal/privacy')->assertStatus(200);

        foreach (['Gemini', 'OpenAI', 'Open Food Facts'] as $recipient) {
            $response->assertSee($recipient, false);
        }
    }

    /** Guideline 5.1.3: health data must not leave the device or feed advertising. */
    public function test_privacy_policy_states_health_data_stays_on_device(): void
    {
        $this->get('/legal/privacy')
            ->assertStatus(200)
            ->assertSee('không rời khỏi thiết bị', false)
            ->assertSee('quảng cáo', false);
    }

    /** Guideline 5.1.1(v): account deletion must be described. */
    public function test_privacy_policy_describes_account_deletion(): void
    {
        $this->get('/legal/privacy')
            ->assertStatus(200)
            ->assertSee('Xoá tài khoản', false);
    }

    /** Guideline 3.1.2: auto-renewal terms and how to cancel. */
    public function test_terms_state_renewal_and_cancellation(): void
    {
        $this->get('/legal/terms')
            ->assertStatus(200)
            ->assertSee('tự động gia hạn', false)
            ->assertSee('24 giờ', false)
            ->assertSee('Gói đăng ký', false);
    }

    /** Guideline 1.4.1: an app giving health figures must point to a professional. */
    public function test_terms_carry_a_medical_disclaimer(): void
    {
        $this->get('/legal/terms')
            ->assertStatus(200)
            ->assertSee('không thay thế tư vấn', false)
            ->assertSee('chuyên gia', false);
    }

    /** The API points at the pages rather than holding a second copy of the text. */
    public function test_api_endpoints_link_to_the_published_pages(): void
    {
        $this->getJson('/api/legal/privacy')
            ->assertStatus(200)
            ->assertJsonPath('url', url('/legal/privacy'));

        $this->getJson('/api/legal/terms')
            ->assertStatus(200)
            ->assertJsonPath('url', url('/legal/terms'));
    }
}
