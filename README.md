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

### Yayın ve Mobil Öncesi Notlar

Web ve mobil uygulama aynı backend API'sini kullanacak şekilde tasarlanmalıdır. Canlı veya sınıf dışı demo ortamında önerilen yapı:

```text
Web:     https://app.example.com
Backend: https://api.example.com/api/v1
```

Production ortamında dikkat edilmesi gerekenler:

- `TANILOG_DEBUG=false` kullanılmalı.
- `SECRET_KEY` güçlü ve en az 32 karakter olmalı.
- `ALLOWED_ORIGINS` sadece gerçek web domainini içermeli.
- `PUBLIC_WEB_URL` web uygulamasının public adresi olmalı.
- `VITE_API_URL` frontend build sırasında public backend API adresine ayarlanmalı.
- Yüklenen belgeler public `/uploads` üzerinden değil, kimlik doğrulamalı `/api/v1/documents/{id}/file` endpoint'i üzerinden servis edilir.

Ücretsiz VPS hedefi için en güçlü aday Oracle Cloud Always Free'dir. Coolify yazılımı self-hosted kullanımda ücretsizdir; maliyet genelde Coolify'dan değil, seçilen VPS sağlayıcısından gelir.

### Mobil Uygulama

Mobil MVP Expo + TypeScript ile `mobile/` klasöründedir. Demo ortamında backend erişimi için Cloudflare Tunnel adresini mobil env dosyasına yazın:

```bash
cd mobile
cp .env.example .env
# .env içindeki EXPO_PUBLIC_API_URL değerini güncelle:
# EXPO_PUBLIC_API_URL=https://your-cloudflare-tunnel.trycloudflare.com/api/v1
npm install
npm run start
```

Android emülatörde lokal backend kullanmak için alternatif API adresi:

```text
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1
```

Mobil MVP kapsamı: giriş/kayıt, dashboard özeti, günlük sağlık kayıtları, belge kamera/dosya yükleme ve analiz, sesli kayıtla AI ayrıştırma, AI chat.

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

## Önemli API Endpointleri

| Metot      | Endpoint                    | Açıklama                        |
| ---------- | --------------------------- | ------------------------------- |
| GET        | `/`                         | API bilgisi                     |
| GET        | `/health`                   | Sistem sağlık kontrolü          |
| POST       | `/api/v1/auth/register`     | Yeni kullanıcı kaydı            |
| POST       | `/api/v1/auth/login`        | Kullanıcı girişi                |
| GET        | `/api/v1/auth/me`           | Mevcut kullanıcı bilgisi        |
| GET        | `/api/v1/dashboard/summary` | Dashboard özeti                 |
| GET        | `/api/v1/dashboard/search`  | Sağlık verilerinde global arama |
| GET        | `/api/v1/search`            | Gelişmiş arama ve filtreleme    |
| GET        | `/api/v1/timeline`          | Sağlık zaman çizelgesi          |
| GET / POST | `/api/v1/risk-alerts/*`     | Açıklanabilir risk uyarıları    |
| GET / POST | `/api/v1/onboarding/*`      | İlk kurulum adımları            |
| GET / POST | `/api/v1/push/*`            | Opsiyonel Web Push altyapısı    |
| GET / POST | `/api/v1/notifications/*`   | Bildirim merkezi olayları       |
| GET / PUT  | `/api/v1/settings`          | Kullanıcı ayarları              |
| GET / POST | `/api/v1/health/*`          | Sağlık takip kayıtları          |
| GET / POST | `/api/v1/documents/*`       | Belge yönetimi                  |
| POST       | `/api/v1/ai/*`              | AI analizleri                   |
| GET / POST | `/api/v1/chat/*`            | Premium AI asistan              |
| GET / POST | `/api/v1/family/*`          | Aile takibi                     |
| GET / POST | `/api/v1/billing/*`         | Premium ve ödeme yönetimi       |

## Marka

- Renk paleti: Teal (`#0fb8a5`), Navy (`#1d3b4f`), açık gri (`#F4F6F8`), beyaz (`#FFFFFF`)
- Tipografi: Poppins
- Marka: BaysalCare

## Roadmap

### Faz 1 - Temel Altyapı

