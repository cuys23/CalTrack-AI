<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;

/**
 * Legal documents, served as public web pages and summarised over the API.
 *
 * App Store Connect requires a Privacy Policy URL and a Support URL that open in
 * a browser, so JSON alone is not sufficient. The pages are public and
 * unauthenticated by necessity: App Review reads them without an account.
 */
class LegalController extends Controller
{
    private const LAST_UPDATED = '2026-08-19';

    /**
     * Shared by every legal page.
     *
     * @return array<string, string>
     */
    private function pageData(): array
    {
        return [
            'lastUpdated' => self::LAST_UPDATED,
            'supportEmail' => config('legal.support_email'),
        ];
    }

    // ---------------------------------------------------------------- Pages

    public function privacyPage(): View
    {
        return view('legal.privacy', $this->pageData());
    }

    public function termsPage(): View
    {
        return view('legal.terms', $this->pageData());
    }

    public function supportPage(): View
    {
        return view('legal.support', $this->pageData());
    }

    // ------------------------------------------------------------------ API
    //
    // The app links out to the pages above rather than rendering the text
    // itself, so these return the canonical URL alongside a short summary. That
    // keeps one copy of the wording: two copies drift, and a privacy policy that
    // contradicts itself is a review finding.

    public function privacy(): JsonResponse
    {
        return response()->json([
            'title' => 'Chính sách quyền riêng tư — CalTrack AI',
            'last_updated' => self::LAST_UPDATED,
            'url' => url('/legal/privacy'),
            'summary' => 'Ảnh món ăn được gửi tới Google Gemini và OpenAI để phân tích dinh dưỡng. '
                .'Mã vạch được gửi tới Open Food Facts để tra cứu. Dữ liệu Sức khoẻ không rời khỏi thiết bị. '
                .'Bạn có thể xoá tài khoản và toàn bộ dữ liệu ngay trong ứng dụng.',
        ]);
    }

    public function terms(): JsonResponse
    {
        return response()->json([
            'title' => 'Điều khoản sử dụng — CalTrack AI',
            'last_updated' => self::LAST_UPDATED,
            'url' => url('/legal/terms'),
            'summary' => 'Số liệu dinh dưỡng là ước tính, không thay thế tư vấn y tế. '
                .'Gói CalTrack Pro tự động gia hạn qua Apple App Store trừ khi bạn huỷ ít nhất 24 giờ '
                .'trước khi kết thúc chu kỳ hiện tại, trong Cài đặt → Apple ID → Gói đăng ký.',
        ]);
    }

    public function eula(): JsonResponse
    {
        return response()->json([
            'title' => 'Thoả thuận cấp phép người dùng cuối (EULA)',
            'last_updated' => self::LAST_UPDATED,
            'url' => 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
            'summary' => 'Ứng dụng được cấp phép theo Thoả thuận cấp phép chuẩn của Apple.',
        ]);
    }
}
