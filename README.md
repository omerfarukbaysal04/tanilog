<div align="center">

# 🩺 TanıLog

**Sağlığını anla, hayatını yönet.**

Türkçe konuşan, yapay zeka destekli kişisel sağlık günlüğü ve tıbbi belge analiz platformu.

[![Live Demo](https://img.shields.io/badge/demo-tanilog.vercel.app-0fb8a5?style=flat-square)](https://tanilog.vercel.app)
![Backend](https://img.shields.io/badge/backend-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Frontend](https://img.shields.io/badge/frontend-React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Database](https://img.shields.io/badge/db-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/devops-Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

</div>


## 🎯 Proje Hakkında

**TanıLog**, kişisel sağlık günlüğü tutmayı yapay zeka destekli tıbbi belge analiziyle birleştiren, tamamen Türkçe bir sağlık platformudur. Kullanıcılar günlük sağlık durumlarını kaydeder, lab sonuçlarını, MR raporlarını ve reçetelerini yükler; TanıLog bu verileri anlaşılır bir dile çevirerek hem kullanıcıya hem de doktoruna değer üretir.

> 🌐 Canlı: **[tanilog.vercel.app](https://tanilog.vercel.app)**

---

## 💡 Çözülen Problem

Türkiye'de hastalar genellikle:

- Lab sonuçlarındaki değerlerin ne anlama geldiğini **anlayamıyor**,
- Doktor randevularına dağınık, eksik bilgiyle gidiyor ve **kısıtlı muayene süresini** verimsiz kullanıyor,
- Aldıkları ilaçların **birbiriyle etkileşimini** takip edemiyor,
- Yurt dışı kaynaklı sağlık uygulamaları **Türkçe desteklemediği** için bunları kullanmakta zorlanıyor.

TanıLog bu boşluğu, **Türkçe arayüz, Türkçe sesli asistan ve doktora hazırlık** odaklı bir deneyimle doldurur.

---

## ✨ Öne Çıkan Özellikler

| Özellik | Açıklama |
| ------- | -------- |
| 📝 **Günlük Sağlık Günlüğü** | Belirtiler, ruh hali, uyku, ağrı gibi günlük verilerin kaydı |
| 🤖 **Yapay Zeka Belge Analizi** | PDF / fotoğraf olarak yüklenen lab sonucu, MR raporu, reçetenin sade Türkçe özeti |
| 🎙️ **Türkçe Sesli Asistan** | Sesli komutla günlük giriş ve sorgu |
| 🩺 **"Doktora Hazırlan" Modu** | Son 30 günün verilerinden doktor ziyareti için derli toplu **PDF özet** oluşturma |
| 💊 **İlaç Etkileşim Kontrolü** | Kullanılan ilaçlar arası etkileşim ve kritik değer uyarıları |
| 👨‍👩‍👧 **Aile Takibi** | Aile üyelerinin sağlık kayıtlarını tek hesaptan yönetme |
| 🔔 **İlaç Hatırlatıcıları** | Zamanında ilaç alımı için hatırlatmalar |

> ⚠️ TanıLog bir teşhis aracı değildir; tıbbi tavsiye yerine geçmez. Amaç kullanıcının kendi sağlık verisini düzenlemesine ve doktoruyla daha verimli iletişim kurmasına yardımcı olmaktır.

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
| ------ | --------- |
| **Backend** | Python · FastAPI · SQLAlchemy |
| **Veritabanı** | PostgreSQL |
| **API Mimarisi** | REST |
| **Kimlik Doğrulama** | JWT (python-jose, passlib) |
| **Frontend (Web)** | React · Vite · Tailwind CSS · Zustand |
| **Mobil** | React Native (cross-platform, Android öncelikli) |
| **Yapay Zeka** | Gemini entegrasyonu |
| **DevOps** | Docker · Docker Compose · Alembic |

---


## 🏗️ Mimari

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Web (React) │     │ Mobil (RN)   │     │   Tarayıcı   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │  REST / JWT
                  ┌─────────▼──────────┐
                  │  FastAPI Backend   │
                  │  (routers/services)│
                  └────┬──────────┬────┘
                       │          │
              ┌────────▼───┐  ┌───▼─────────┐
              │ PostgreSQL │  │ Gemini AI   │
              │            │  │ (belge      │
              │            │  │  analizi)   │
              └────────────┘  └─────────────┘
```

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- [Docker](https://www.docker.com/get-started) ve Docker Compose
- [Git](https://git-scm.com/)

### Kurulum ve Çalıştırma

```bash
git clone https://github.com/omerfarukbaysal04/tanilog.git
cd tanilog
cp .env.example .env
docker compose up --build
```

Uygulama çalıştıktan sonra:

| Servis | URL |
| ------ | --- |
| Frontend Web | <http://localhost:3000> |
| Backend API | <http://localhost:8000> |
| API Docs (Swagger) | <http://localhost:8000/docs> |
| ReDoc | <http://localhost:8000/redoc> |

---

## 🧪 Test ve Doğrulama

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python tests/smoke_api.py
docker compose exec frontend npm run build
docker compose exec frontend npm run test
docker compose exec -e TANILOG_API_URL=http://localhost:8000/api/v1 \
  -e TANILOG_WEB_URL=http://frontend:3000 \
  backend python scripts/e2e_smoke.py
```

`scripts/e2e_smoke.py`, çalışan Docker servisleri üzerinden uçtan uca kayıt, giriş, ayarlar, dashboard ve yasal sayfa kontrollerini gerçekleştirir.

---

## 📁 Proje Yapısı

```
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
├── mobile/                     # React Native mobil uygulama
├── scripts/                    # Yardımcı scriptler (e2e_smoke vb.)
├── docker-compose.yml
├── .env.example
├── proje.md                    # Ürün geliştirme / fikir onay dokümanı
├── tanilog.html                # Tek dosyalık tanıtım sayfası
└── README.md
```

---


## 📄 Lisans

Bu proje **Ömer Faruk Baysal** tarafından geliştirilmiştir.
Bu proje, üniversite dersi kapsamında yapay zeka araçları kullanılarak geliştirilmiştir.

<div align="center">

---


</div>
