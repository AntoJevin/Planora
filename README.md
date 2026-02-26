# ManageSelf

**ManageSelf** is a comprehensive productivity application built with React Native and Expo, designed to help you track your work hours, manage tasks, and securely store sensitive information.

## 🚀 Features

### 📅 Timesheet Management
- **Track Work Hours**: Log your daily tasks with precise punch-in and punch-out times.
- **Employer Details**: Manage multiple employer profiles with contact information and logos.
- **Weekly/Monthly Reports**: Generate professional PDF reports of your work summary and task details.
- **Target Tracking**: Set weekly target hours and track your progress against them.

### ✅ Todo & Planning
- **Daily Planner**: Plan your day with a focused daily view.
- **Task Organization**: Categorize todos to stay organized across different projects.
- **Notifications**: Receive reminders to plan your day and upcoming tasks.

### 🔐 Secure Vault
- **Encrypted Storage**: Securely store passwords, usernames, and sensitive notes.
- **Biometric Security**: Protect your vault with FaceID or Fingerprint unlock.
- **Vault Passcode**: Secondary 4-digit security code for an extra layer of protection.

### ⭐ Premium Features
- **Subscription-Based Access**: Specialized features unlocked through flexible subscription plans.
- **In-App Purchases**: Seamless upgrade flow powered by RevenueCat.
- **Subscription Management**: Easily manage your premium status via the integrated Customer Center.

## 🛠️ Technology Stack

- **Framework**: React Native with Expo (SDK 54)
- **Navigation**: Expo Router (File-based routing)
- **Database**: Local SQLite storage via `expo-sqlite`
- **Payments**: RevenueCat SDK for iOS & Android subscriptions
- **Styling**: NativeWind (Tailwind CSS for React Native) & Vanilla CSS
- **Authentication**: `expo-local-authentication` for biometrics

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Expo Go](https://expo.dev/go) app on your mobile device
- [iOS Simulator](https://developer.apple.com/xcode/) or [Android Emulator](https://developer.android.com/studio/run/managing-avds)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npx expo start
   ```

## 📂 Project Structure

- `src/components`: UI components and screen tabs.
- `src/context`: Global state management for settings and purchases.
- `src/database`: SQLite schema definitions and database logic.
- `src/services`: Business logic and data access layers.
- `src/types`: TypeScript interface definitions.
- `assets/images`: App icons, splash screens, and image assets.

---
Developed for internal release by **Q's Ministry**.
