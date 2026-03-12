# Nöra - Bilişsel Tarama AI Asistanı

Alzheimer tespiti ve bilişsel bozuklukların erken taraması için Gemini Live API ile çalışan yapay zeka ajanı.

**Gemini Hackathon 2025 - Live Agents Kategorisi**

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React, Vite, TailwindCSS, Lucide Icons |
| Backend | Node.js, Express, Prisma ORM |
| Veritabanı | PostgreSQL |
| AI | Gemini Live API, Google GenAI SDK |
| Altyapı | Docker, Google Cloud Run |

## Proje Yapısı

```
gemini_challenge/
├── packages/
│   ├── frontend/          # React + Vite (SPA)
│   │   ├── src/
│   │   │   ├── pages/     # Landing, Login, Register, Dashboard, Session, Results
│   │   │   ├── context/   # AuthContext
│   │   │   └── lib/       # API client (axios)
│   │   └── ...
│   └── backend/           # Node.js + Express
│       ├── src/
│       │   ├── routes/    # auth, sessions, tests
│       │   ├── services/  # gemini, scoring/
│       │   ├── middleware/ # auth (JWT)
│       │   └── lib/       # prisma client
│       └── prisma/        # schema, migrations, seed
├── docker-compose.yml
├── docs/
│   └── history/           # Revize geçmişi
└── README.md
```

## Hızlı Başlangıç

### Ön Gereksinimler
- Node.js 20+
- Docker & Docker Compose
- Google Gemini API Key

### 1. Ortam Değişkenlerini Ayarla

```bash
cd packages/backend
cp .env.example .env
# .env dosyasında GOOGLE_API_KEY ve JWT_SECRET'ı düzenle
```

### 2. Docker ile Çalıştır

```bash
docker-compose up -d
```

### 3. Geliştirme Modu (Docker'sız)

```bash
# Root dizinden
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001
- **API Health:** http://localhost:3001/api/health

### Demo Hesap
- **E-posta:** demo@nora.ai
- **Şifre:** demo123

## Bilişsel Testler

| # | Test | Açıklama | Skor |
|---|------|----------|------|
| 1 | Sözel Akıcılık | 60 sn'de belirli harfle kelime sayma | /25 |
| 2 | Hikaye Hatırlama | Anlatılan hikayeyi tekrarlama | /25 |
| 3 | Görsel Tanıma | 3 görsel tanımlama | /25 |
| 4 | Yönelim | 7 zaman/mekan sorusu | /25 |
| | **Toplam** | | **/100** |

## Mimari Kararlar

- **LLM hesaplama yapmaz:** Tüm skorlamalar backend'de deterministik algoritmalarla yapılır.
- **Tool Calling:** Gemini ajanı, veri topladıktan sonra function calling ile backend endpoint'lerine gönderir.
- **Güvenlik:** JWT auth, rate limiting, helmet, input validation, bcrypt password hashing.

## Lisans

Bu proje Gemini Hackathon 2025 yarışması için geliştirilmiştir.
