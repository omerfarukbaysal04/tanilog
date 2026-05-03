import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFileText,
  FiMic,
  FiShield,
  FiActivity,
  FiCalendar,
  FiHeart,
  FiChevronDown,
  FiStar,
  FiCheck,
  FiArrowRight,
  FiUploadCloud,
  FiCpu,
  FiTrendingUp
} from 'react-icons/fi';
import useAuthStore from '../stores/authStore';
import AnimatedHeroBackground from '../components/ui/AnimatedHeroBackground';
import ScrollReveal from '../components/ui/ScrollReveal';
import AnimatedCounter from '../components/ui/AnimatedCounter';

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

const steps = [
  {
    icon: <FiUploadCloud size={32} />,
    title: 'Belgelerinizi Yükleyin',
    description: 'Tahlil, reçete veya raporlarınızı platforma kolayca yükleyin veya sesli asistanla günlüğünüzü tutun.',
  },
  {
    icon: <FiCpu size={32} />,
    title: 'Yapay Zeka Analizi',
    description: 'Gelişmiş AI modellerimiz karmaşık tıbbi verileri saniyeler içinde analiz edip anlamlandırır.',
  },
  {
    icon: <FiTrendingUp size={32} />,
    title: 'İçgörüler Alın',
    description: 'Anlaşılır Türkçe raporlar ve kişiselleştirilmiş sağlık uyarıları ile sağlığınızın kontrolünü elinize alın.',
  },
];

const testimonials = [
  {
    name: 'Ayşe Y.',
    role: 'Kronik Hasta Yakını',
    content: 'Annemin karmaşık tahlil sonuçlarını artık tek bir tıkla anlayabiliyorum. TanıLog bizim için gerçek bir kurtarıcı oldu.',
    rating: 5,
  },
  {
    name: 'Mehmet K.',
    role: 'Düzenli Kullanıcı',
    content: 'Sesli komutla semptom eklemek harika bir özellik. Yolda yürürken bile günlük sağlık günlüğümü tutabiliyorum.',
    rating: 5,
  },
  {
    name: 'Dr. Selin A.',
    role: 'Dahiliye Uzmanı',
    content: "Hastalarımın 'Doktora Hazırlan' raporuyla gelmesi muayene sürecini çok hızlandırıyor. Kesinlikle tavsiye ederim.",
    rating: 5,
  },
];

const faqs = [
  {
    question: 'TanıLog güvenli mi? Verilerim nerede saklanıyor?',
    answer: 'Verileriniz en yüksek güvenlik standartlarıyla şifrelenerek saklanır. Hiçbir sağlık veriniz üçüncü şahıslarla paylaşılmaz.',
  },
  {
    question: 'Yapay zeka analizleri ne kadar doğru?',
    answer: 'AI modellerimiz binlerce tıbbi belgeyle eğitilmiştir, ancak TanıLog bir teşhis aracı değildir. Önerilerimiz sadece bilgilendirme amaçlıdır ve mutlaka doktorunuza danışmanız gerekir.',
  },
  {
    question: 'Ücretsiz planla neler yapabilirim?',
    answer: 'Ücretsiz planımızla günlük semptom ve ilaç kaydı tutabilir, ayda 3 adet belge yükleyip yapay zekaya analiz ettirebilirsiniz.',
  },
];

