<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class LegalController extends Controller
{
    public function privacy(): JsonResponse
    {
        return response()->json([
            'title' => 'Chính Sách Bảo Mật — CalTrack AI',
            'last_updated' => '2026-08-18',
            'content' => 'CalTrack AI cam kết bảo mật tuyệt đối dữ liệu người dùng. Hình ảnh món ăn chỉ được sử dụng cho mục đích phân tích dinh dưỡng và không chia sẻ cho bên thứ ba. Người dùng có toàn quyền xoá tài khoản và toàn bộ dữ liệu bất kỳ lúc nào trực tiếp trong ứng dụng.',
        ]);
    }

    public function terms(): JsonResponse
    {
        return response()->json([
            'title' => 'Điều Khoản Dịch Vụ — CalTrack AI',
            'last_updated' => '2026-08-18',
            'content' => 'Các gói đăng ký CalTrack Pro được tự động gia hạn thông qua Apple App Store. Bạn có thể huỷ gia hạn bất kỳ lúc nào trong cài đặt Apple ID ít nhất 24 giờ trước khi kết thúc chu kỳ thanh toán hiện tại.',
        ]);
    }

    public function eula(): JsonResponse
    {
        return response()->json([
            'title' => 'Thoả Thuận Cấp Phép Người Dùng Cuối (EULA)',
            'last_updated' => '2026-08-18',
            'content' => 'Ứng dụng này tuân theo Thoả thuận cấp phép chuẩn của Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
        ]);
    }
}
