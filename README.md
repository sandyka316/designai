# 🎨 DesignAI — Frontend

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.2.6-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![NextAuth](https://img.shields.io/badge/NextAuth-4-purple?style=for-the-badge)

**Platform generasi desain gambar AI dengan Smart Prompt Engineering & Machine Learning**

</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Struktur Proyek](#-struktur-proyek)
- [Halaman & Routing](#-halaman--routing)
- [Prasyarat](#-prasyarat)
- [Instalasi & Setup](#-instalasi--setup)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Autentikasi](#-autentikasi)
- [Guest Mode](#-guest-mode)
- [Deployment dengan Docker](#-deployment-dengan-docker)

---

## 🧠 Tentang Proyek

**DesignAI Frontend** adalah aplikasi web modern berbasis **Next.js 15** (App Router) yang menyediakan antarmuka pengguna untuk platform generasi gambar AI. Aplikasi ini terhubung ke [DesignAI Backend API](../apidesignai) dan menawarkan berbagai fitur canggih seperti generasi gambar berbasis AI, Smart Prompt Engineering dengan Fuzzy Logic, Genetic Algorithm, Neural Network, serta analitik dan rekomendasi cerdas.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🖼️ **Generasi Gambar AI** | Buat gambar berkualitas tinggi dari prompt teks menggunakan model NanoBanana FLUX |
| 🧬 **Prompt Evolution** | Optimalkan prompt secara evolusioner menggunakan Genetic Algorithm interaktif |
| 🧠 **Rating Predictor** | Prediksi kualitas prompt menggunakan Neural Network 10→6→1 layer (ReLU + Sigmoid) |
| 📊 **Fuzzy Credit System** | Hitung & klaim bonus kredit berbasis aktivitas dengan visualisasi Fuzzy Logic |
| 🔍 **Semantic Search** | Cari desain menggunakan Vector Space Model (VSM) + CLIP embeddings |
| 💡 **Rekomendasi AI** | Rekomendasi desain otomatis berdasarkan histori pengguna |
| 📈 **Analytics** | Visualisasi data mining: distribusi style, tren penggunaan, word cloud |
| 🤖 **Deep Learning Panel** | CLIP alignment score dan LSTM smart prompt suggestion |
| 📊 **Dashboard** | Galeri desain pribadi, statistik kredit, dan manajemen koleksi |
| 🔐 **Autentikasi** | Login via Google OAuth atau email/password dengan NextAuth |
| 🌙 **Dark/Light Mode** | Theme toggle tanpa flicker menggunakan inline script localStorage |
| 📱 **Responsive Design** | UI mobile-first dengan Tailwind CSS v4 |

---

## 🏗️ Tech Stack

### Core
- **[Next.js 15.2.6](https://nextjs.org/)** — React framework dengan App Router
- **[React 19](https://react.dev/)** — UI library terbaru
- **[TypeScript 5](https://www.typescriptlang.org/)** — Type-safe JavaScript

### Styling
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** — Icon library ringan

### Autentikasi
- **[NextAuth v4](https://next-auth.js.org/)** — Autentikasi lengkap (Google OAuth + Credentials)

### Infrastruktur
- **[Docker](https://www.docker.com/)** — Containerization
- **[PostgreSQL 16](https://www.postgresql.org/)** — Database (via docker-compose)
- **[Redis 7](https://redis.io/)** — Cache & session (via docker-compose)

---

## 📁 Struktur Proyek

```
designai/
│
├── 📄 package.json               # Dependensi & scripts
├── 📄 next.config.ts             # Konfigurasi Next.js
├── 📄 tsconfig.json              # Konfigurasi TypeScript
├── 📄 postcss.config.mjs         # Konfigurasi PostCSS
├── 📄 eslint.config.mjs          # Konfigurasi ESLint
├── 📄 docker-compose.yml         # PostgreSQL & Redis containers
├── 📄 .env.local.example         # Template environment variables
│
├── 📁 app/                       # Next.js App Router
│   ├── layout.tsx                # Root layout (theme, auth provider)
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # Global styles
│   │
│   ├── 📁 dashboard/             # Halaman dashboard pengguna
│   ├── 📁 generate/              # Halaman generasi gambar AI
│   ├── 📁 analytics/             # Halaman analitik & data mining
│   ├── 📁 recommendation/        # Halaman rekomendasi desain
│   ├── 📁 semantic-search/       # Halaman pencarian semantik VSM
│   ├── 📁 deep-learning/         # Panel CLIP & LSTM
│   │
│   ├── 📁 smart-prompt/          # Hub Smart Prompt Engineering
│   │   ├── page.tsx              # Halaman utama Smart Prompt
│   │   ├── fuzzy-credit/         # Fuzzy Logic credit system
│   │   ├── prompt-evolution/     # Genetic Algorithm prompt evolution
│   │   └── rating-predictor/     # Neural Network rating predictor
│   │
│   ├── 📁 login/                 # Halaman login
│   ├── 📁 register/              # Halaman registrasi
│   ├── 📁 about/                 # Halaman tentang
│   ├── 📁 contact/               # Halaman kontak
│   ├── 📁 privacy/               # Halaman kebijakan privasi
│   ├── 📁 terms/                 # Halaman syarat & ketentuan
│   │
│   └── 📁 api/                   # API Routes (Next.js server)
│       ├── auth/[...nextauth]/   # NextAuth handler
│       └── download/             # Image proxy (server-side download)
│
├── 📁 components/                # Komponen UI yang dapat digunakan ulang
│   ├── Navbar.tsx                # Navigasi utama + theme toggle + auth
│   ├── Footer.tsx                # Footer aplikasi
│   ├── AuthProvider.tsx          # NextAuth session provider
│   ├── ThemeWrapper.tsx          # Wrapper dark/light theme
│   ├── AiDemoSection.tsx         # Seksi demo AI di landing page
│   ├── SpotlightCard.tsx         # Kartu interaktif dengan efek glow
│   └── GuestLimitModal.tsx       # Modal batas penggunaan tamu
│
├── 📁 lib/                       # Utility & helper functions
│   └── guestLimit.ts             # Manajemen limit penggunaan guest
│
├── 📁 types/                     # TypeScript type definitions
└── 📁 public/                    # Static assets (gambar, icons)
```

---

## 🗺️ Halaman & Routing

| Route | Halaman | Deskripsi |
|-------|---------|-----------|
| `/` | Landing Page | Hero section, fitur showcase, demo interaktif |
| `/dashboard` | Dashboard | Galeri desain, statistik kredit, manajemen koleksi |
| `/generate` | Generate | Input prompt, pilih model, hasilkan gambar AI |
| `/analytics` | Analytics | Grafik penggunaan, distribusi style, tren & word cloud |
| `/recommendation` | Rekomendasi | Saran desain otomatis & manual berbasis AI |
| `/semantic-search` | Semantic Search | Pencarian VSM dengan CLIP embeddings |
| `/deep-learning` | Deep Learning | CLIP score & LSTM smart prompt suggestion |
| `/smart-prompt` | Smart Prompt Hub | Portal fitur Smart Prompt Engineering |
| `/smart-prompt/fuzzy-credit` | Fuzzy Credit | Sistem kredit bonus berbasis Fuzzy Logic |
| `/smart-prompt/prompt-evolution` | Prompt Evolution | Genetic Algorithm untuk optimasi prompt |
| `/smart-prompt/rating-predictor` | Rating Predictor | Neural Network prediksi kualitas prompt |
| `/login` | Login | Masuk via Google OAuth atau email/password |
| `/register` | Register | Daftar akun baru |
| `/about` | About | Tentang platform & tim |
| `/contact` | Contact | Form kontak |
| `/privacy` | Privacy Policy | Kebijakan privasi |
| `/terms` | Terms | Syarat & ketentuan penggunaan |

### API Routes (Server-side)

| Route | Deskripsi |
|-------|-----------|
| `/api/auth/[...nextauth]` | NextAuth handler (Google OAuth + Credentials) |
| `/api/download` | Proxy server-side download gambar (HTTPS-only, blokir private network) |

---

## ⚙️ Prasyarat

Pastikan tools berikut sudah terinstal:

- **Node.js 18+** (disarankan v20 LTS)
- **npm** atau **yarn**
- **Git**
- **Docker & Docker Compose** *(opsional, untuk PostgreSQL & Redis)*

---

## 🚀 Instalasi & Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd designai
```

### 2. Install Dependensi

```bash
npm install
```

### 3. Konfigurasi Environment

```bash
cp .env.local.example .env.local
# Edit file .env.local sesuai konfigurasi Anda
```

### 4. Jalankan Layanan Pendukung (PostgreSQL & Redis)

```bash
docker compose up -d
```

### 5. Jalankan Aplikasi

```bash
# Mode Development
npm run dev

# Build untuk Produksi
npm run build
npm start
```

Aplikasi akan berjalan di: **http://localhost:3000**

---

## 🔧 Konfigurasi Environment

Salin `.env.local.example` menjadi `.env.local` lalu isi nilai-nilainya:

```env
# ========================
# NextAuth Configuration
# ========================
NEXTAUTH_SECRET=your_nextauth_secret_min_32_chars
NEXTAUTH_URL=http://localhost:3000

# ========================
# Google OAuth
# ========================
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ========================
# Backend API URL
# ========================
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Mendapatkan Google OAuth Credentials

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih yang sudah ada
3. Aktifkan **Google+ API** / **Google Identity**
4. Buat OAuth 2.0 Client ID
5. Tambahkan **Authorized Redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. Salin `Client ID` dan `Client Secret` ke `.env.local`

---

## ▶️ Menjalankan Aplikasi

### Development Mode

```bash
npm run dev
```

### Build Production

```bash
npm run build
npm start
```

### Lint & Type Check

```bash
npm run lint
```

---

## 🔐 Autentikasi

Aplikasi menggunakan **NextAuth v4** dengan dua provider:

### 1. Google OAuth
- Login/Register dengan akun Google
- Otomatis sinkronisasi ke backend via endpoint `/api/auth/google-sync`

### 2. Email & Password (Credentials)
- Register manual via form registrasi
- Login dengan email + password yang di-hash di backend
- Token JWT dikembalikan dari backend dan disimpan dalam session NextAuth

### Flow Autentikasi

```
[User] → Google / Email+Password
    ↓
[NextAuth] → Validasi credentials
    ↓
[Backend API] → /api/auth/login atau /api/auth/google-sync
    ↓
[JWT Token] → Disimpan dalam session NextAuth
    ↓
[Akses fitur] → Token dikirim di setiap request ke backend
```

---

## 👤 Guest Mode

Aplikasi mendukung **Guest Mode** — pengguna dapat mencoba fitur tanpa login, dengan batasan:

- Jumlah generasi gambar terbatas
- Akses ke fitur Smart Prompt terbatas
- Limit dilacak via `localStorage` menggunakan `lib/guestLimit.ts`
- Modal `GuestLimitModal` muncul otomatis saat limit tercapai

---

## 🤖 Fitur Smart Prompt Engineering

### 1. 🧬 Prompt Evolution (`/smart-prompt/prompt-evolution`)
Menggunakan **Genetic Algorithm** untuk mengoptimalkan prompt:
- **Inisialisasi** → Generate populasi prompt via backend (Gemini AI)
- **Seleksi Pengguna** → Pilih prompt favorit sebagai "parent"
- **Crossover** → Kombinasi 2 prompt terpilih menghasilkan offspring
- **Mutasi** → Variasi prompt dengan Gemini AI
- Proses berulang hingga prompt optimal ditemukan

### 2. 💳 Fuzzy Credit (`/smart-prompt/fuzzy-credit`)
Sistem bonus kredit berbasis **Fuzzy Logic**:
- Input: jumlah generasi, rata-rata rating, hari aktif
- Fungsi keanggotaan: trapesoid & segitiga
- Output: bonus kredit (0, 2, 5, 10, atau 15 kredit)
- Visualisasi real-time dengan `FuzzyMeter` & `GlowCard`

### 3. 🧠 Rating Predictor (`/smart-prompt/rating-predictor`)
**Neural Network** untuk prediksi kualitas prompt:
- Arsitektur: 10 input → 6 hidden (ReLU) → 1 output (Sigmoid)
- Fitur input: panjang prompt, kata sifat, gaya artistik, dll.
- Output: skor 0–100 + saran perbaikan prompt
- Visualisasi dengan `ScoreGauge` SVG interaktif

---

## 🎨 Komponen UI Utama

### `SpotlightCard`
Kartu interaktif dengan efek glow/spotlight yang mengikuti gerakan kursor. Digunakan di landing page dan Smart Prompt hub.

### `Navbar`
Navigasi utama dengan:
- Logo & link navigasi
- Toggle dark/light mode
- Status autentikasi (login/logout/avatar)
- Indikator kredit pengguna

### `GuestLimitModal`
Modal yang muncul saat guest mencapai batas penggunaan, mengarahkan ke halaman register.

### `AuthProvider`
Wrapper `SessionProvider` dari NextAuth untuk menyediakan session di seluruh aplikasi.

### `ThemeWrapper`
Mengelola class `dark`/`light` pada `<html>` berdasarkan preferensi tersimpan di `localStorage`.

---

## 🐳 Deployment dengan Docker

### Hanya Database & Redis (Recommended untuk dev)

```bash
docker compose up -d
```

`docker-compose.yml` menyertakan:
- **PostgreSQL 16** dengan health check & persistent volume
- **Redis 7** dengan autentikasi password & persistent volume

### Full Stack dengan Next.js

Tambahkan service ke `docker-compose.yml`:

```yaml
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
```

---

## 🌐 Domain & CORS

Next.js dikonfigurasi untuk mengizinkan request dari domain tunnel development:

```
app.unesa.dev
app.claude-code.bond
```

Konfigurasi ini ada di `next.config.ts` untuk mendukung pengembangan via Cloudflare Tunnel.

---

## 📦 Scripts NPM

| Command | Deskripsi |
|---------|-----------|
| `npm run dev` | Jalankan development server (hot reload) |
| `npm run build` | Build aplikasi untuk produksi |
| `npm start` | Jalankan production server |
| `npm run lint` | Jalankan ESLint |

---

## 🔗 Koneksi ke Backend

Frontend berkomunikasi dengan **DesignAI Backend API** melalui:

- Base URL dikonfigurasi via `NEXT_PUBLIC_API_URL`
- Semua request ke backend menggunakan JWT token dari NextAuth session
- Image download menggunakan server-side proxy `/api/download` untuk keamanan

Pastikan backend sudah berjalan di `http://localhost:8000` sebelum menjalankan frontend.

---

## 🔒 Keamanan

- **Image Proxy** — Download gambar melalui server-side route untuk memblokir akses ke private network
- **JWT via NextAuth** — Token dikelola secara aman oleh NextAuth
- **HTTPS Only** — Image proxy hanya mengizinkan URL HTTPS
- **Environment Variables** — Semua secret tidak di-commit ke repository (gunakan `.env.local`)

---

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan akademik dan penelitian.

---

## 👨‍💻 Developer

**Sandyka** — [@sandyka316](https://github.com/sandyka316)

---

<div align="center">
  <p>Dibuat dengan ❤️ menggunakan Next.js & React</p>
</div>
