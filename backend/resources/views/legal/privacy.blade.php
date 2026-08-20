@extends('legal.layout')

@section('title', 'Chính sách quyền riêng tư')

@section('content')
    <p>
        Chính sách này mô tả dữ liệu CalTrack AI thu thập, nơi dữ liệu được gửi tới, và
        quyền của bạn đối với dữ liệu đó. Nội dung ở đây phản ánh đúng cách ứng dụng
        hoạt động trên thực tế.
    </p>

    <h2>Dữ liệu chúng tôi thu thập</h2>

    <div class="tw">
        <table>
            <thead>
            <tr>
                <th>Loại dữ liệu</th>
                <th>Nội dung</th>
                <th>Vì sao cần</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>Tài khoản</td>
                <td>Tên và địa chỉ email do Apple hoặc Google cung cấp khi bạn đăng nhập</td>
                <td>Để nhận diện tài khoản của bạn và khôi phục dữ liệu trên thiết bị mới</td>
            </tr>
            <tr>
                <td>Thể trạng &amp; mục tiêu</td>
                <td>Giới tính, ngày sinh, chiều cao, cân nặng, số đo, mức vận động, mục tiêu calo</td>
                <td>Để tính nhu cầu năng lượng hằng ngày của riêng bạn</td>
            </tr>
            <tr>
                <td>Nhật ký ăn uống</td>
                <td>Ảnh món ăn bạn chụp, tên món, calo và các chất dinh dưỡng</td>
                <td>Để hiển thị tiến trình và lịch sử ăn uống</td>
            </tr>
            <tr>
                <td>Giao dịch</td>
                <td>Mã giao dịch và trạng thái gói đăng ký từ Apple</td>
                <td>Để xác minh quyền lợi CalTrack Pro của bạn</td>
            </tr>
            </tbody>
        </table>
    </div>

    <h2>Dữ liệu được gửi tới bên thứ ba</h2>

    <p>
        Có ba trường hợp dữ liệu rời khỏi hệ thống của chúng tôi. Chúng tôi nêu rõ ở đây
        vì đây là điều bạn cần biết trước khi dùng các tính năng tương ứng.
    </p>

    <ul>
        <li>
            <strong>Ảnh món ăn được gửi tới Google (Gemini) và OpenAI (GPT-4o)</strong> để
            nhận diện món ăn và ước tính dinh dưỡng. Ảnh được gửi kèm yêu cầu phân tích,
            không kèm tên, email hay mã định danh thiết bị của bạn. Nếu bạn không muốn điều
            này, hãy nhập món ăn thủ công thay vì dùng tính năng quét bằng AI.
        </li>
        <li>
            <strong>Mã vạch bạn quét được gửi tới Open Food Facts</strong> để tra cứu thông
            tin sản phẩm. Chỉ có dãy số mã vạch được gửi đi.
        </li>
        <li>
            <strong>Apple xử lý mọi khoản thanh toán.</strong> Chúng tôi không bao giờ nhận
            hay lưu trữ thông tin thẻ của bạn.
        </li>
    </ul>

    <h2>Dữ liệu Sức khoẻ (Apple Health)</h2>

    <p>
        Nếu bạn cho phép, ứng dụng đọc <strong>số bước chân</strong> và
        <strong>calo tiêu hao</strong> từ Sức khoẻ để tính chính xác lượng calo bạn còn lại
        trong ngày, và ghi <strong>cân nặng</strong> bạn nhập vào Sức khoẻ.
    </p>

    <p>
        Dữ liệu Sức khoẻ <strong>không rời khỏi thiết bị của bạn</strong>. Chúng tôi không
        gửi dữ liệu này lên máy chủ, không dùng cho quảng cáo hay tiếp thị, không lưu lên
        iCloud, và không chia sẻ với bất kỳ bên thứ ba nào. Bạn có thể thu hồi quyền bất
        kỳ lúc nào trong Cài đặt → Quyền riêng tư &amp; Bảo mật → Sức khoẻ.
    </p>

    <h2>Chúng tôi không làm gì</h2>

    <ul>
        <li>Không bán dữ liệu của bạn cho bất kỳ ai.</li>
        <li>Không dùng dữ liệu của bạn để quảng cáo hay tiếp thị.</li>
        <li>Không theo dõi bạn trên các ứng dụng hay trang web khác.</li>
        <li>Không tích hợp mạng quảng cáo hay công cụ đo lường quảng cáo nào.</li>
    </ul>

    <h2>Xoá tài khoản</h2>

    <p>
        Bạn có thể xoá tài khoản ngay trong ứng dụng: <strong>Cá nhân → Xoá tài khoản</strong>.
        Thao tác này xoá vĩnh viễn hồ sơ, nhật ký ăn uống, ảnh và lịch sử cân nặng của bạn
        trên máy chủ, đồng thời xoá toàn bộ dữ liệu lưu trên thiết bị. Hành động này không
        thể hoàn tác.
    </p>

    <p>
        Việc xoá tài khoản không huỷ gói đăng ký của bạn. Gói đăng ký do Apple quản lý và
        cần được huỷ riêng trong Cài đặt → Apple ID → Gói đăng ký.
    </p>

    <h2>Lưu trữ và bảo mật</h2>

    <p>
        Dữ liệu được lưu trên máy chủ của chúng tôi và truyền qua kết nối được mã hoá.
        Đăng nhập được xác minh trực tiếp với Apple và Google; chúng tôi không lưu mật khẩu
        của các tài khoản đó.
    </p>

    <h2>Trẻ em</h2>

    <p>
        CalTrack AI không dành cho trẻ em dưới 13 tuổi và chúng tôi không cố ý thu thập dữ
        liệu từ trẻ em dưới 13 tuổi.
    </p>

    <h2>Thay đổi chính sách</h2>

    <p>
        Khi có thay đổi ảnh hưởng tới cách dữ liệu của bạn được sử dụng, chúng tôi sẽ cập
        nhật ngày ở đầu trang này và thông báo trong ứng dụng.
    </p>
@endsection
