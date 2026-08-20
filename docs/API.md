# CalTrack AI — Production REST API Specification

> **Base URL (Local):** `http://localhost:8000/api`  
> **Base URL (Production):** `https://api.caltrack.ai/api`  
> **Authentication:** `Bearer <token>` (Laravel Sanctum)  
> **Format:** `application/json`

---

## 1. Authentication & Profile

### `POST /auth/register`
Đăng ký tài khoản mới và tự động tạo mục tiêu dinh dưỡng cá nhân hóa.
```json
// Request Body
{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "password123",
  "gender": "male",
  "birthday": "1998-05-20",
  "height_cm": 175,
  "current_weight_kg": 72.5,
  "target_weight_kg": 68.0,
  "activity_level": "moderate",
  "goal_type": "lose_weight"
}

// Response (201 Created)
{
  "success": true,
  "message": "Đăng ký tài khoản thành công!",
  "token": "1|sanctum_plain_text_token...",
  "user": { ... },
  "is_premium": false
}
```

### `POST /auth/login`
Đăng nhập bằng Email và Mật khẩu.
```json
// Request Body
{
  "email": "user@example.com",
  "password": "password123"
}
```

### `POST /auth/apple`
Đăng nhập nhanh hoặc đăng ký bằng Apple ID.
```json
// Request Body
{
  "apple_user_id": "001234.abcdef...",
  "email": "user@privaterelay.appleid.com",
  "name": "Apple User"
}
```

### `GET /me` (Auth Required)
Lấy thông tin tài khoản hiện tại kèm `daily_goal` và `active_subscription`.

### `POST /auth/logout` (Auth Required)
Thu hồi token hiện tại.

### `POST /auth/delete-account` (Auth Required)
Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu (Apple Guideline 5.1.1 compliant).

---

## 2. Daily Goals & TDEE

### `GET /goals`
Lấy mục tiêu calo và macro hôm nay.

### `PUT /goals`
Cập nhật thủ công mục tiêu dinh dưỡng.
```json
// Request Body
{
  "target_calories": 2100,
  "protein_g": 160,
  "carbs_g": 220,
  "fat_g": 60,
  "water_target_ml": 2500
}
```

### `POST /goals/recalculate`
Tính toán lại mục tiêu theo công thức Mifflin-St Jeor & thể trạng hiện tại.
```json
// Request Body
{
  "goal_type": "lose_weight" // lose_weight, maintain, gain_muscle
}
```

---

## 3. Apple In-App Purchases (IAP) & Subscription

### `GET /iap/products`
Lấy danh sách các gói subscription đang kích hoạt:
- `com.vin.calorielq.monthly_pro` ($4.99/mo)
- `com.vin.calorielq.yearly_pro` ($29.99/yr)
- `com.vin.calorielq.lifetime_pro` ($69.99)

### `POST /iap/verify` (Auth Required)
Xác thực giao dịch từ StoreKit 2 và cấp quyền Premium ngay lập tức.
```json
// Request Body
{
  "transaction_jws": "eyJhbGciOiJFUzI1NiIs..."
}
```

### `POST /iap/restore` (Auth Required)
Khôi phục các giao dịch đã mua trước đó.
```json
// Request Body
{
  "transactions": ["jws_token_1", "jws_token_2"]
}
```

### `GET /iap/status` (Auth Required)
Lấy trạng thái Premium thực tế.

### `POST /webhooks/app-store`
Apple App Store Server Notifications V2 Webhook endpoint.

---

## 4. Meal Logs & AI Vision Scanning

### `POST /meal/analyze` (Auth Required - Rate Limit: 15/min)
Tải ảnh món ăn lên để phân tích bất đồng bộ qua Redis Queue.
```json
// Request Body (JSON hoặc Multipart FormData)
{
  "image_base64": "data:image/jpeg;base64,...",
  "meal_type": "lunch",
  "hint": "Phở bò",
  "logged_date": "2026-08-18",
  "async": true
}

// Response (202 Accepted)
{
  "success": true,
  "message": "Hình ảnh đang được AI phân tích...",
  "job_id": 42,
  "status": "pending"
}
```

### `GET /meal/jobs/{id}` (Auth Required)
Polling trạng thái phân tích của Job AI:
- `pending`: Đang chờ xử lý trong hàng đợi
- `processing`: AI Vision đang phân tích
- `completed`: Hoàn tất (kèm danh sách món ăn, calo, macro)
- `failed`: Thất bại

### `GET /meal?date=YYYY-MM-DD` (Auth Required)
Lấy toàn bộ bữa ăn trong ngày đã chọn.

### `POST /meal/quick-add` (Auth Required)
Thêm thủ công món ăn không cần quét ảnh.

---

## 5. Dashboard & Analytics

### `GET /dashboard?date=YYYY-MM-DD` (Auth Required)
Trả về toàn bộ tổng hợp calo đã nạp, calo còn lại, P/C/F progress bar, lượng nước, điểm Healthy và chuỗi ngày streak.

### `GET /dashboard/weekly?start_date=YYYY-MM-DD` (Auth Required)
Trả về thống kê 7 ngày trong tuần và biểu đồ xu hướng.

---

## 6. Weight Tracking

### `POST /weight` (Auth Required)
Ghi nhận cân nặng và số đo cơ thể.
```json
// Request Body
{
  "weight_kg": 71.2,
  "body_fat_percentage": 17.5,
  "waist_cm": 77.0,
  "logged_date": "2026-08-18"
}
```

### `GET /weight/history?limit=30` (Auth Required)
Lấy lịch sử cân nặng và tiến trình đạt mục tiêu.
