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

| Metot  | Endpoint                   | Açıklama                  |
| ------ | -------------------------- | ------------------------- |
| GET    | `/`                        | API bilgisi               |
| GET    | `/health`                  | Sistem sağlık kontrolü    |
| POST   | `/api/v1/auth/register`    | Yeni kullanıcı kaydı      |
| POST   | `/api/v1/auth/login`       | Kullanıcı girişi (JWT)    |
| GET    | `/api/v1/auth/me`          | Mevcut kullanıcı bilgisi  |
| PUT    | `/api/v1/auth/me`          | Profil güncelleme         |
| PUT    | `/api/v1/auth/me/password` | Şifre değiştirme          |

## 🎨 Marka

- **Renk Paleti:** Teal (`#0fb8a5`), Navy (`#1d3b4f`), Açık Gri (`#F4F6F8`), Beyaz (`#FFFFFF`)
- **Tipografi:** Poppins
- **Marka:** BaysalCare

## 📋 Yapılacaklar (Roadmap)

### Faz 1 — Temel Altyapı ✅
- [x] Proje iskelet yapısının oluşturulması
- [x] Docker + Docker Compose kurulumu
- [x] FastAPI backend temel yapısı
- [x] PostgreSQL veritabanı entegrasyonu
- [x] JWT kimlik doğrulama (kayıt / giriş / me)
- [x] React + Vite + Tailwind CSS frontend kurulumu
- [x] Zustand state yönetimi altyapısı
- [x] Landing page (tanıtım sayfası)
- [x] API proxy ve CORS yapılandırması

### Faz 2 — Kullanıcı Yönetimi & Dashboard ✅
- [x] Kayıt ve giriş sayfaları (frontend)
- [x] Kullanıcı profil sayfası ve düzenleme
- [x] Dashboard ana ekran tasarımı
- [x] Şifre sıfırlama / değiştirme
- [x] Premium / Free kullanıcı ayrımı (backend)
- [x] Alembic veritabanı migration yapısı

### Faz 3 — Günlük Sağlık Takibi
- [ ] Semptom kayıt modülü (CRUD)
- [ ] İlaç kayıt ve takip modülü
- [ ] Uyku düzeni kaydı
- [ ] Beslenme notu kaydı
- [ ] Günlük sağlık özeti görünümü
- [ ] Takvim bazlı geçmiş görüntüleme

### Faz 4 — Tıbbi Belge Yönetimi
- [ ] PDF / fotoğraf yükleme altyapısı
- [ ] Belge arşivleme ve listeleme
- [ ] Belge kategorilendirme (tahlil, MR, reçete, epikriz vb.)
- [ ] Belge önizleme ve detay görünümü
- [ ] Free paket: aylık 3 belge sınırı kontrolü

### Faz 5 — Yapay Zeka Entegrasyonu
- [ ] AI belge analizi (tahlil sonuçlarını Türkçe açıklama)
- [ ] Semptom-tahlil çapraz analiz
- [ ] Haftalık / aylık sağlık raporu oluşturma
- [ ] Free paket: günlük 1 AI analiz sınırı kontrolü
- [ ] Kritik değer tespiti ve acil uyarı sistemi

### Faz 6 — İlaç Hatırlatma & Etkileşim
- [ ] İlaç hatırlatma bildirimleri
- [ ] Free paket: 3 ilaç sınırı kontrolü
- [ ] İlaç etkileşim kontrolü (Premium)
- [ ] Reçete çapraz kontrol sistemi

### Faz 7 — Sesli Asistan
- [ ] Sesli giriş (speech-to-text) entegrasyonu
- [ ] Türkçe sesli kayıt ile semptom/ilaç girişi
- [ ] Free paket: günlük 3 sesli giriş sınırı
- [ ] Sınırsız sesli asistan (Premium)

### Faz 8 — Doktora Hazırlan Modu (Premium)
- [ ] Son 30 günlük veri özeti oluşturma
- [ ] Türkçe PDF raporu otomatik üretimi
- [ ] "Doktoruna şunları sor" listesi hazırlama
- [ ] PDF indirme ve paylaşma

### Faz 9 — Aile & Sosyal Özellikler (Premium)
- [ ] Aile üyesi ekleme ve yönetimi
- [ ] Yaşlı yakını sağlık takibi (uzaktan erişim)
- [ ] Aile üyesi belge ve kayıt görüntüleme

### Faz 10 — Ödeme & Premium Sistem
- [ ] Premium abonelik sayfası
- [ ] Ödeme sistemi entegrasyonu
- [ ] Aylık (₺119) ve yıllık (₺1.100) plan yönetimi
- [ ] Reklam gösterim altyapısı (Free kullanıcılar)
- [ ] Reklamsız deneyim (Premium)

### Faz 11 — Mobil Uygulama
- [ ] React Native proje kurulumu
- [ ] Kamera ile belge fotoğraflama
- [ ] Push notification (ilaç hatırlatma)
- [ ] Google Play Store yayını (Android)

### Faz 12 — Test & Yayın
- [ ] Backend unit testleri
- [ ] Frontend component testleri
- [ ] E2E (uçtan uca) testler
- [ ] Performans optimizasyonu
- [ ] Production Docker yapılandırması
- [ ] CI/CD pipeline kurulumu

## 📄 Lisans

Bu proje Ömer Faruk Baysal tarafından geliştirilmektedir.
