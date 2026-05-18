import { Link, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiShield } from 'react-icons/fi';
import AnimatedHeroBackground from '../components/ui/AnimatedHeroBackground';

const pages = {
  '/privacy': {
    title: 'Gizlilik Politikası',
    subtitle: 'TanıLog verilerini nasıl koruduğumuzu anlatan kısa metin.',
    sections: [
      ['Toplanan veriler', 'Hesap bilgileri, sağlık kayıtları, yüklenen belgeler, AI analiz çıktıları, bildirim tercihleri ve abonelik durumu hizmeti sunmak için işlenir.'],
      ['Kullanım amacı', 'Veriler; sağlık takibi, AI destekli analiz, aile takibi, doktor raporu ve bildirim özellikleri için kullanılır.'],
      ['Saklama', 'Veriler hesap aktif olduğu sürece saklanır. Kullanıcı ayarlar sayfasından verilerini dışa aktarabilir veya hesabını silebilir.'],
      ['Paylaşım', 'Veriler kullanıcının açık izni olmadan üçüncü kişilerle paylaşılmaz. AI servisleri yalnızca izin verilen bağlamları kullanır.'],
    ],
  },
  '/terms': {
    title: 'Kullanım Şartları',
    subtitle: 'TanıLog bir tıbbi tanı aracı değil, kişisel takip ve hazırlık platformudur.',
    sections: [
      ['Tıbbi sorumluluk', 'TanıLog çıktısı doktor görüşünün yerine geçmez. Acil veya ciddi belirtilerde sağlık kuruluşuna başvurulmalıdır.'],
      ['Kullanıcı sorumluluğu', 'Girilen verilerin doğruluğu kullanıcı sorumluluğundadır. İlaç ve tedavi kararlarını yalnızca hekim yönlendirmesiyle verin.'],
      ['Premium özellikler', 'Premium özellikler abonelik koşullarına bağlıdır. Test ortamındaki ödeme akışları gerçek tahsilat yapmaz.'],
      ['Hesap güvenliği', 'Hesap bilgilerini korumak ve yetkisiz erişimi bildirmek kullanıcının sorumluluğundadır.'],
    ],
  },
  '/kvkk': {
    title: 'KVKK Aydınlatma Metni',
    subtitle: 'Kişisel ve sağlık verilerinin işlenmesine dair özet bilgilendirme.',
    sections: [
      ['Veri sorumlusu', 'TanıLog, kullanıcı tarafından girilen verileri hizmetin sunulması ve geliştirilmesi amacıyla işler.'],
      ['Özel nitelikli veri', 'Sağlık verileri özel nitelikli kişisel veridir. Uygulama içinde AI bağlam izinleri ayrı ayrı yönetilebilir.'],
      ['Haklarınız', 'Verilerinize erişim, düzeltme, dışa aktarma ve hesap silme haklarınızı Ayarlar sayfasından kullanabilirsiniz.'],
      ['Güvenlik', 'Veriler kimlik doğrulama, yetki kontrolleri ve kullanıcı bazlı erişim kurallarıyla korunur.'],
    ],
  },
};

function LegalPage() {
  const location = useLocation();
  const page = pages[location.pathname] || pages['/privacy'];

  return (
    <div className="min-h-screen bg-navy-900 text-white font-poppins relative overflow-hidden">
      <AnimatedHeroBackground />
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-navy-300 hover:text-white mb-8">
          <FiArrowLeft /> Ana sayfaya dön
        </Link>
        <section className="glass rounded-3xl border border-navy-700/60 p-8 md:p-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl border border-teal-500/30 bg-teal-500/10 text-teal-300 mb-5">
            <FiShield size={22} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">{page.title}</h1>
          <p className="text-navy-300 mt-3">{page.subtitle}</p>
          <div className="mt-8 space-y-5">
            {page.sections.map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-navy-700 bg-navy-900/35 p-5">
                <h2 className="font-bold text-teal-200">{title}</h2>
                <p className="text-navy-200 mt-2 leading-relaxed">{body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default LegalPage;
