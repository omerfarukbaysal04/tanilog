import { FiShield, FiStar, FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

function AdBanner({ compact = false }) {
  const { user } = useAuthStore();

  if (user?.is_premium) return null;

  return (
    <aside
      className={`rounded-2xl border border-yellow-400/20 bg-gradient-to-r from-yellow-400/10 via-navy-800/80 to-teal-500/10 ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-yellow-400/15 border border-yellow-400/25 text-yellow-300 flex items-center justify-center shrink-0">
            <FiZap size={20} />
          </div>
          <div>
            <p className="text-yellow-100 text-sm font-semibold">Sponsorlu alan</p>
            <h3 className="text-white font-bold text-lg">Premium ile reklamsiz devam et</h3>
            <p className="text-navy-300 text-sm mt-1">
              AI raporlar, aile takibi ve asistan ozelliklerini kesintisiz kullan.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-teal-200 border border-teal-500/20 rounded-full px-3 py-2">
            <FiShield /> Reklamsiz Premium
          </span>
          <Link
            to="/billing"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white px-4 py-2.5 text-sm font-bold transition-colors"
          >
            <FiStar className="fill-current text-yellow-300" /> Planlari Gor
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default AdBanner;
