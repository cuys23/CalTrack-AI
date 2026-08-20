@extends('legal.layout')

@section('title', 'Hỗ trợ')

@section('content')
    <p>
        Cần giúp đỡ? Gửi email tới <a href="mailto:{{ $supportEmail }}">{{ $supportEmail }}</a>.
        Chúng tôi trả lời trong vòng 2 ngày làm việc.
    </p>

    <h2>Câu hỏi thường gặp</h2>

    <h2>Huỷ gói đăng ký thế nào?</h2>
    <p>
        Mở <strong>Cài đặt → Apple ID → Gói đăng ký → CalTrack Pro → Huỷ gói</strong>. Gói
        do Apple quản lý nên chúng tôi không huỷ giúp bạn được. Huỷ ít nhất 24 giờ trước
        khi chu kỳ kết thúc để tránh bị trừ tiền lần tiếp theo.
    </p>

    <h2>Tôi đã mua Pro nhưng ứng dụng vẫn khoá</h2>
    <p>
        Mở màn hình gói Pro và bấm <strong>Khôi phục (Restore)</strong>. Nếu vẫn chưa được,
        kiểm tra xem bạn có đang đăng nhập đúng Apple ID đã dùng để mua hay không.
    </p>

    <h2>Số calo AI đưa ra không chính xác</h2>
    <p>
        Đây là ước tính từ ảnh, không phải phép đo. Bạn có thể sửa lại tên món, khẩu phần và
        các chỉ số ngay trên màn hình kết quả trước khi lưu.
    </p>

    <h2>Quét mã vạch không ra sản phẩm</h2>
    <p>
        Chúng tôi tra cứu qua cơ sở dữ liệu mở Open Food Facts, hiện còn ít sản phẩm Việt
        Nam. Khi không tìm thấy, ứng dụng sẽ mở màn hình nhập thủ công để bạn tự điền.
    </p>

    <h2>Đồng bộ Apple Health không hoạt động</h2>
    <p>
        Kiểm tra <strong>Cài đặt → Quyền riêng tư &amp; Bảo mật → Sức khoẻ → CalTrack AI</strong>
        và bật các mục bạn muốn chia sẻ. iOS không cho ứng dụng biết bạn đã từ chối quyền
        đọc hay chưa, nên nếu không thấy số liệu nào thì đây là nơi cần kiểm tra đầu tiên.
    </p>

    <h2>Xoá tài khoản và toàn bộ dữ liệu</h2>
    <p>
        Vào <strong>Cá nhân → Xoá tài khoản</strong>. Thao tác này xoá vĩnh viễn dữ liệu
        trên máy chủ và trên thiết bị, và không thể hoàn tác. Lưu ý việc này không huỷ gói
        đăng ký của bạn.
    </p>

    <h2>Báo lỗi</h2>
    <p>
        Khi gửi email báo lỗi, hãy cho chúng tôi biết mẫu iPhone, phiên bản iOS và các bước
        dẫn tới lỗi. Như vậy sẽ nhanh hơn nhiều.
    </p>
@endsection
