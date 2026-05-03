import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiUser,
  FiMenu,
  FiX,
  FiLogOut,
  FiActivity,
  FiFileText,
  FiSettings,
} from 'react-icons/fi';
import useAuthStore from '../stores/authStore';

const navItems = [
  { icon: <FiHome size={20} />, label: 'Dashboard', path: '/dashboard' },
  { icon: <FiActivity size={20} />, label: 'Sağlık Takibi', path: '/health', badge: 'Yakında' },
  { icon: <FiFileText size={20} />, label: 'Belgelerim', path: '/documents', badge: 'Yakında' },
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
    <div className="min-h-screen bg-navy-900 flex">
      {/* Mobil overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-navy-800/80 backdrop-blur-xl border-r border-navy-700/50 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-navy-700/50">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              Tanı<span className="text-teal-500">Log</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-navy-400 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigasyon */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                    : isDisabled
                    ? 'text-navy-500 cursor-not-allowed'
                    : 'text-navy-300 hover:text-white hover:bg-navy-700/50'
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] bg-navy-700 text-navy-400 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Kullanıcı bilgi & çıkış */}
        <div className="border-t border-navy-700/50 p-4">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-400 text-sm font-semibold">
              {getInitials(user?.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.full_name || 'Kullanıcı'}</p>
              <p className="text-navy-400 text-xs truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
          >
            <FiLogOut size={18} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Ana içerik */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Üst header */}
        <header className="sticky top-0 z-30 bg-navy-900/80 backdrop-blur-xl border-b border-navy-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-navy-300 hover:text-white transition-colors"
            >
              <FiMenu size={22} />
            </button>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    user?.is_premium
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                      : 'bg-navy-700/50 text-navy-400 border border-navy-600/50'
                  }`}
                >
                  {user?.is_premium ? '⭐ Premium' : 'Ücretsiz'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Sayfa içeriği */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
