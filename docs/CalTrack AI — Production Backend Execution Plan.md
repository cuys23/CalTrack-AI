# CalTrack AI — Production Backend Execution Plan

> **Project:** CalTrack AI  
> **Target:** iOS App Store (Auto-Renewable Subscription)  
> **Backend:** Laravel 12 + PostgreSQL + Redis + Docker  
> **Version:** Production v1.0

## Mục tiêu

Xây dựng một backend đủ tiêu chuẩn production để:

- Hỗ trợ AI nhận diện món ăn từ ảnh
- Đồng bộ dữ liệu người dùng theo thời gian thực
- Quản lý Subscription (Apple IAP) bằng server
- Đáp ứng yêu cầu App Store Review
- Dễ mở rộng sang Android trong tương lai

---

# Wave 0 — Foundation Infrastructure

**Mục tiêu:** dựng nền tảng backend ổn định trước khi viết business logic.

### Công nghệ

- Laravel 12
- PHP 8.3
- PostgreSQL 17
- Redis 7
- Docker + Docker Compose
- Nginx

### Thực hiện

- [ ] Khởi tạo project Laravel
- [ ] Cấu hình Docker cho App / DB / Redis
- [ ] Thiết lập PostgreSQL
- [ ] Thiết lập Redis Queue
- [ ] Sanctum Authentication
- [ ] Environment production & local
- [ ] Laravel Pint + GitHub Actions

### Kết quả

Backend có thể chạy bằng một lệnh:

```bash
docker compose up -d
```

---

# Wave 1 — Authentication & User Profile

**Mục tiêu:** hoàn thiện hệ thống tài khoản.

## Database

### users

- name
- email
- password
- gender
- birthday
- height
- activity_level

### daily_goals

- target_calories
- protein
- carbs
- fat
- goal_type

## API

| Method | Endpoint |
|---|---|
| POST | `/auth/register` |
| POST | `/auth/login` |
| POST | `/auth/logout` |
| GET | `/me` |
| PUT | `/profile` |
| GET | `/goals` |
| PUT | `/goals` |

## Service

- TdeeService
- GoalCalculator

### Kết quả

Người dùng có thể tạo tài khoản và nhận được mục tiêu calories mỗi ngày.

---

# Wave 2 — Apple IAP Backend (Quan trọng nhất)

> Đây là module bắt buộc để App Store duyệt Subscription.

## Database

### subscription_products

Lưu Product ID từ App Store Connect.

### subscriptions

Lưu entitlement hiện tại.

### iap_transactions

Lưu toàn bộ transaction của Apple.

### app_store_notifications

Lưu webhook để debug.

## API

| Method | Endpoint |
|---|---|
| POST | `/iap/verify` |
| POST | `/iap/restore` |
| GET | `/iap/status` |

## Webhook

```text
POST /webhooks/app-store
```

Backend sẽ:

1. Verify chữ ký JWS
2. Đọc Notification Type
3. Cập nhật Subscription
4. Ghi log

## Middleware

Tạo middleware:

```text
CheckPremium
```

Không sử dụng `is_premium` trong bảng users.

### Kết quả

- Mua Premium
- Gia hạn
- Restore Purchase
- Hủy Subscription
- Refund

Đều đồng bộ tự động.

---

# Wave 3 — Meal & AI System

**Mục tiêu:** chức năng chính của CalTrack.

## Database

### meal_logs

- image_url
- meal_type
- status
- total_calories
- analyzed_at

### foods

- name
- grams
- calories
- protein
- carbs
- fat
- confidence

## API

| Method | Endpoint |
|---|---|
| POST | `/meal/analyze` |
| GET | `/meal/jobs/{id}` |
| GET | `/meal/{id}` |
| PUT | `/meal/{id}` |
| DELETE | `/meal/{id}` |
| GET | `/meal?date=` |

## Service

### UploadService

- Upload Cloudinary
- Resize Image
- Generate URL

### AiVisionService

- GPT Vision
- Prompt Engineering
- Parse JSON

### NutritionValidator

- Reject số âm
- Kiểm tra macro hợp lệ
- Confidence tối thiểu

## Queue

AnalyzeMealJob

Flow:

1. Upload ảnh
2. Dispatch Queue
3. GPT xử lý
4. Validate
5. Lưu DB

