# 🩺 TanıLog

**Sağlığını anla, hayatını yönet.**

TanıLog, kişisel sağlık günlüğü tutmayı tıbbi belge analiziyle birleştiren, yapay zeka destekli bir sağlık platformudur.

## 🚀 Hızlı Başlangıç

### Gereksinimler

- [Docker](https://www.docker.com/get-started) ve Docker Compose
- [Git](https://git-scm.com/)

### Kurulum ve Çalıştırma

```bash
git clone https://github.com/kullanici/tanilog.git
cd tanilog
cp .env.example .env
docker-compose up --build
```

Uygulama çalıştıktan sonra:

| Servis             | URL                          |
| ------------------ | ---------------------------- |
| **Frontend (Web)** | http://localhost:3000         |
| **Backend API**    | http://localhost:8000         |
| **API Docs**       | http://localhost:8000/docs    |
| **ReDoc**          | http://localhost:8000/redoc   |

## 🏗️ Proje Yapısı

```
tanilog/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── models/             # SQLAlchemy modelleri
│   │   ├── routers/            # API endpoint'leri
│   │   ├── schemas/            # Pydantic şemaları
│   │   ├── config.py           # Yapılandırma ayarları
│   │   ├── database.py         # Veritabanı bağlantısı
│   │   └── main.py             # Uygulama giriş noktası
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── pages/              # Sayfa bileşenleri
│   │   ├── stores/             # Zustand state yönetimi
│   │   ├── lib/                # Yardımcı modüller
│   │   ├── App.jsx             # Ana uygulama bileşeni
│   │   ├── main.jsx            # React giriş noktası
│   │   └── index.css           # Global stiller
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docker-compose.yml          # Docker Compose yapılandırması
├── .env.example                # Ortam değişkenleri şablonu
├── .gitignore
├── proje.md                    # Ürün geliştirme dokümanı
└── README.md
```

## 🛠️ Teknoloji Yığını

| Katman       | Teknoloji                     |
| ------------ | ----------------------------- |
| **Backend**  | Python, FastAPI, SQLAlchemy   |
| **Frontend** | React, Tailwind CSS, Zustand  |
| **Veritabanı** | PostgreSQL                 |
| **Auth**     | JWT (python-jose + passlib)   |
| **DevOps**   | Docker, Docker Compose, Git   |

## 📦 API Endpoint'leri

| Metot  | Endpoint              | Açıklama                  |
| ------ | --------------------- | ------------------------- |
| GET    | `/`                   | API bilgisi               |
| GET    | `/health`             | Sistem sağlık kontrolü    |
| POST   | `/api/v1/auth/register` | Yeni kullanıcı kaydı    |
| POST   | `/api/v1/auth/login`    | Kullanıcı girişi (JWT)  |
| GET    | `/api/v1/auth/me`       | Mevcut kullanıcı bilgisi |

## 🎨 Marka

- **Renk Paleti:** Teal (`#0fb8a5`), Navy (`#1d3b4f`), Açık Gri (`#F4F6F8`), Beyaz (`#FFFFFF`)
- **Tipografi:** Poppins
- **Marka:** BaysalCare

## 📄 Lisans

Bu proje Ömer Faruk Baysal tarafından geliştirilmektedir.
