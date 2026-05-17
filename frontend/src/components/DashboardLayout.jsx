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
  FiHeart,
  FiCpu,
  FiStar,
  FiMic,
  FiClipboard,
  FiMessageCircle,
  FiUsers,
  FiChevronDown,
  FiCreditCard,
  FiShield
} from 'react-icons/fi';
import ChatAssistantWidget from './ChatAssistantWidget';
import NotificationCenter from './NotificationCenter';
import AdBanner from './AdBanner';
import GlobalSearch from './GlobalSearch';
import useAuthStore from '../stores/authStore';

const navItems = [
  { icon: <FiHome size={20} />, label: 'Dashboard', path: '/dashboard' },
  { icon: <FiActivity size={20} />, label: 'SaÄŸlÄ±k Takibi', path: '/health' },
  { icon: <FiFileText size={20} />, label: 'Belgelerim', path: '/documents' },
  { icon: <FiCpu size={20} />, label: 'AI Analiz', path: '/ai' },
  { icon: <FiMessageCircle size={20} />, label: 'AI Asistan', path: '/chat' },
  { icon: <FiMic size={20} />, label: 'Sesli Asistan', path: '/voice' },
  { icon: <FiClipboard size={20} />, label: 'Doktora HazÄ±rlan', path: '/doctor-prep' },
  { icon: <FiUsers size={20} />, label: 'Aile Takibi', path: '/family' },
  { icon: <FiCreditCard size={20} />, label: 'Premium', path: '/billing' },
  { icon: <FiUser size={20} />, label: 'Profil', path: '/profile' },
  { icon: <FiSettings size={20} />, label: 'Ayarlar', path: '/settings' },
];

const adminNavItem = { icon: <FiShield size={20} />, label: 'Admin', path: '/admin' };

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/search': 'Arama',
  '/timeline': 'Zaman Ã‡izelgesi',
  '/health': 'SaÄŸlÄ±k Takibi',
  '/documents': 'Belgelerim',
  '/ai': 'AI Analiz',
  '/chat': 'AI Asistan',
  '/voice': 'Sesli Asistan',
  '/doctor-prep': 'Doktora HazÄ±rlan',
  '/family': 'Aile Takibi',
  '/billing': 'Premium',
  '/profile': 'Profil',
  '/settings': 'Ayarlar',
  '/admin': 'Admin',
};

/**
 * Dashboard layout bileÅŸeni.
 * Sol sidebar + Ã¼st header + ana iÃ§erik alanÄ±.
 */
function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = pageTitles[location.pathname] || 'TanÄ±Log';

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
    <div className="h-screen bg-navy-900 flex font-poppins text-white selection:bg-teal-500 selection:text-white overflow-hidden relative">
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
            <img src="/logos/logo-white-text.png" alt="TanÄ±Log Logo" className="h-12 md:h-14 w-auto group-hover:scale-105 transition-transform" />
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
          {[...navItems, ...(user?.is_admin ? [adminNavItem] : [])].map((item) => {
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

        {/* KullanÄ±cÄ± bilgi & Ã§Ä±kÄ±ÅŸ */}
        <div className="hidden border-t border-navy-700/50 p-5 bg-navy-900/30">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500/20 to-blue-500/20 border border-teal-500/30 rounded-xl flex items-center justify-center text-teal-400 font-bold shadow-inner">
              {getInitials(user?.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.full_name || 'KullanÄ±cÄ±'}</p>
              <p className="text-navy-400 text-xs truncate">{user?.email || ''}</p>
              <span
                className={`inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  user?.is_premium
                    ? 'bg-gradient-to-r from-teal-500/10 to-blue-500/10 text-teal-300 border border-teal-500/30'
                    : 'bg-navy-800 text-navy-300 border border-navy-700'
                }`}
              >
                {user?.is_premium ? (
                  <><FiStar className="fill-current text-yellow-400" size={11}/> Premium Plan</>
                ) : (
                  'Ãœcretsiz Plan'
                )}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
          >
            <FiLogOut size={16} />
            <span>GÃ¼venli Ã‡Ä±kÄ±ÅŸ</span>
          </button>
        </div>
      </aside>

      {/* Ana iÃ§erik */}
      <div className="flex-1 flex flex-col h-screen relative z-10">
        {/* Ãœst header */}
        <header className="sticky top-0 z-30 glass border-b border-navy-700/50 px-6 py-4 transition-all">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="min-w-0 flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-navy-300 hover:text-white transition-colors bg-navy-800/50 p-2 rounded-lg"
              >
                <FiMenu size={22} />
              </button>
              <GlobalSearch />
            </div>
            <div className="text-center">
              <h1 className="text-lg md:text-xl font-bold text-white">{pageTitle}</h1>
            </div>
            <div className="flex justify-end items-center gap-2">
              <NotificationCenter />
              <Link
                to="/profile"
                className="hidden sm:flex w-10 h-10 rounded-xl bg-navy-800/70 hover:bg-navy-700 text-teal-300 border border-navy-700/70 items-center justify-center font-bold transition-colors"
                title="Profil"
              >
                {getInitials(user?.full_name)}
              </Link>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((value) => !value)}
                  className="h-10 rounded-xl bg-navy-800/70 hover:bg-navy-700 border border-navy-700/70 px-3 flex items-center gap-2 transition-colors"
                  title="Hesap"
                >
                  <span className="hidden xl:block text-left max-w-[150px]">
                    <span className="block text-white text-xs font-semibold truncate">{user?.full_name || 'KullanÄ±cÄ±'}</span>
                    <span className="block text-navy-400 text-[11px] truncate">{user?.is_premium ? 'Premium Plan' : 'Ãœcretsiz Plan'}</span>
                  </span>
                  <FiChevronDown className="text-navy-300" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-72 rounded-2xl border border-navy-700 bg-[#102334] shadow-2xl z-[140] overflow-hidden">
                    <div className="p-4 border-b border-navy-700/60">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-teal-500/20 to-blue-500/20 border border-teal-500/30 rounded-xl flex items-center justify-center text-teal-300 font-bold">
                          {getInitials(user?.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{user?.full_name || 'KullanÄ±cÄ±'}</p>
                          <p className="text-navy-400 text-xs truncate">{user?.email || ''}</p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 mt-3 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          user?.is_premium
                            ? 'bg-gradient-to-r from-teal-500/10 to-blue-500/10 text-teal-300 border border-teal-500/30'
                            : 'bg-navy-800 text-navy-300 border border-navy-700'
                        }`}
                      >
                        {user?.is_premium ? (
                          <><FiStar className="fill-current text-yellow-400" size={11}/> Premium Plan</>
                        ) : (
                          'Ãœcretsiz Plan'
                        )}
                      </span>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/billing"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-navy-200 hover:text-white hover:bg-navy-800 transition-colors"
                      >
                        <FiCreditCard /> Premium
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-navy-200 hover:text-white hover:bg-navy-800 transition-colors"
                      >
                        <FiUser /> Profil
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors"
                      >
                        <FiLogOut /> GÃ¼venli Ã‡Ä±kÄ±ÅŸ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Sayfa iÃ§eriÄŸi */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto overflow-x-hidden hide-scrollbar">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-w-[92rem] mx-auto h-full"
          >
            {children}
            {location.pathname !== '/billing' && (
              <div className="mt-8">
                <AdBanner compact />
              </div>
            )}
          </motion.div>
        </main>
      </div>
      <ChatAssistantWidget />
    </div>
  );
}

export default DashboardLayout;
