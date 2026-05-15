import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiActivity,
  FiCalendar,
  FiChevronRight,
  FiClock,
  FiCoffee,
  FiFileText,
  FiHeart,
  FiPlus,
  FiRefreshCw,
  FiStar,
  FiTrendingUp,
} from 'react-icons/fi';
import useAuthStore from '../stores/authStore';
import useDashboardStore from '../stores/dashboardStore';
import DashboardLayout from '../components/DashboardLayout';

const quickActions = [
  {
    icon: <FiActivity size={22} />,
    title: 'Semptom Ekle',
    description: 'Bugüne semptom kaydı gir',
    color: 'teal',
    path: '/health?tab=symptoms&new=1',
  },
  {
    icon: <FiFileText size={22} />,
    title: 'Belge Yükle',
    description: 'Tıbbi belge yükle ve analiz et',
    color: 'blue',
    path: '/documents',
  },
  {
    icon: <FiPlus size={22} />,
    title: 'İlaç Ekle',
    description: 'İlaç kaydı ve hatırlatma oluştur',
    color: 'purple',
    path: '/health?tab=medications&new=1',
  },
  {
    icon: <FiHeart size={22} />,
    title: 'Uyku Kaydı',
    description: 'Uyku düzenini bugüne kaydet',
    color: 'pink',
    path: '/health?tab=sleep&new=1',
  },
];

const colorClasses = {
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', hover: 'hover:border-teal-500/40 hover:shadow-teal-500/10' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', hover: 'hover:border-blue-500/40 hover:shadow-blue-500/10' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', hover: 'hover:border-purple-500/40 hover:shadow-purple-500/10' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20', hover: 'hover:border-pink-500/40 hover:shadow-pink-500/10' },
};