- [x] Proje iskelet yapısının oluşturulması
- [x] Docker + Docker Compose kurulumu
- [x] FastAPI backend temel yapısı
- [x] PostgreSQL veritabanı entegrasyonu
- [x] JWT kimlik doğrulama
- [x] React + Vite + Tailwind CSS frontend kurulumu
- [x] Zustand state yönetimi altyapısı
- [x] Landing page
- [x] API proxy ve CORS yapılandırması

### Faz 2 - Kullanıcı Yönetimi & Dashboard

- [x] Kayıt ve giriş sayfaları
- [x] Kullanıcı profil sayfası ve düzenleme
- [x] Dashboard ana ekran tasarımı
- [x] Dashboard gerçek veri özeti ve son aktiviteler
- [x] Hızlı eylemler
- [x] Şifre değiştirme
- [x] Premium / Free kullanıcı ayrımı
- [x] Alembic migration yapısı

### Faz 3 - Günlük Sağlık Takibi

- [x] Semptom kayıt modülü
- [x] İlaç kayıt ve takip modülü
- [x] Uyku düzeni kaydı
- [x] Beslenme notu kaydı
- [x] Günlük sağlık özeti görünümü
- [x] Takvim bazlı geçmiş görüntüleme

### Faz 4 - Tıbbi Belge Yönetimi

- [x] PDF / fotoğraf yükleme altyapısı
- [x] Belge arşivleme ve listeleme
- [x] Belge kategorilendirme
- [x] Belge önizleme ve detay görünümü
- [x] Free paket için aylık belge limiti

### Faz 5 - Yapay Zeka Entegrasyonu

- [x] AI belge analizi
- [x] Semptom-tahlil çapraz analiz
- [x] Haftalık / aylık sağlık raporu oluşturma
- [x] Kritik değer tespiti ve acil uyarı sistemi
- [ ] Free paket için günlük AI analiz limiti aktif etme

### Faz 6 - İlaç Hatırlatma & Etkileşim

- [x] İlaç hatırlatma bildirimleri
- [x] Bildirim izni ve test bildirimi paneli
- [x] Free paket için günlük ilaç kaydı limiti
- [x] İlaç etkileşim kontrolü
- [x] Reçete çapraz kontrol sistemi
- [x] Reçete / ilaç kutusu görselinden AI ile ilaç adayı çıkarma
- [x] AI tarama sonucunu kullanıcı onayıyla ilaç formuna aktarma

### Faz 7 - Sesli Asistan

- [x] Speech-to-text entegrasyonu
- [x] Türkçe sesli kayıt ile semptom ve ilaç girişi
- [x] Türkçe sesli kayıt ile uyku ve beslenme girişi
- [x] Sağlık Takibi sekmelerinden hızlı sesli kayıt modalı
- [x] Free paket için günlük sesli giriş limiti
- [x] Premium için sınırsız sesli asistan
- [x] AI ayrıştırma ve kullanıcı onaylı kayıt akışı

### Faz 8 - Doktora Hazırlan Modu

- [x] Son 30 günlük veri özeti oluşturma
- [x] Türkçe doktor raporu üretimi
- [x] "Doktoruna şunları sor" listesi hazırlama
- [x] PDF önizleme / yazdırma akışı
- [x] Premium erişim kontrolü
- [x] Doktor raporlarını kaydetme, listeleme ve yeniden açma
- [x] Raporu sesli özetleme

### Faz 9 - Aile & Sosyal Özellikler

- [x] Aile üyesi ekleme ve yönetimi
- [x] Yaşlı yakını sağlık takibi
- [x] Aile üyesi belge ve kayıt görüntüleme
- [x] Premium erişim kontrolü
- [x] E-posta ile aile daveti oluşturma ve kabul etme
- [x] Gerçek TanıLog kullanıcısını izinli takip etme
- [x] Belge görüntüleme, kayıt ekleme ve düzenleme izin seviyeleri
- [x] Davet edilen manuel aile profilini gerçek kullanıcı hesabına bağlama

### Faz 10 - Premium AI Chatbot & Sağlık Asistanı

