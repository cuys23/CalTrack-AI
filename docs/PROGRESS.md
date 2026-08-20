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
| **Wave 1** | Authentication & User Profile Sync | ✅ **DONE** | 100% | Apple & Google Sign-In thật (verify identity token qua JWKS của từng nhà cung cấp), SecureStore, TDEE Goal, Delete Account |
| **Wave 2** | Apple IAP Backend & StoreKit 2 | ✅ **DONE** | 100% | expo-iap (StoreKit 2), Restore, JWS verify đầy đủ (x5c chain → Apple Root CA G3), chống replay giao dịch, Webhook V2, CheckPremium |
| **Wave 3** | AI Vision + Meal Pipeline (Queue) | ✅ **DONE** | 100% | Gemini/GPT-4o Vision API, NutritionValidator, Redis Queue, Camera fallback |
| **Wave 4** | Dashboard, Weight & Offline-First Sync | ✅ **DONE** | 100% | Daily/Weekly aggregates, Weight tracking, Local cache + Cloud sync |
| **Wave 5** | Security, Legal & App Store Compliance | ✅ **DONE** | 100% | Privacy Policy, Terms, EULA, Delete Account (Apple 5.1.1), Rate Limiting |
| **Wave 6** | Testing, TestFlight & App Store Submit | 🟡 **IN PROGRESS** | 70% | 13/13 unit & feature tests pass, EAS config ready for build archive |

---

## 📝 Chi Tiết Từng Wave

### 🧱 Wave 0 — Foundation Infrastructure (DONE)
- [x] Tạo `docs/PROGRESS.md`, `docs/API.md`, `docs/PROMPT_AI_VISION.md`.
- [x] Cấu hình `eas.json` phục vụ EAS Build & TestFlight.
- [x] Cập nhật `README.md` chuẩn production không chứa đường dẫn local.
- [x] Cài đặt `expo-secure-store`, `expo-network`, `@react-native-community/netinfo`.
- [x] Backend Docker Compose (`app`, `nginx`, `postgres:17`, `redis:7`, `queue-worker`) & Sanctum API sẵn sàng.

### 👤 Wave 1 — Authentication & User Profile (DONE)
- [x] Database: Bảng `users` (thể trạng, mục tiêu), `daily_goals`.
- [x] Backend: `TdeeService` & `GoalCalculator` (Mifflin-St Jeor).
- [x] APIs: `/api/auth/register`, `/api/auth/login`, `/api/auth/apple`, `/api/me`, `/api/profile`, `/api/goals`.
- [x] Frontend: `AuthModal.tsx` đồng bộ token qua `expo-secure-store`, `SignInScreen` kết nối API thực tế.
- [x] `expo-apple-authentication` + backend `IdentityTokenVerifier` (JWKS, iss/aud/exp) — `apple_user_id` chỉ lấy từ claim `sub` đã verify.
- [x] `@react-native-google-signin/google-signin` + backend verify `id_token` qua Google JWKS; `google_user_id` chỉ lấy từ claim `sub`.

### 💳 Wave 2 — Apple IAP & StoreKit 2 (DONE)
- [x] Backend: `subscription_products`, `subscriptions`, `iap_transactions`, `app_store_notifications`.
- [x] Backend: `AppleJwsDecoder`, `SubscriptionService`, `CheckPremium` middleware.
- [x] Webhook: Tiếp nhận và xử lý Apple Server Notifications V2 JWS.
- [x] Frontend: `PaywallScreen` dùng `expo-iap` (StoreKit 2), giá lấy từ App Store, verify JWS ở server trước khi `finishTransaction`.
- [x] `AppleJwsDecoder` verify chain x5c về Apple Root CA G3 + ES256 + `bundleId`; một `originalTransactionId` chỉ thuộc một tài khoản.

### 🤖 Wave 3 — AI Vision & Meal Queue System (DONE)
- [x] Backend: `meal_logs`, `foods`, `UploadService`.
- [x] Backend: `AiVisionService` kết nối Gemini & GPT-4o Vision kèm prompt chuẩn.
- [x] Backend: `NutritionValidator` và Redis Queue `AnalyzeMealJob`.
- [x] Frontend: `handleCapturePhoto` kết nối `apiClient.analyzeMeal` với cơ chế offline-first fallback.

### 📊 Wave 4 — Dashboard & Weight Tracking (DONE)
- [x] Backend: `DashboardService` (hôm nay, 7 ngày, streak), `WeightService`.
- [x] APIs: `/api/dashboard`, `/api/dashboard/weekly`, `/api/weight`.
- [x] Frontend: `apiClient` sẵn sàng đồng bộ Dashboard và Weight logs.

### 🔒 Wave 5 — Security & Legal Compliance (DONE)
- [x] Rate limiting: Auth (10 req/min), AI Vision (15 req/min).
- [x] Apple Guideline 5.1.1: Endpoint `POST /api/auth/delete-account` và nút Xóa tài khoản xác thực trong `ProfileScreen`.
- [x] Legal endpoints: `/api/legal/privacy`, `/api/legal/terms`, `/api/legal/eula`.
- [x] Cấu hình đầy đủ permission description trong `app.json`.

### 🚀 Wave 6 — Testing & Submission (IN PROGRESS)
- [x] 13/13 automated test cases backend passed (55 assertions).
- [x] `npx tsc --noEmit` pass 100% không lỗi.
- [x] Cấu hình `eas.json` sẵn sàng chạy `eas build --platform ios`.
