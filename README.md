# CalTrack AI — Ứng dụng Di Động Expo React Native

Ứng dụng đếm calo, nhận diện món ăn bằng Camera AI và theo dõi dinh dưỡng được xây dựng hoàn chỉnh trên nền tảng **Expo (React Native + TypeScript)** theo tài liệu thiết kế giao diện chuẩn iOS.

---

## 🚀 Hướng dẫn khởi chạy & Trải nghiệm

### 1. Khởi động Expo Development Server
Mở terminal trong thư mục dự án:
```bash
cd /Users/pc/.gemini/antigravity-ide/scratch/caltrack-expo
npx expo start
```

### 2. Trải nghiệm trên thiết bị thật (iPhone / Android)
- Cài đặt ứng dụng **Expo Go** từ App Store (iOS) hoặc Google Play Store (Android).
- Mở ứng dụng Camera trên điện thoại và quét mã **QR Code** hiển thị trên terminal để mở ngay ứng dụng trên điện thoại thật với đầy đủ:
  - Máy ảnh thực tế (`expo-camera`)
  - Rung phản hồi chân thực (**Taptic Engine** qua `expo-haptics`)
  - Vòng Calo & Macro SVG mượt mà (`react-native-svg`)
  - Lưu trữ dữ liệu vĩnh viễn trên máy (`@react-native-async-storage/async-storage`)

---

## 📁 Cấu trúc thư mục dự án

```
caltrack-expo/
├── App.tsx                     # Điểm khởi chạy chính & Navigation Stack
├── app.json                    # Cấu hình quyền Camera, biểu tượng và Splash
├── src/
│   ├── components/
│   │   ├── CalorieRing.tsx     # Vòng tròn Calo & Macro (react-native-svg)
│   │   ├── FoodCard.tsx        # Thẻ món ăn & dải ngày DateStrip
│   │   ├── RulerPicker.tsx     # Thước đo cuộn tương tác kèm Haptic
│   │   └── HealthScoreGauge.tsx# Thang đo điểm Healthy AI
│   ├── constants/
│   │   └── theme.ts            # Bảng màu Light / Dark Mode chuẩn token
│   ├── context/
│   │   └── AppContext.tsx      # Quản lý State & AsyncStorage
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Trang chủ Dashboard & 4 bữa ăn
│   │   ├── CameraScanScreen.tsx# Camera quét món ăn, mã vạch & tải ảnh
│   │   ├── FoodResultScreen.tsx# Màn hình kết quả phân tích AI 280px
│   │   ├── ProgressScreen.tsx  # Tiến trình, biểu đồ cân nặng & số đo
│   │   └── OnboardingScreen.tsx# Quy trình khảo sát tính BMR & mục tiêu
│   ├── services/
│   │   └── aiFoodEngine.ts     # Động cơ AI Vision & Kho dữ liệu món ăn
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   └── utils/
│       └── haptics.ts          # Module rung native expo-haptics
```