- [x] Sağlık kayıtlarını bağlam olarak okuyabilen AI sohbet ekranı
- [x] Belge analizleri, doktor raporları ve günlük kayıtlar üzerinden soru-cevap
- [x] Chat içinde kayıt önerme ve kullanıcı onayıyla kaydetme
- [x] Acil durum ve tıbbi sorumluluk güvenlik kuralları
- [x] Premium erişim kontrolü
- [x] Sesli asistan ile chatbot akışını birleştirme
- [x] Sohbet geçmişi
- [x] Sohbet adını değiştirme ve sohbet silme
- [x] Sağ alt hızlı AI asistan widgetı
- [x] Chat içinde PDF, metin ve görsel yükleyerek AI ile yorumlatma

### Faz 11 - Ödeme & Premium Sistem

- [x] Premium abonelik sayfası (`/billing`)
- [x] Test edilebilir mock ödeme sistemi
- [x] Aylık ve yıllık plan yönetimi
- [x] Abonelik işlem geçmişi ve iptal akışı
- [x] Reklam gösterim altyapısı
- [x] Reklamsız Premium deneyim
- [ ] Gerçek ödeme sağlayıcısı entegrasyonu

### Ara Faz I- Ayarlar & Sağlık Profili

- [x] `/settings` sayfası ve sidebar erişimi
- [x] Bildirim tercihleri ve sessiz saatler
- [x] AI veri kullanım izinleri
- [x] Sağlık profili
- [x] Acil iletişim bilgileri
- [x] Premium, güvenlik ve veri aksiyonu kısayolları
- [x] AI bağlamını kullanıcı izinlerine göre filtreleme
- [x] Verilerimi dışa aktar özelliği
- [x] Şifre ve onay metniyle hesap silme akışı

### Ara Faz II - Mobil Öncesi Son Ayarlar

- [x] Dashboard hızlı eylemler, son aktiviteler, günlük özet ve haftalık trend
- [x] Header içinde global sağlık verisi araması
- [x] Dashboard veri kalitesi uyarıları ve eksik kayıt yönlendirmeleri
- [x] Bildirim merkezi ve tarayıcı içi bildirim deneyimi
- [x] Şifreli, 24 saat geçerli doktor raporu paylaşım linki
- [x] Header aramasıyla birleşik gelişmiş arama ve filtreler
- [x] Sağlık zaman çizelgesi
- [x] Açıklanabilir riskli örüntü uyarıları
- [x] İlk giriş onboarding akışı
- [x] İlaç veri kalitesi uyarıları
- [x] Branşa göre doktor raporu şablonu seçimi
- [x] Aile takip izin matrisi ve rapor oluşturma izni
- [x] Admin audit log
- [x] Hata yakalama ekranı ve backend request loglama
- [x] Admin paneli: kullanıcı listesi, sistem özeti, premium/admin yönetimi
- [x] KVKK / gizlilik / kullanım şartları sayfaları
- [x] Kayıt ekranında yasal metin onayı
- [x] Hesap silme ve veri dışa aktarma
- [x] Dosya depolama dizinini `UPLOAD_DIR` ayarına bağlama
- [x] Bildirim merkezini kullanıcı ayarları ve sessiz saatlerle bağlama
- [ ] Gerçek e-posta gönderimi: şimdilik kapsam dışı bırakıldı
- [x] Geniş test paketi: backend, frontend ve E2E smoke kontrolleri
- [x] Production ortam değişkenleri ve güvenlik kontrolü
- [x] Performans ve bundle optimizasyonu

### Faz 12 - Mobil Uygulama

#### Altyapı & Kimlik Doğrulama
- [x] Expo + React Native + TypeScript proje kurulumu
- [x] Expo Router dosya tabanlı navigasyon
- [x] Zustand state yönetimi altyapısı
- [x] Axios API istemcisi ve JWT interceptor
- [x] Secure token saklama (Expo SecureStore)
- [x] Giriş ve kayıt ekranları
- [x] Yasal metin / sorumluluk reddi ekranı
- [x] Otomatik auth yönlendirme (splash → login / tabs)

#### Ana Ekranlar (Tab Navigasyon)
- [x] Dashboard — metrik grid, son aktiviteler, veri kalitesi
- [x] Sağlık Takibi — semptom, ilaç, uyku, beslenme sekmeleri
- [x] Belgeler — kamera/dosya yükleme, önizleme, AI analiz
- [x] Sesli Asistan — ses kaydı, transkripsiyon, AI ayrıştırma
- [x] AI Chat — oturum yönetimi, mesajlaşma