const activityMeta = {
  symptom: { icon: <FiActivity />, color: 'text-teal-300 bg-teal-500/10 border-teal-500/20' },
  medication: { icon: <FiPlus />, color: 'text-purple-300 bg-purple-500/10 border-purple-500/20' },
  sleep: { icon: <FiHeart />, color: 'text-pink-300 bg-pink-500/10 border-pink-500/20' },
  nutrition: { icon: <FiCoffee />, color: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20' },
  document: { icon: <FiFileText />, color: 'text-blue-300 bg-blue-500/10 border-blue-500/20' },
  report: { icon: <FiFileText />, color: 'text-teal-300 bg-teal-500/10 border-teal-500/20' },
  billing: { icon: <FiStar />, color: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20' },
};

const parseApiDateTime = (dateStr) => {
  if (!dateStr) return null;
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(dateStr)) return new Date(dateStr);
  return new Date(`${dateStr}Z`);
};

const parseLocalDate = (dateStr) => {
  const [year, month, day] = String(dateStr || '').split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
};

function DashboardPage() {
  const { user, fetchUser } = useAuthStore();
  const { summary, isLoading, fetchSummary } = useDashboardStore();

  useEffect(() => {
    if (!user) fetchUser();
    fetchSummary().catch(() => {});
  }, [user, fetchUser, fetchSummary]);

  const counts = summary?.counts || {};
  const today = summary?.today || {};
  const activities = summary?.activities || [];
  const trends = summary?.trends || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return parseApiDateTime(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Istanbul',
    });
  };

  const formatRelative = (dateStr) => {
    if (!dateStr) return 'Henüz aktivite yok';
    const parsedDate = parseApiDateTime(dateStr);
    const diffMs = Date.now() - parsedDate.getTime();
    const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);
    if (diffMinutes < 1) return 'Az önce';
    if (diffMinutes < 60) return `${diffMinutes} dk önce`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} gün önce`;
    return formatDate(dateStr);
  };

  const todayCompleted = [
    today.symptoms > 0,
    today.medications > 0,
    today.sleep > 0,
    today.nutrition > 0,
  ].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8">
        <div className="relative overflow-hidden glass rounded-3xl p-8 sm:p-10 border-t border-l border-white/5 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse-glow" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800/80 border border-navy-700 text-xs font-medium text-navy-300 mb-4">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                Sistem Aktif
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                {getGreeting()}, <span className="gradient-text">{user?.full_name?.split(' ')[0] || 'Kullanıcı'}</span>
              </h1>
              <p className="text-navy-200 text-sm md:text-base max-w-xl">
                Bugün {todayCompleted}/4 ana takip alanında kayıt var. Sağlık verilerini ekledikçe dashboard otomatik güncellenir.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchSummary().catch(() => {})}
                className="w-11 h-11 rounded-xl border border-navy-700 bg-navy-800/70 hover:bg-navy-700 text-navy-200 flex items-center justify-center transition-colors"
                title="Dashboard'u yenile"
              >
                <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
              </button>
              <span
                className={`text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 ${
                  user?.is_premium
                    ? 'bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-teal-300 border border-teal-500/30'
                    : 'bg-navy-800 text-navy-300 border border-navy-700'
                }`}
              >
                {user?.is_premium ? <><FiStar className="fill-current text-yellow-400" /> Premium Plan</> : 'Ücretsiz Plan'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<FiCalendar size={20} />} label="Üyelik Tarihi" value={formatDate(user?.created_at)} color="teal" />
          <StatCard icon={<FiStar size={20} />} label="Plan" value={user?.is_premium ? 'Premium' : 'Ücretsiz'} color="blue" />
          <StatCard
            icon={<FiTrendingUp size={20} />}
            label="Toplam Kayıt"
            value={counts.total_records ?? 0}
            subtitle={`${counts.documents || 0} belge · ${counts.doctor_reports || 0} rapor`}
            color="purple"
          />
          <StatCard
            icon={<FiClock size={20} />}
            label="Son Aktivite"
            value={formatRelative(summary?.latest_activity_at)}
            subtitle={activities[0]?.title || 'Henüz aktivite yok'}
            color="pink"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">Hızlı Eylemler</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const colors = colorClasses[action.color];
              return (
                <Link
                  key={action.title}
                  to={action.path}
                  className={`relative glass-card border ${colors.border} rounded-2xl p-6 text-left transition-all duration-300 group ${colors.hover} hover:-translate-y-1`}
                >
                  <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text} mb-5 group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <h3 className="text-white font-semibold text-base mb-1.5">{action.title}</h3>
                  <p className="text-navy-400 text-xs leading-relaxed pr-8">{action.description}</p>
                  <div className={`absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity ${colors.text}`}>
                    <FiChevronRight size={20} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Son Aktiviteler</h2>
              <Link to="/health" className="text-sm text-teal-300 hover:text-teal-200 font-semibold">Sağlık takibine git</Link>
            </div>
            <div className="glass rounded-2xl p-5 border border-navy-700/50 min-h-[300px] relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-navy-800/50 rounded-full blur-3xl" />
              {activities.length === 0 ? (
                <div className="relative z-10 min-h-[260px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-navy-800 rounded-2xl flex items-center justify-center mb-5 border border-navy-700 shadow-inner">
                    <FiClock size={28} className="text-navy-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Henüz Aktivite Yok</h3>
                  <p className="text-navy-400 text-sm max-w-sm">
                    Sağlık verilerini veya belgelerini eklemeye başladığında zaman tünelin burada oluşacak.
                  </p>
                </div>
              ) : (
                <div className="relative z-10 space-y-3">
                  {activities.map((activity, index) => (
                    <ActivityItem key={`${activity.kind}-${activity.created_at}-${index}`} activity={activity} formatRelative={formatRelative} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white mb-5">Bugünün Özeti</h2>
            <div className="glass rounded-2xl p-6 border border-navy-700/50 h-full">
              <div className="grid grid-cols-2 gap-3">
                <TodayTile label="Semptom" value={today.symptoms || 0} />
                <TodayTile label="İlaç" value={`${today.medications_taken || 0}/${today.medications || 0}`} />
                <TodayTile label="Uyku" value={today.sleep || 0} />
                <TodayTile label="Beslenme" value={today.nutrition || 0} />
              </div>
              {!user?.is_premium ? (
                <Link
                  to="/billing"
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white text-navy-900 py-3 font-bold text-sm transition-transform hover:scale-[1.01]"
                >
                  <FiStar className="fill-current text-yellow-500" /> Premium planları gör
                </Link>
              ) : (
                <div className="mt-5 rounded-xl border border-teal-500/20 bg-teal-500/10 p-4 text-center">
                  <FiHeart className="mx-auto text-teal-300 mb-2" size={24} />
                  <h3 className="text-white font-semibold">Premium Aktif</h3>
                  <p className="text-navy-300 text-sm mt-1">Tüm yapay zeka özellikleri kullanıma açık.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <section>
          <h2 className="text-xl font-bold text-white mb-5">Haftalık Trend</h2>
          <div className="glass rounded-2xl p-5 border border-navy-700/50">
            <div className="grid grid-cols-7 gap-2 min-h-[150px] items-end">
              {trends.map((day) => {
                const total = (day.symptoms || 0) + (day.medications || 0) + (day.sleep || 0) + (day.nutrition || 0);
                const height = Math.max(16, Math.min(110, total * 18));
                return (
                  <div key={day.date} className="flex flex-col items-center gap-2">
                    <div className="w-full max-w-16 h-28 flex items-end justify-center">
                      <div
                        className="w-full rounded-t-xl bg-gradient-to-t from-teal-500 to-blue-400 border border-teal-300/20"
                        style={{ height }}
                        title={`${total} kayıt`}
                      />
                    </div>
                    <span className="text-[11px] text-navy-400">{parseLocalDate(day.date).toLocaleDateString('tr-TR', { weekday: 'short' })}</span>
                    <span className="text-xs text-white font-bold">{total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function ActivityItem({ activity, formatRelative }) {
  const meta = activityMeta[activity.kind] || activityMeta.symptom;
  return (
    <Link
      to={activity.route || '/dashboard'}
      className="flex items-center gap-4 rounded-2xl border border-navy-700/60 bg-navy-900/35 hover:bg-navy-800/60 p-4 transition-colors"
    >
      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${meta.color}`}>
        {meta.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white font-semibold truncate">{activity.title}</p>
        <p className="text-navy-400 text-sm truncate">{activity.description}</p>
      </div>
      <span className="text-navy-400 text-xs whitespace-nowrap">{formatRelative(activity.created_at)}</span>
    </Link>
  );
}

function TodayTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900/45 p-4">
      <p className="text-navy-400 text-xs">{label}</p>
      <p className="text-white font-bold text-2xl mt-1">{value}</p>
    </div>
  );
}

function StatCard({ icon, label, value, subtitle, color }) {
  const colors = colorClasses[color] || colorClasses.teal;
  return (
    <div className={`glass-card border ${colors.border} rounded-2xl p-6 relative overflow-hidden group`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 ${colors.bg} rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity`} />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 ${colors.bg} border ${colors.border} rounded-xl flex items-center justify-center ${colors.text} shadow-sm`}>
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
