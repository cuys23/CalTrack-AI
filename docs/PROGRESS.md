# CalTrack AI — Production Progress Tracker

> **Project:** CalTrack AI Mobile App & Production Backend  
> **Target:** Apple iOS App Store & Android  
> **Backend:** Laravel 12 + PostgreSQL 17 + Redis 7 + Docker  
> **Frontend:** Expo SDK 57 (React Native + TypeScript)  
> **Last Updated:** 2026-08-18  

---

## 📊 Tổng Quan Tiến Độ Các Waves

| Wave | Hạng Mục | Trạng Thái | Tiến Độ | Ghi Chú |
| :--- | :--- | :---: | :---: | :--- |
| **Wave 0** | Chuẩn bị & Foundation Infrastructure | ✅ **DONE** | 100% | Docker, Laravel 12, Sanctum, Expo SDK 57 SecureStore/NetInfo, EAS Config |
| **Wave 1** | Authentication & User Profile Sync | 🟡 **IN PROGRESS** | 80% | Backend Auth/TDEE APIs Done, Frontend SecureStore integration |
| **Wave 2** | Apple IAP Backend & StoreKit 2 | 🟡 **IN PROGRESS** | 75% | JWS Decoder, Verify, Restore, Webhook V2, CheckPremium Middleware |
| **Wave 3** | AI Vision + Meal Pipeline (Queue) | 🟡 **IN PROGRESS** | 70% | Gemini/GPT-4o Vision, NutritionValidator, Redis Queue Worker |
| **Wave 4** | Dashboard, Weight & Offline-First Sync | 🟡 **IN PROGRESS** | 65% | Daily/Weekly Dashboard, Weight CRUD, NetInfo offline handling |
| **Wave 5** | Security, Legal & App Store Compliance | 🟡 **IN PROGRESS** | 70% | Privacy, Terms, EULA, Delete Account (Apple 5.1.1), Rate Limiting |
| **Wave 6** | Testing, TestFlight & App Store Submit | ⚪ **QUEUED** | 0% | EAS Build Archive, Sandbox IAP Testing, TestFlight release |

---

## 📝 Chi Tiết Từng Wave

### 🧱 Wave 0 — Foundation Infrastructure
- [x] Tạo `docs/PROGRESS.md`, `docs/API.md`, `docs/PROMPT_AI_VISION.md`.
- [x] Cấu hình `eas.json` phục vụ EAS Build & TestFlight.
- [x] Cập nhật `README.md` chuẩn production không chứa đường dẫn local.
- [x] Cài đặt `expo-secure-store`, `expo-network`, `@react-native-community/netinfo`.
- [x] Backend Docker Compose (`app`, `nginx`, `postgres:17`, `redis:7`, `queue-worker`) & Sanctum API sẵn sàng.

---

### 👤 Wave 1 — Authentication & User Profile
- [x] Database: Bảng `users` (thể trạng, mục tiêu), `daily_goals`.
- [x] Backend: `TdeeService` & `GoalCalculator` (Mifflin-St Jeor).
- [x] APIs: `/api/auth/register`, `/api/auth/login`, `/api/auth/apple`, `/api/me`, `/api/profile`, `/api/goals`.
- [ ] Frontend: Đồng bộ token qua `expo-secure-store`, Auth modal & AppContext sync.

---

### 💳 Wave 2 — Apple IAP (StoreKit 2)
- [x] Backend: `subscription_products`, `subscriptions`, `iap_transactions`, `app_store_notifications`.
- [x] Backend: `AppleJwsDecoder`, `SubscriptionService`, `CheckPremium` middleware.
- [x] Webhook: Tiếp nhận và xử lý Apple Server Notifications V2 JWS.
- [ ] Frontend: Màn hình Paywall Pro và nút Restore Purchases.

---

### 🤖 Wave 3 — AI Vision & Meal Queue System
- [x] Backend: `meal_logs`, `foods`, `UploadService`.
- [x] Backend: `AiVisionService` kết nối Gemini & GPT-4o Vision kèm prompt chuẩn.
- [x] Backend: `NutritionValidator` và Redis Queue `AnalyzeMealJob`.
- [ ] Frontend: Camera scan gửi request bất đồng bộ kèm polling status & offline cache.

---

### 📊 Wave 4 — Dashboard & Weight Tracking
- [x] Backend: `DashboardService` (hôm nay, 7 ngày, streak), `WeightService`.
- [x] APIs: `/api/dashboard`, `/api/dashboard/weekly`, `/api/weight`.
- [ ] Frontend: Offline-first cache & NetInfo network banner.

---

### 🔒 Wave 5 — Security & Legal Compliance
- [x] Rate limiting: Auth (10 req/min), AI Vision (15 req/min).
- [x] Apple Guideline 5.1.1: Endpoint `POST /api/auth/delete-account`.
- [x] Legal endpoints: `/api/legal/privacy`, `/api/legal/terms`, `/api/legal/eula`.
- [ ] Cấu hình đầy đủ permission description trong `app.json`.

---

### 🚀 Wave 6 — Testing & Submission
- [x] 13/13 automated test cases backend passed (55 assertions).
- [ ] EAS Build iOS Archive.
- [ ] TestFlight Release & App Store Review Submission.
