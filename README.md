# WiZApp - Local Smart Bulb Controller

![WiZApp](https://img.shields.io/badge/Status-Functional-success) ![React Native](https://img.shields.io/badge/Built_with-React_Native-blue) ![Expo](https://img.shields.io/badge/Framework-Expo-black) ![Claude](https://img.shields.io/badge/Designed_by-Claude-purple)

WiZApp is a local, lightweight Android app designed to control WiZ smart bulbs over your local network. It was created to provide a cloud-free alternative for managing your lights without needing the official WiZ app or setting up a dedicated Home Assistant server.

No accounts. No cloud. No internet needed. Just you, your phone, and your local Wi-Fi.

> **Note:** Built entirely based on vibes using **Claude**! I had never built an Android app before, so cut me some slack. It works surprisingly well, especially if you have an old spare phone you want to turn into a dedicated smart home remote!

---

## ✨ Features

- **🔍 Auto-Discovery:** Automatically finds your WiZ bulbs on the local network using UDP broadcast.
- **💡 Basic Controls:** Toggle power and adjust brightness smoothly.
- **🎨 Color & Temperature:** Change color temperature (warm to cool white) and full RGB colors.
- **🎬 WiZ Scenes:** Trigger all 20 built-in WiZ scenes (Ocean, Romance, Fireplace, etc.).
- **📁 Custom Groups:** Group multiple bulbs together (e.g., "Living Room") to control them all at once.
- **🔒 100% Local:** Commands are sent directly to the bulbs via UDP. No data leaves your network.

## 🛠 Prerequisites

1. Your WiZ bulbs must already be set up and connected to your local Wi-Fi network (you will need the official WiZ app to do this initial setup).
2. The Android device running this app **must be connected to the same Wi-Fi network**.

## 🚀 Getting Started

If you want to run or build the app locally from the source:

```bash
# Install dependencies
npm install

# Start the Expo development server
npx expo start

# Run on Android (requires an emulator or a connected device)
npm run android
```

## 📱 Compatibility

- Currently only tested extensively on an **old Motorola EDGE**.
- Being built on Expo, it theoretically should work on newer Androids and even iOS, but YMMV. Feel free to try it!

## 🤝 Contributing

Since this is a personal project heavily guided by Claude, the codebase is a bit of an adventure. Feel free to fork it, improve it, and make it your own.

---

*Enjoy your totally private, no-cloud-attached smart lights!*
