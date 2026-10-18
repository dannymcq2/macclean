# MacClean Studio

A modern, fast, and feature-rich macOS system cleaner and performance suite built with **Electron**, **React**, and **Tailwind CSS**.

---

## ✨ Features

- **System Cleaner & Cache Sweeper**: Safely identifies and clears system caches, application leftovers, log files, and temporary clutter.
- **Photos & iOS Media Cleaner**: Scans photo libraries, derivative thumbnail caches, 4K video exports, and iOS device backups (`MobileSync/Backup`).
- **Interactive Visual Gallery**: Full thumbnail grid & video play cards with lightbox and inline video player for reviewing media before purging.
- **Visual Storage Treemap**: Interactive DaisyDisk-style visual storage drill-down for finding bulky folders and files.
- **Process Memory Hogs Manager**: Real-time process monitoring with 1-click safe termination for heavy apps consuming CPU/RAM.
- **Developer Cleaner**: Scans and cleans bulky developer caches including `node_modules`, Xcode DerivedData, CocoaPods, Docker, and Cargo.
- **Duplicate & Large Files Finder**: Quickly detects duplicate files and huge archives across your drive.
- **App Uninstaller**: Deep-cleans apps and their scattered preference/support files across `~/Library`.
- **Battery Health & Diagnostics**: Live cycle counts, battery condition, temperature, and health telemetry.
- **Privacy Sanitizer & DNS Flusher**: Quick-clears browser history, cookies, and flushes macOS DNS cache.
- **Interactive Audio Feedback**: Custom synthesized sound effects using the Web Audio API for clean completions and actions.

---

## 🛠️ Tech Stack

- **Desktop Framework**: Electron
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend Service**: Express, `systeminformation`
- **Audio Engine**: Web Audio API

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- macOS (tested on macOS Sonoma / Sequoia)

### Installation

```bash
# Clone the repository
git clone https://github.com/dannymcq2/macclean.git
cd macclean

# Install dependencies
npm install
```

### Development

Run the frontend and backend in development mode:

```bash
# Start frontend & backend
npm run dev
```

### Packaging the Native App

```bash
# Build production bundle
npm run build

# Package native macOS app
npx @electron/packager . "MacClean Studio" --platform=darwin --arch=arm64 --out=dist-app --overwrite
```

---

## 📄 License

MIT
