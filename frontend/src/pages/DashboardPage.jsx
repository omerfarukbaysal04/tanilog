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
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hoş geldin kartı */}
        <div className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent border border-teal-500/20 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Kullanıcı'}! 👋
              </h1>
              <p className="text-navy-300 text-sm md:text-base">
                Bugün sağlık verilerini kaydetmeye ne dersin?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium px-4 py-2 rounded-xl ${
                  user?.is_premium
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'bg-navy-700/50 text-navy-300 border border-navy-600/50'
                }`}
              >
                {user?.is_premium ? '⭐ Premium Plan' : '📋 Ücretsiz Plan'}
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
          <h2 className="text-lg font-semibold text-white mb-4">Hızlı Eylemler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const colors = colorClasses[action.color];
              return (
                <button
                  key={index}
                  disabled={action.disabled}
                  className={`relative bg-navy-800/60 border border-navy-700/50 rounded-2xl p-6 text-left transition-all ${
                    action.disabled
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:border-teal-500/30 hover:-translate-y-1'
                  } group`}
                >
                  {action.disabled && (
                    <span className="absolute top-3 right-3 text-[10px] bg-navy-700 text-navy-400 px-2 py-0.5 rounded-full">
                      Yakında
                    </span>
                  )}
                  <div
                    className={`w-11 h-11 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text} mb-4`}
                  >
                    {action.icon}
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{action.title}</h3>
                  <p className="text-navy-400 text-xs">{action.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Son aktivite */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Son Aktiviteler</h2>
          <div className="bg-navy-800/60 border border-navy-700/50 rounded-2xl p-8">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-navy-700/50 rounded-2xl flex items-center justify-center mb-4">
                <FiClock size={28} className="text-navy-500" />
              </div>
              <h3 className="text-white font-medium mb-2">Henüz aktivite yok</h3>
              <p className="text-navy-400 text-sm max-w-sm">
                Sağlık verilerinizi kaydetmeye başladığınızda son aktiviteleriniz burada görünecek.
              </p>
            </div>
          </div>
        </div>

        {/* Premium upsell (Free kullanıcılar için) */}
        {!user?.is_premium && (
          <div className="bg-gradient-to-r from-teal-500/10 to-teal-500/5 border border-teal-500/20 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-white font-semibold text-lg mb-1">
                  Premium'a Yükselt ⭐
                </h3>
                <p className="text-navy-300 text-sm">
                  Sınırsız AI analizi, belge yükleme ve daha fazlası için Premium'a geçin.
                </p>
              </div>
              <Link
                to="/#pricing"
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-teal-500/25 whitespace-nowrap text-center"
              >
                Planları Gör
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, subtitle, color }) {
  const colors = colorClasses[color] || colorClasses.teal;
  return (
    <div className="bg-navy-800/60 border border-navy-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-9 h-9 ${colors.bg} rounded-lg flex items-center justify-center ${colors.text}`}
        >
          {icon}
        </div>
        <span className="text-navy-400 text-xs font-medium">{label}</span>
      </div>
      <p className="text-white font-semibold text-lg">{value}</p>
      {subtitle && <p className="text-navy-500 text-xs mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default DashboardPage;
