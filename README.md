# TanıLog

**Sağlığını anla, hayatını yönet.**

TanıLog, kişisel sağlık günlüğü tutmayı tıbbi belge analiziyle birleştiren, yapay zeka destekli bir sağlık platformudur.

## Hızlı Başlangıç

### Gereksinimler

- [Docker](https://www.docker.com/get-started) ve Docker Compose
- [Git](https://git-scm.com/)

### Kurulum ve Çalıştırma

```bash
git clone https://github.com/kullanici/tanilog.git
cd tanilog
cp .env.example .env
docker compose up --build
```

Uygulama çalıştıktan sonra:

| Servis       | URL                         |
| ------------ | --------------------------- |
| Frontend Web | http://localhost:3000       |
| Backend API  | http://localhost:8000       |
| API Docs     | http://localhost:8000/docs  |
| ReDoc        | http://localhost:8000/redoc |

### Test ve Doğrulama

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python tests/smoke_api.py
docker compose exec frontend npm run build
docker compose exec frontend npm run test
docker compose exec -e TANILOG_API_URL=http://localhost:8000/api/v1 -e TANILOG_WEB_URL=http://frontend:3000 backend python scripts/e2e_smoke.py
```

`scripts/e2e_smoke.py` komutu çalışan Docker servisleri üzerinden uçtan uca temel kayıt, giriş, ayarlar, dashboard ve yasal sayfa kontrollerini yapar.

## Proje Yapısı

```text
tanilog/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── models/             # SQLAlchemy modelleri
│   │   ├── routers/            # API endpointleri
│   │   ├── schemas/            # Pydantic şemaları
│   │   ├── services/           # AI ve yardımcı servisler
│   │   ├── config.py           # Yapılandırma ayarları
│   │   ├── database.py         # Veritabanı bağlantısı
│   │   └── main.py             # Uygulama giriş noktası
│   ├── alembic/                # Veritabanı migration dosyaları
│   ├── uploads/                # Yüklenen dosyalar
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/         # Ortak bileşenler
│   │   ├── pages/              # Sayfa bileşenleri
│   │   ├── stores/             # Zustand state yönetimi
│   │   ├── lib/                # API yardımcıları
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docker-compose.yml
├── .env.example
├── proje.md
├── tanilog.html
└── README.md
```

## Teknoloji Yığını

| Katman     | Teknoloji                          |
| ---------- | ---------------------------------- |
| Backend    | Python, FastAPI, SQLAlchemy        |
| Frontend   | React, Vite, Tailwind CSS, Zustand |
| Veritabanı | PostgreSQL                         |
| Auth       | JWT, python-jose, passlib          |
| AI         | Gemini entegrasyonu                |
| DevOps     | Docker, Docker Compose, Alembic    |


## Lisans

Bu proje Ömer Faruk Baysal tarafından geliştirilmektedir.
