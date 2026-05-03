import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiFileText,
  FiMic,
  FiShield,
  FiActivity,
  FiCalendar,
  FiHeart,
} from 'react-icons/fi';
import useAuthStore from '../stores/authStore';

const features = [
  {
    icon: <FiFileText size={28} />,
    title: 'Tıbbi Belge Analizi',
    description: 'Kan tahlili, MR raporu, reçete gibi belgelerinizi yükleyin; AI Türkçe anlatsın.',
  },
  {
    icon: <FiMic size={28} />,
    title: 'Sesli Asistan',
    description: 'Sadece konuşun, biz kaydedelim. Türkçe sesli giriş ile hızlı kayıt.',
  },
  {
    icon: <FiCalendar size={28} />,
    title: 'Doktora Hazırlan',
    description: 'Randevudan önce son 30 günün özetini PDF olarak hazırlayın.',
  },
  {
    icon: <FiShield size={28} />,
    title: 'İlaç Etkileşim Kontrolü',
    description: 'Kullandığınız ilaçların olası etkileşimlerini anında öğrenin.',
  },
  {
    icon: <FiActivity size={28} />,
    title: 'Günlük Sağlık Takibi',
    description: 'Semptom, ilaç, uyku ve beslenme verilerinizi kolayca kaydedin.',
  },
  {
    icon: <FiHeart size={28} />,
    title: 'Acil Durum Tespiti',
    description: 'Kritik tahlil değerleri tespit edildiğinde anında uyarı alın.',
  },
];

function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Giriş yapmış kullanıcıyı dashboard'a yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 font-poppins">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <span className="text-white font-semibold text-xl tracking-tight">
            Tanı<span className="text-teal-500">Log</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-navy-200 text-sm">
          <a href="#features" className="hover:text-teal-400 transition-colors">Özellikler</a>
          <a href="#pricing" className="hover:text-teal-400 transition-colors">Fiyatlandırma</a>
        </div>
        <Link
          to="/login"
          className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25"
        >
          Giriş Yap
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-16 pt-20 pb-32 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 px-4 py-1.5 rounded-full text-sm mb-8">
            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
            Yapay Zeka Destekli Sağlık Asistanı
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            Sağlığını <span className="text-teal-500">Anla</span>,<br />
            Hayatını <span className="text-teal-500">Yönet</span>.
          </h1>
          <p className="text-navy-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Tıbbi belgelerinizi yükleyin, günlük sağlık verilerinizi kaydedin.
            TanıLog yapay zeka ile verilerinizi analiz ederek size anlamlı içgörüler sunar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5"
            >
              Ücretsiz Başla
            </Link>
            <a
              href="#features"
              className="border border-navy-600 hover:border-teal-500/50 text-white px-8 py-3.5 rounded-xl font-medium text-lg transition-all hover:bg-navy-800"
            >
              Nasıl Çalışır?
            </a>
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section id="features" className="px-6 md:px-16 py-20 bg-navy-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Neler <span className="text-teal-500">Yapabilirsiniz?</span>
            </h2>
            <p className="text-navy-300 text-lg max-w-2xl mx-auto">
              TanıLog ile sağlık verilerinizi tek bir platformda toplayın ve yapay zeka ile analiz edin.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-navy-900/60 border border-navy-700/50 rounded-2xl p-6 hover:border-teal-500/30 transition-all hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 mb-4 group-hover:bg-teal-500/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-navy-300 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fiyatlandırma */}
      <section id="pricing" className="px-6 md:px-16 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Basit <span className="text-teal-500">Fiyatlandırma</span>
            </h2>
            <p className="text-navy-300 text-lg">
              Ücretsiz başlayın, ihtiyacınız olduğunda yükseltin.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-navy-800/60 border border-navy-700/50 rounded-2xl p-8">
              <h3 className="text-white font-semibold text-xl mb-2">Ücretsiz</h3>
              <p className="text-navy-400 text-sm mb-6">Sağlık takibine başlamak için</p>
              <div className="text-4xl font-bold text-white mb-8">
                ₺0 <span className="text-navy-400 text-base font-normal">/ ay</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Günlük semptom ve ilaç kaydı',
                  'Ayda 3 belge yükleme',
                  'Günde 1 AI analizi',
                  '3 ilaca kadar hatırlatma',
                  '7 günlük geçmiş erişimi',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-navy-200 text-sm">
                    <span className="text-teal-500">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block w-full text-center border border-navy-600 hover:border-teal-500/50 text-white py-3 rounded-xl font-medium transition-all hover:bg-navy-700"
              >
                Ücretsiz Başla
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-gradient-to-br from-teal-500/10 to-teal-500/5 border border-teal-500/30 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-teal-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Popüler
              </div>
              <h3 className="text-white font-semibold text-xl mb-2">Premium</h3>
              <p className="text-navy-300 text-sm mb-6">Tam sağlık yönetimi deneyimi</p>
              <div className="text-4xl font-bold text-white mb-2">
                ₺119 <span className="text-navy-300 text-base font-normal">/ ay</span>
              </div>
              <p className="text-teal-400 text-sm mb-8">veya ₺1.100 / yıl ile %30 tasarruf</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Sınırsız belge yükleme ve arşiv',
                  'Sınırsız AI analizi ve raporlama',
                  'Doktora Hazırlan modu',
                  'İlaç etkileşim kontrolü',
                  'Acil durum tespiti ve uyarı',
                  'Sınırsız sesli asistan',
                  'Aile üyesi ekleme',
                  'Reklamsız deneyim',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-navy-200 text-sm">
                    <span className="text-teal-400">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block w-full text-center bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-teal-500/25"
              >
                Premium'a Geç
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-700/50 px-6 md:px-16 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-white font-medium">
              Tanı<span className="text-teal-500">Log</span>
            </span>
          </div>
          <p className="text-navy-400 text-sm">
            © 2026 BaysalCare. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