### Kết quả

Người dùng nhận kết quả sau vài giây mà không bị timeout.

---

# Wave 4 — Dashboard & Analytics

## Dashboard

Hiển thị:

- Calories hôm nay
- Calories còn lại
- Protein
- Carb
- Fat
- Water Progress
- Streak

## API

| Method | Endpoint |
|---|---|
| GET | `/dashboard` |
| GET | `/dashboard/weekly` |
| GET | `/dashboard/monthly` |

## Service

DashboardService

- todaySummary()
- weeklyAverage()
- currentStreak()

### Kết quả

Frontend chỉ render dữ liệu, mọi phép tính nằm ở backend.

---

# Wave 5 — Weight Tracking

## Database

weight_logs

- weight
- body_fat
- logged_at

## API

| Method | Endpoint |
|---|---|
| POST | `/weight` |
| GET | `/weight/history` |
| DELETE | `/weight/{id}` |

## Analytics

- Weekly Average
- Monthly Progress
- Goal Difference

---

# Wave 6 — Production Security

## Rate Limit

- Meal Analyze
- Login
- Register

## Policies

- User chỉ xem dữ liệu của mình
- Meal Authorization
- Weight Authorization

## Logging

- Failed AI
- Failed IAP
- Queue Errors

## Backup

- PostgreSQL Daily Backup
- Storage Backup

---

# Wave 7 — App Store Release

## Pháp lý

- [ ] Privacy Policy
- [ ] Terms of Use
- [ ] EULA
- [ ] Delete Account
- [ ] Restore Purchases

## Testing

- [ ] Sandbox IAP
- [ ] TestFlight
- [ ] Subscription Renew
- [ ] Refund Test
- [ ] Offline Mode

## Monitoring

- Queue Health
- Redis
- Storage
- API Response Time

---

# Cấu trúc Backend cuối cùng

```text
app/

 ├── Actions/

 │    ├── AnalyzeMealAction

 │    ├── VerifyPurchaseAction

 │    └── RestorePurchaseAction

 ├── Services/

 │    ├── AiVisionService

 │    ├── TdeeService

 │    ├── DashboardService

 │    ├── SubscriptionService

 │    └── NutritionValidator

 ├── Jobs/

 │    ├── AnalyzeMealJob

 │    └── VerifyReceiptJob

 ├── Policies/

 ├── Models/

 └── Http/
```

---

# Thứ tự triển khai (14 ngày)

| Ngày | Công việc |
|---|---|
| 1 | Docker + PostgreSQL + Sanctum |
| 2 | User + Profile + Goals |
| 3 | IAP Database + Product |
| 4 | Verify Purchase API |
| 5 | App Store Webhook |
| 6 | Restore Purchase |
| 7 | Meal Database |
| 8 | Upload Image |
| 9 | GPT Vision Integration |
| 10 | Queue + Retry |
| 11 | Dashboard |
| 12 | Weight Tracking |
| 13 | Security + Rate Limit |
| 14 | TestFlight + Production Review |

---

# Definition of Done (Production)

## Infrastructure

- [ ] Docker Production
- [ ] PostgreSQL
- [ ] Redis Queue

## Authentication

- [ ] Register/Login
- [ ] Sanctum
- [ ] Profile

## Subscription

- [ ] Verify Purchase
- [ ] Restore Purchase
- [ ] Webhook V2
- [ ] Premium Middleware

## AI

- [ ] Upload Image
- [ ] GPT Vision
- [ ] Queue
- [ ] Nutrition Validation

## Dashboard

- [ ] Daily Calories
- [ ] Macro Progress
- [ ] Weekly Analytics

## Release

- [ ] Privacy Policy
- [ ] Terms
- [ ] Delete Account
- [ ] TestFlight Passed
- [ ] Ready for App Store Submission

---

# Triết lý kiến trúc

CalTrack AI sử dụng **Server-Centric Architecture**: toàn bộ logic quan trọng (AI, TDEE, Macro, Subscription, Analytics) được xử lý ở backend. Expo chỉ chịu trách nhiệm giao diện và gọi API, giúp đảm bảo bảo mật IAP, dễ bảo trì và sẵn sàng mở rộng đa nền tảng.