#### Kullanıcı Hesap Yönetimi
- [x] Profil ekranı — ad düzenleme, avatar, üyelik bilgisi
- [x] Şifre değiştirme
- [x] Ayarlar ekranı — bildirim toggle'ları, AI izinleri
- [x] Sağlık profili — doğum yılı, boy, kilo, kan grubu, kronik hastalık, alerji
- [x] Acil iletişim bilgileri
- [x] Veri dışa aktarma (Share sheet)
- [x] Hesap silme (şifre + onay metni ile)

#### Dashboard Geliştirmeleri
- [x] Risk uyarı kartları (inline, kapat butonu)
- [x] Bildirim zili ve okunmamış badge
- [x] Avatar butonu → profil ekranı yönlendirmesi

#### Bildirimler
- [x] Bildirim merkezi ekranı
- [x] Okunmamış / okunmuş görsel ayrımı
- [x] Tümünü okundu işaretle
- [x] Expo Notifications izin isteği (uygulama açılışında)
- [x] İlaç hatırlatma — günlük yerel bildirim, health.tsx'ten toggle ile kurulum

#### Araçlar Tab'ı (6. Tab)
- [x] Araçlar hub ekranı (kart listesi)
- [x] Zaman çizelgesi — 7/30/90 gün, tarih gruplu liste
- [x] Gelişmiş arama — metin + kategori filtresi, riskli sonuç işareti
- [x] AI Analiz — belge çapraz analizi, haftalık/aylık sağlık raporu
- [x] Doktora Hazırlan — branş seçimi, rapor oluşturma, kaydetme, paylaşma
- [x] Premium gate (Doktora Hazırlan)

#### Premium & Ödeme
- [x] Abonelik / plan görüntüleme ekranı
- [x] Mevcut plan ve bitiş tarihi gösterimi
- [x] Mock ödeme akışı (demo — gerçek ücret alınmaz)
- [x] Abonelik iptal ve işlem geçmişi

#### Aile Takibi (Premium)
- [x] Aile üyeleri listeleme (Premium gate ile)
- [x] Manuel aile üyesi ekleme
- [x] Aile üyesi detay ve sağlık kayıtları (semptom / ilaç / uyku / beslenme / not / randevu)
- [x] E-posta ile davet gönderme (izin seçimiyle)
- [x] Gönderilen davet iptal
- [x] Bana erişim verenleri görme ve erişimi kaldırma

#### Yayın Hazırlığı
- [ ] Android APK / AAB build süreci
- [ ] iOS build süreci (Expo EAS Build)
- [ ] App icon ve splash screen tasarımı
- [ ] Google Play Store yayın hazırlığı
- [ ] Apple App Store yayın hazırlığı
- [ ] Uygulama içi hata izleme (Sentry veya benzeri)

### Faz 13 - Test & Yayın

- [ ] Backend unit testleri
- [ ] Frontend component testleri
- [ ] E2E testler
- [ ] Performans optimizasyonu
- [ ] Production Docker yapılandırması
- [ ] CI/CD pipeline kurulumu

## Veritabanını Görüntüleme

PostgreSQL Docker volume içinde tutulur. pgAdmin veya DBeaver ile şu bilgilerle bağlanabilirsin:

```text
Host: localhost
Port: 5432
Database: .env içindeki POSTGRES_DB
Username: .env içindeki POSTGRES_USER
Password: .env içindeki POSTGRES_PASSWORD
```

Örnek tablolar:

- `users`
- `symptom_logs`
- `medication_logs`
- `sleep_logs`
- `nutrition_logs`
- `documents`
- `ai_analyses`
- `doctor_prep_reports`
- `chat_sessions`
- `chat_messages`
- `family_members`
- `family_invitations`
- `subscription_events`
- `push_subscriptions`
- `notification_events`
- `doctor_share_links`
- `risk_alerts`
- `onboarding_states`
- `admin_audit_logs`

## Lisans

Bu proje Ömer Faruk Baysal tarafından geliştirilmektedir.
