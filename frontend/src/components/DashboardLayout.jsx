import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome,
  FiUser,
  FiMenu,
  FiX,
  FiLogOut,
  FiActivity,
  FiFileText,
  FiSettings,
  FiHeart
} from 'react-icons/fi';
import useAuthStore from '../stores/authStore';

const navItems = [
  { icon: <FiHome size={20} />, label: 'Dashboard', path: '/dashboard' },
  { icon: <FiActivity size={20} />, label: 'Sağlık Takibi', path: '/health' },
  { icon: <FiFileText size={20} />, label: 'Belgelerim', path: '/documents' },
  { icon: <FiUser size={20} />, label: 'Profil', path: '/profile' },
  { icon: <FiSettings size={20} />, label: 'Ayarlar', path: '/settings', badge: 'Yakında' },
];

/**
 * Dashboard layout bileşeni.
 * Sol sidebar + üst header + ana içerik alanı.
 */
function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-navy-900 flex font-poppins text-white selection:bg-teal-500 selection:text-white overflow-hidden relative">
      {/* Background blobs for dashboard */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-teal-500/5 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] bg-blue-500/5 rounded-full blur-[80px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Mobil overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-900/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 glass border-r border-navy-700/50 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-navy-700/50">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <img src="/logos/logo-white-text.png" alt="TanıLog Logo" className="h-12 md:h-14 w-auto group-hover:scale-105 transition-transform" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-navy-400 hover:text-white transition-colors bg-navy-800/50 p-2 rounded-lg"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigasyon */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isDisabled = !!item.badge;

            return (
              <Link
                key={item.path}
                to={isDisabled ? '#' : item.path}
                onClick={(e) => {
                  if (isDisabled) e.preventDefault();
                  else setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden ${
                  isActive
                    ? 'text-teal-400 shadow-[inset_0_0_20px_rgba(45,212,191,0.1)]'
                    : isDisabled
                    ? 'text-navy-500 cursor-not-allowed'
                    : 'text-navy-300 hover:text-white hover:bg-navy-800/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActiveBg"
                    className="absolute inset-0 bg-teal-500/10 border border-teal-500/20 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 transition-transform ${isActive ? '' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span className="flex-1 relative z-10">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] bg-navy-800 border border-navy-700 text-navy-400 px-2 py-0.5 rounded-full relative z-10">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Kullanıcı bilgi & çıkış */}
        <div className="border-t border-navy-700/50 p-5 bg-navy-900/30">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500/20 to-blue-500/20 border border-teal-500/30 rounded-xl flex items-center justify-center text-teal-400 font-bold shadow-inner">
              {getInitials(user?.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.full_name || 'Kullanıcı'}</p>
              <p className="text-navy-400 text-xs truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
          >
            <FiLogOut size={16} />
            <span>Güvenli Çıkış</span>
          </button>
        </div>
      </aside>

      {/* Ana içerik */}
      <div className="flex-1 flex flex-col h-screen relative z-10">
        {/* Üst header */}
        <header className="sticky top-0 z-30 glass border-b border-navy-700/50 px-6 py-4 transition-all">
          <div className="flex items-center justify-between lg:justify-end">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-navy-300 hover:text-white transition-colors bg-navy-800/50 p-2 rounded-lg"
            >
              <FiMenu size={22} />
            </button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm ${
                    user?.is_premium
                      ? 'bg-gradient-to-r from-teal-500/10 to-blue-500/10 text-teal-400 border border-teal-500/30 shadow-teal-500/10'
                      : 'bg-navy-800 text-navy-300 border border-navy-700'
                  }`}
                >
                  {user?.is_premium ? (
                    <><FiStar className="fill-current text-yellow-400" size={12}/> Premium Plan</>
                  ) : (
                    'Ücretsiz Plan'
                  )}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Sayfa içeriği */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto overflow-x-hidden hide-scrollbar">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-w-6xl mx-auto h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