function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-navy-900 font-poppins text-white selection:bg-teal-500 selection:text-white">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass py-3' : 'bg-transparent py-5'
        } px-6 md:px-16`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center group cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <img src="/logos/logo-white-text.png" alt="TanıLog Logo" className="h-12 md:h-14 w-auto group-hover:scale-105 transition-transform" />
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#how-it-works" className="text-navy-200 hover:text-teal-400 transition-colors">Nasıl Çalışır</a>
            <a href="#features" className="text-navy-200 hover:text-teal-400 transition-colors">Özellikler</a>
            <a href="#testimonials" className="text-navy-200 hover:text-teal-400 transition-colors">Yorumlar</a>
            <a href="#pricing" className="text-navy-200 hover:text-teal-400 transition-colors">Fiyatlandırma</a>
            <a href="#faq" className="text-navy-200 hover:text-teal-400 transition-colors">SSS</a>
          </div>
          
          <Link
            to="/login"
            className="btn-shimmer bg-teal-500 hover:bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-teal-500/25 hover:-translate-y-0.5"
          >
            Giriş Yap
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 md:px-16 pt-20 pb-16 overflow-hidden">
        <AnimatedHeroBackground />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center mt-10">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 px-5 py-2 rounded-full text-sm mb-8 backdrop-blur-sm animate-border-glow">
              <span className="w-2 h-2 bg-teal-400 rounded-full animate-heartbeat shadow-[0_0_8px_rgba(45,212,191,0.8)]"></span>
              Yapay Zeka Destekli Sağlık Asistanı
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={0.1}>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6 tracking-tight">
              Sağlığını <span className="gradient-text">Anla</span>,<br />
              Hayatını <span className="gradient-text">Yönet</span>.
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-navy-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              Tıbbi belgelerinizi yükleyin, günlük sağlık verilerinizi kaydedin.
              TanıLog yapay zeka ile verilerinizi analiz ederek size anlamlı içgörüler sunar.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="btn-shimmer bg-gradient-to-r from-teal-400 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-xl shadow-teal-500/30 hover:-translate-y-1 hover:shadow-teal-500/40 flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                Ücretsiz Başla <FiArrowRight />
              </Link>
              <a
                href="#how-it-works"
                className="glass-light text-white px-8 py-4 rounded-xl font-medium text-lg transition-all hover:bg-navy-800/50 flex items-center justify-center w-full sm:w-auto"
              >
                Nasıl Çalışır?
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 border-y border-navy-700/50 bg-navy-800/30">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-navy-700/50">
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold gradient-text mb-2">
                <AnimatedCounter target={10} suffix="K+" />
              </div>
              <div className="text-navy-300 text-sm md:text-base">Mutlu Kullanıcı</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold gradient-text mb-2">
                <AnimatedCounter target={50} suffix="K+" />
              </div>
              <div className="text-navy-300 text-sm md:text-base">Yapılan Analiz</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold gradient-text mb-2">
                <AnimatedCounter target={500} suffix="+" />
              </div>
              <div className="text-navy-300 text-sm md:text-base">İlaç Veritabanı</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold gradient-text mb-2">
                %<AnimatedCounter target={99} />.9
              </div>
              <div className="text-navy-300 text-sm md:text-base">Uptime Oranı</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 px-6 md:px-16 relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-teal-500/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Sadece <span className="gradient-text">3 Adımda</span> Sağlığınız Kontrol Altında
              </h2>
              <p className="text-navy-300 text-lg max-w-2xl mx-auto">
                Karmaşık süreçlere son. Sağlık verilerinizi anlamlandırmak artık çok kolay.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* SVG Connecting Line for Desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-navy-700/50">
              <div className="h-full bg-teal-500/50 animate-dash" style={{ width: '100%', strokeDasharray: '10, 10' }} />
            </div>

            {steps.map((step, index) => (
              <ScrollReveal key={index} delay={index * 0.2} className="relative z-10 text-center">
                <div className="w-24 h-24 mx-auto glass rounded-full flex items-center justify-center text-teal-400 mb-6 shadow-xl shadow-teal-500/10 group-hover:scale-110 transition-transform relative">
                  <div className="absolute inset-0 rounded-full border border-teal-500/30 animate-pulse-glow" />
                  {step.icon}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-teal-500/40">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-navy-300 leading-relaxed">{step.description}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 md:px-16 bg-navy-800/40 relative">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Size Özel <span className="gradient-text">Sağlık Asistanınız</span>
              </h2>
              <p className="text-navy-300 text-lg max-w-2xl mx-auto">
                TanıLog ile sağlık verilerinizi tek bir platformda toplayın ve en yeni yapay zeka teknolojileriyle analiz edin.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <div className="glass-card rounded-2xl p-8 h-full group">
                  <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 group-hover:bg-teal-500/20 group-hover:text-teal-300 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-white font-semibold text-xl mb-3 group-hover:text-teal-300 transition-colors">{feature.title}</h3>
                  <p className="text-navy-300 text-sm leading-relaxed group-hover:text-navy-200 transition-colors">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 md:px-16 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Kullanıcılarımız <span className="gradient-text">Ne Diyor?</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testi, index) => (
              <ScrollReveal key={index} delay={index * 0.15}>
                <div className="glass-card rounded-2xl p-8 relative">
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(testi.rating)].map((_, i) => <FiStar key={i} fill="currentColor" />)}
                  </div>
                  <p className="text-navy-200 italic mb-6">"{testi.content}"</p>
                  <div className="flex items-center gap-3 border-t border-navy-700/50 pt-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                      {testi.name[0]}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{testi.name}</div>
                      <div className="text-teal-400 text-xs">{testi.role}</div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 md:px-16 bg-navy-800/40">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Basit ve Şeffaf <span className="gradient-text">Fiyatlandırma</span>
              </h2>
              <p className="text-navy-300 text-lg max-w-2xl mx-auto">
                Ücretsiz başlayın, ihtiyacınız olduğunda premium özelliklerin tadını çıkarın.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <ScrollReveal direction="right">
              <div className="glass-card rounded-2xl p-8 h-full flex flex-col">
                <h3 className="text-white font-semibold text-2xl mb-2">Ücretsiz</h3>
                <p className="text-navy-400 text-sm mb-6">Sağlık takibine hemen başlamak için ideal.</p>
                <div className="text-5xl font-bold text-white mb-8 flex items-end gap-1">
                  ₺0 <span className="text-navy-400 text-lg font-normal mb-1">/ ay</span>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {['Günlük semptom ve ilaç kaydı', 'Ayda 3 belge yükleme', 'Günde 1 AI analizi', '3 ilaca kadar hatırlatma', '7 günlük geçmiş erişimi'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-navy-200 text-sm">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                        <FiCheck size={12} />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="block w-full text-center glass border border-teal-500/30 hover:bg-teal-500/10 text-white py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-teal-500/20 mt-auto"
                >
                  Ücretsiz Başla
                </Link>
              </div>
            </ScrollReveal>

            {/* Premium */}
            <ScrollReveal direction="left">
              <div className="animated-border rounded-2xl h-full p-[1px] bg-gradient-to-br from-teal-400 to-blue-500 shadow-2xl shadow-teal-500/20">
                <div className="bg-navy-900 rounded-[15px] p-8 h-full flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-teal-400 to-teal-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg shadow-lg">
                    EN POPÜLER
                  </div>
                  
                  <h3 className="text-white font-semibold text-2xl mb-2 flex items-center gap-2">
                    Premium <FiStar className="text-yellow-400 fill-current" size={20} />
                  </h3>
                  <p className="text-navy-300 text-sm mb-6">Tüm sağlık verileriniz ve AI gücü emrinizde.</p>
                  
                  <div className="text-5xl font-bold text-white mb-2 flex items-end gap-1">
                    ₺119 <span className="text-navy-300 text-lg font-normal mb-1">/ ay</span>
                  </div>
                  <p className="text-teal-400 text-sm mb-8 font-medium">veya ₺1.100 / yıl ile %30 tasarruf</p>
                  
                  <ul className="space-y-4 mb-10 flex-1">
                    {[
                      'Sınırsız belge yükleme ve arşiv',
                      'Sınırsız AI analizi ve raporlama',
                      'Doktora Hazırlan PDF oluşturucu',
                      'İlaç etkileşim kontrolü',
                      'Acil durum tespiti ve uyarı',
                      'Aile üyesi profili ekleme'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-navy-200 text-sm font-medium">
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-500/40">
                          <FiCheck size={12} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    to="/register"
                    className="block w-full text-center bg-gradient-to-r from-teal-400 to-teal-600 text-white py-4 rounded-xl font-bold transition-all hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5 mt-auto"
                  >
                    Premium'a Geç
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 md:px-16 max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Sıkça Sorulan <span className="gradient-text">Sorular</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <div className="glass-card rounded-2xl overflow-hidden">
                <button
                  className="w-full px-6 py-5 text-left flex justify-between items-center text-white font-medium hover:text-teal-400 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  {faq.question}
                  <motion.div animate={{ rotate: openFaq === index ? 180 : 0 }}>
                    <FiChevronDown size={20} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 text-navy-300 text-sm leading-relaxed border-t border-navy-700/50 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/40 via-navy-900 to-blue-900/40" />
        <div className="max-w-4xl mx-auto relative z-10 text-center glass-card border border-teal-500/20 p-12 rounded-3xl shadow-2xl shadow-teal-500/10">
          <ScrollReveal>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Sağlığınızı Yönetmeye <br/> <span className="gradient-text">Bugün Başlayın</span>
            </h2>
            <p className="text-navy-200 text-lg mb-10 max-w-2xl mx-auto">
              Binlerce mutlu kullanıcıya katılın ve yapay zeka destekli kişisel sağlık asistanınızla tanışın.
            </p>
            <Link
              to="/register"
              className="inline-block btn-shimmer bg-teal-500 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-teal-500/30"
            >
              Hemen Ücretsiz Hesap Oluştur
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-800 bg-navy-900/80 pt-16 pb-8 px-6 md:px-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none text-navy-800/30 rotate-180">
          <svg className="relative block w-[calc(100%+1.3px)] h-[50px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor"></path>
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-12 relative z-10">
          <div className="md:col-span-2">
            <div className="flex items-center mb-6">
              <img src="/logos/logo-white-text.png" alt="TanıLog Logo" className="h-12 md:h-14 w-auto" />
            </div>
            <p className="text-navy-300 text-sm max-w-sm mb-6 leading-relaxed">
              Yapay zeka destekli, güvenli ve kişiselleştirilmiş sağlık takip platformunuz.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-3">
              <li><a href="#how-it-works" className="text-navy-400 hover:text-teal-400 text-sm transition-colors">Nasıl Çalışır?</a></li>
              <li><a href="#features" className="text-navy-400 hover:text-teal-400 text-sm transition-colors">Özellikler</a></li>
              <li><a href="#pricing" className="text-navy-400 hover:text-teal-400 text-sm transition-colors">Fiyatlandırma</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Yasal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-navy-400 hover:text-teal-400 text-sm transition-colors">Gizlilik Politikası</a></li>
              <li><a href="#" className="text-navy-400 hover:text-teal-400 text-sm transition-colors">Kullanım Şartları</a></li>
              <li><a href="#" className="text-navy-400 hover:text-teal-400 text-sm transition-colors">KVKK Aydınlatma Metni</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-navy-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <p className="text-navy-500 text-sm">
            © 2026 TanıLog (BaysalCare). Tüm hakları saklıdır.
          </p>
          <div className="flex gap-4 text-navy-400">
            <a href="#" className="hover:text-teal-400 transition-colors">Twitter</a>
            <a href="#" className="hover:text-teal-400 transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
