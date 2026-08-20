# CalTrack AI — Production Mobile App & Backend

Hệ sinh thái ứng dụng theo dõi dinh dưỡng, đếm calo, nhận diện món ăn bằng Camera AI và quản trị Subscription (Apple IAP) chuẩn **iOS App Store**.

---

## 🏗️ Kiến Trúc Hệ Thống (Server-Centric Architecture)

- **Frontend Mobile:** Expo SDK 57 (React Native 0.86 + React 19 + TypeScript)
- **Backend Production:** Laravel 12 + PostgreSQL 17 + Redis 7 + Nginx + Docker
- **AI Vision Engine:** Google Gemini 2.5/3.0 & OpenAI GPT-4o Vision
- **In-App Purchases:** Apple StoreKit 2 & Server Notifications V2 Webhook
- **Lưu cục bộ:** Nhật ký ăn uống, cân nặng và số đo lưu trên máy bằng AsyncStorage.
  Chưa có hàng đợi đồng bộ nền — dữ liệu chỉ lên server qua các lệnh gọi API trực tiếp.
- **Apple Health:** Đọc bước chân và calo tiêu hao, ghi cân nặng. Dữ liệu sức khoẻ không rời khỏi máy.

---

## 🚀 Hướng Dẫn Khởi Chạy

### 1. Khởi động Backend (Docker hoặc Local)

**Cách 1: Chạy bằng Docker Compose (Khuyên dùng):**
```bash
cd backend
cp .env.example .env
docker compose up -d
```

**Cách 2: Chạy trực tiếp trên máy phát triển:**
```bash
cd backend
composer install
php artisan migrate --seed
php artisan serve --port=8000
```
> Trang Admin Portal có sẵn tại: `http://localhost:8000/admin`

---

### 2. Khởi động Frontend Expo Mobile App

```bash
# Cài đặt dependencies
npm install

# Khởi động Expo Development Server
npx expo start
```
Quét mã QR bằng ứng dụng **Expo Go** trên iPhone hoặc thiết bị Android để trải nghiệm.

---

## 📁 Cấu Trúc Dự Án

```text
caltrack-expo/
├── backend/                    # Laravel 12 Production Backend
│   ├── app/
│   │   ├── Http/Controllers/   # Auth, Meal, IAP, Goals, Weight, Admin
│   │   ├── Services/           # AiVision, TDEE, IAP JWS, NutritionValidator
│   │   ├── Jobs/               # AnalyzeMealJob (Redis Queue)
│   │   └── Models/             # User, MealLog, Food, Subscription, DailyGoal
│   ├── routes/                 # api.php, web.php
│   └── docker-compose.yml      # App, PostgreSQL, Redis, Nginx, Queue-Worker
├── docs/                       # Tài liệu thiết kế & kỹ thuật
│   ├── PROGRESS.md             # Bảng theo dõi tiến độ từng Wave
│   ├── API.md                  # Tài liệu đặc tả RESTful API
│   └── PROMPT_AI_VISION.md     # Prompt chuẩn và Schema JSON cho AI
├── src/                        # Mã nguồn ứng dụng Expo Mobile
│   ├── components/             # CalorieRing, FoodCard, RulerPicker, v.v.
│   ├── constants/              # Theme tokens (Light/Dark Mode)
│   ├── context/                # AppContext & State Management
│   ├── screens/                # Home, CameraScan, FoodResult, Progress, Onboarding
│   └── services/               # apiClient.ts, aiFoodEngine.ts
├── App.tsx                     # Entrypoint & Navigation Stack
├── app.json                    # Cấu hình quyền iOS/Android & Bundle ID
└── eas.json                    # Cấu hình EAS Build & TestFlight
```

---

## 📖 Tài Liệu Tham Khảo
* [docs/PROGRESS.md](docs/PROGRESS.md) — Theo dõi tiến độ Wave 0 đến Wave 6
* [docs/API.md](docs/API.md) — Đặc tả API Endpoints & Request/Response
* [docs/PROMPT_AI_VISION.md](docs/PROMPT_AI_VISION.md) — AI Vision System Prompt & Schema
