import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiActivity,
  FiFileText,
  FiPlus,
  FiClock,
  FiStar,
  FiCalendar,
  FiTrendingUp,
  FiHeart,
  FiChevronRight
} from 'react-icons/fi';
import useAuthStore from '../stores/authStore';
import DashboardLayout from '../components/DashboardLayout';

const quickActions = [
  {
    icon: <FiActivity size={22} />,
    title: 'Semptom Ekle',
    description: 'Günlük semptom kaydı oluştur',
    color: 'teal',
    disabled: true,
  },
  {
    icon: <FiFileText size={22} />,
    title: 'Belge Yükle',
    description: 'Tıbbi belge yükle ve analiz et',
    color: 'blue',
    disabled: true,
  },
  {
    icon: <FiPlus size={22} />,
    title: 'İlaç Ekle',
    description: 'İlaç kaydı ve hatırlatma oluştur',
    color: 'purple',
    disabled: true,
  },
  {
    icon: <FiHeart size={22} />,
    title: 'Uyku Kaydı',
    description: 'Uyku düzenini kaydet',
    color: 'pink',
    disabled: true,
  },
];

const colorClasses = {
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', hover: 'hover:border-teal-500/40 hover:shadow-teal-500/10' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', hover: 'hover:border-blue-500/40 hover:shadow-blue-500/10' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', hover: 'hover:border-purple-500/40 hover:shadow-purple-500/10' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20', hover: 'hover:border-pink-500/40 hover:shadow-pink-500/10' },
};

function DashboardPage() {
  const { user, fetchUser } = useAuthStore();

  useEffect(() => {
    if (!user) fetchUser();
  }, [user, fetchUser]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8">
        {/* Hoş geldin kartı */}
        <div className="relative overflow-hidden glass rounded-3xl p-8 sm:p-10 border-t border-l border-white/5 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse-glow" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800/80 border border-navy-700 text-xs font-medium text-navy-300 mb-4">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                Sistem Aktif
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                {getGreeting()}, <span className="gradient-text">{user?.full_name?.split(' ')[0] || 'Kullanıcı'}</span> 👋
              </h1>
              <p className="text-navy-200 text-sm md:text-base max-w-xl">
                Yapay zeka asistanın hazır. Bugün sağlık verilerini kaydederek güne başlayalım mı?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 ${
                  user?.is_premium
                    ? 'bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-teal-300 border border-teal-500/30'
                    : 'bg-navy-800 text-navy-300 border border-navy-700'
                }`}
              >
                {user?.is_premium ? <><FiStar className="fill-current text-yellow-400" /> Premium Plan</> : '📋 Ücretsiz Plan'}
              </span>
            </div>
          </div>
        </div>

        {/* İstatistik kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FiCalendar size={20} />}
            label="Üyelik Tarihi"
            value={formatDate(user?.created_at)}
            color="teal"
          />
          <StatCard
            icon={<FiStar size={20} />}
            label="Plan"
            value={user?.is_premium ? 'Premium' : 'Ücretsiz'}
            color="blue"
          />
          <StatCard
            icon={<FiTrendingUp size={20} />}
            label="Toplam Kayıt"
            value="0"
            subtitle="Henüz kayıt yok"
            color="purple"
          />
          <StatCard
            icon={<FiClock size={20} />}
            label="Son Aktivite"
            value="—"
            subtitle="Henüz aktivite yok"
            color="pink"
          />
        </div>

        {/* Hızlı eylemler */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">Hızlı Eylemler</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const colors = colorClasses[action.color];
              return (
                <button
                  key={index}
                  disabled={action.disabled}
                  className={`relative glass-card border ${colors.border} rounded-2xl p-6 text-left transition-all duration-300 group ${
                    action.disabled
                      ? 'opacity-60 cursor-not-allowed'
                      : colors.hover + ' hover:-translate-y-1'
                  }`}
                >
                  {action.disabled && (
                    <span className="absolute top-4 right-4 text-[10px] font-medium bg-navy-800 text-navy-400 px-2.5 py-1 rounded-full border border-navy-700">
                      Yakında
                    </span>
                  )}
                  <div
                    className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text} mb-5 group-hover:scale-110 transition-transform`}
                  >
                    {action.icon}
                  </div>
                  <h3 className="text-white font-semibold text-base mb-1.5">{action.title}</h3>
                  <p className="text-navy-400 text-xs leading-relaxed">{action.description}</p>
                  
                  {!action.disabled && (
                    <div className={`absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity ${colors.text}`}>
                      <FiChevronRight size={20} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alt Bölüm - İki Kolon */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Son aktivite */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-5">Son Aktiviteler</h2>
            <div className="glass rounded-2xl p-8 border border-navy-700/50 min-h-[300px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-navy-800/50 rounded-full blur-3xl" />
              
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-navy-800 rounded-2xl flex items-center justify-center mb-5 border border-navy-700 shadow-inner">
                  <FiClock size={28} className="text-navy-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Henüz Aktivite Yok</h3>
                <p className="text-navy-400 text-sm max-w-sm">
                  Sağlık verilerinizi veya belgelerinizi eklemeye başladığınızda, zaman tüneliniz burada oluşacak.
                </p>
              </div>
            </div>
          </div>

          {/* Premium upsell (Free kullanıcılar için) veya Widget alanı */}
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white mb-5">Öneriler</h2>
            {!user?.is_premium ? (
              <div className="animated-border rounded-2xl h-full p-[1px] bg-gradient-to-br from-teal-400/50 to-blue-500/50">
                <div className="bg-navy-900 rounded-[15px] p-8 h-full flex flex-col relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/20 rounded-full blur-xl animate-pulse-glow" />
                  
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-yellow-500/20">
                    <FiStar className="text-white fill-current" size={24} />
                  </div>
                  
                  <h3 className="text-white font-bold text-xl mb-2">
                    Premium'a Yükselt
                  </h3>
                  <p className="text-navy-300 text-sm mb-6 flex-1">
                    Sınırsız AI analizi, PDF doktor raporu ve ilaç etkileşim uyarıları için planınızı yükseltin.
                  </p>
                  
                  <Link
                    to="/billing"
                    className="w-full btn-shimmer bg-white text-navy-900 py-3 rounded-xl font-bold text-sm text-center transition-transform hover:scale-105 shadow-xl"
                  >
                    Planları Gör
                  </Link>
                </div>
              </div>
            ) : (
              <div className="glass rounded-2xl p-8 border border-teal-500/20 h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mb-4 text-teal-400">
                  <FiHeart size={28} />
                </div>
                <h3 className="text-white font-semibold mb-2">Premium Aktif</h3>
                <p className="text-navy-300 text-sm">Tüm yapay zeka özellikleri kullanımınıza açık.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, subtitle, color }) {
  const colors = colorClasses[color] || colorClasses.teal;
  return (
    <div className={`glass-card border ${colors.border} rounded-2xl p-6 relative overflow-hidden group`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 ${colors.bg} rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity`} />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 ${colors.bg} border ${colors.border} rounded-xl flex items-center justify-center ${colors.text} shadow-sm`}
          >
            {icon}
          </div>
          <span className="text-navy-300 text-sm font-medium">{label}</span>
        </div>
        <p className="text-white font-bold text-2xl tracking-tight">{value}</p>
        {subtitle && <p className="text-navy-400 text-xs mt-1.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default DashboardPage;
