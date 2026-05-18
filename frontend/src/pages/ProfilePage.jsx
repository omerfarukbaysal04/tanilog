import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiCalendar, FiShield, FiLock, FiCheck, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import DashboardLayout from '../components/DashboardLayout';

function ProfilePage() {
  const { user, fetchUser, updateProfile, changePassword, isLoading } = useAuthStore();

  // Profil düzenleme
  const [fullName, setFullName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Şifre değiştirme
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (!user) fetchUser();
  }, [user, fetchUser]);

  useEffect(() => {
    if (user) setFullName(user.full_name);
  }, [user]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!fullName || fullName.length < 2) {
      toast.error('Ad soyad en az 2 karakter olmalıdır.');
      return;
    }

    try {
      await updateProfile(fullName);
      toast.success('Profil güncellendi!');
      setIsEditingName(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Güncelleme başarısız.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error('Lütfen tüm alanları doldurun.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Yeni şifre en az 8 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Yeni şifreler eşleşmiyor.');
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Şifre başarıyla değiştirildi!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordSection(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Şifre değiştirme başarısız.');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Sayfa başlığı */}
        <div>
          <h1 className="text-2xl font-bold text-white">Profil</h1>
          <p className="text-navy-400 text-sm mt-1">Hesap bilgilerinizi yönetin</p>
        </div>

        {/* Profil kartı */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 relative z-10">
            {/* Avatar */}
            <div className="w-20 h-20 bg-teal-500/20 rounded-2xl flex items-center justify-center text-teal-400 text-2xl font-bold">
              {getInitials(user?.full_name)}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold text-white">{user?.full_name || 'Kullanıcı'}</h2>
              <p className="text-navy-400 text-sm">{user?.email || ''}</p>
              <span
                className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${
                  user?.is_premium
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                    : 'bg-navy-700/50 text-navy-400 border border-navy-600/50'
                }`}
              >
                {user?.is_premium ? '⭐ Premium' : '📋 Ücretsiz Plan'}
              </span>
            </div>
          </div>

          {/* Bilgi alanları */}
          <div className="space-y-6">
            {/* Ad Soyad */}
            <div className="border-b border-navy-700/30 pb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-navy-300 text-sm">
                  <FiUser size={16} />
                  <span>Ad Soyad</span>
                </div>
                {!isEditingName && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-teal-400 text-sm hover:text-teal-300 transition-colors"
                  >
                    Düzenle
                  </button>
                )}
              </div>
              {isEditingName ? (
                <form onSubmit={handleUpdateName} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="flex-1 bg-navy-900/60 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5"
                  >
                    <FiSave size={14} />
                    Kaydet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setFullName(user?.full_name || '');
                    }}
                    className="text-navy-400 hover:text-navy-200 px-3 py-2.5 text-sm transition-colors"
                  >
                    İptal
                  </button>
                </form>
              ) : (
                <p className="text-white font-medium">{user?.full_name || '—'}</p>
              )}
            </div>

            {/* E-posta */}
            <div className="border-b border-navy-700/30 pb-6">
              <div className="flex items-center gap-2 text-navy-300 text-sm mb-3">
                <FiMail size={16} />
                <span>E-posta Adresi</span>
              </div>
              <p className="text-white font-medium">{user?.email || '—'}</p>
            </div>

            {/* Üyelik tarihi */}
            <div className="border-b border-navy-700/30 pb-6">
              <div className="flex items-center gap-2 text-navy-300 text-sm mb-3">
                <FiCalendar size={16} />
                <span>Üyelik Tarihi</span>
              </div>
              <p className="text-white font-medium">{formatDate(user?.created_at)}</p>
            </div>

            {/* Plan bilgisi */}
            <div>
              <div className="flex items-center gap-2 text-navy-300 text-sm mb-3">
                <FiShield size={16} />
                <span>Abonelik Planı</span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-white font-medium">
                  {user?.subscription_plan === 'monthly'
                    ? 'Premium Aylık'
                    : user?.subscription_plan === 'yearly'
                    ? 'Premium Yıllık'
                    : 'Ücretsiz'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Şifre değiştirme */}
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-navy-700/50 rounded-xl flex items-center justify-center text-navy-300">
                <FiLock size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold">Şifre Değiştir</h3>
                <p className="text-navy-400 text-xs">Hesabınızın güvenliğini güncel tutun</p>
              </div>
            </div>
            {!showPasswordSection && (
              <button
                onClick={() => setShowPasswordSection(true)}
                className="text-teal-400 text-sm hover:text-teal-300 transition-colors"
              >
                Değiştir
              </button>
            )}
          </div>

          {showPasswordSection && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-navy-300 text-sm mb-2">Mevcut Şifre</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-navy-900/60 border border-navy-600/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all shadow-inner"
                  placeholder="Mevcut şifreniz"
                />
              </div>
              <div>
                <label className="block text-navy-300 text-sm mb-2">Yeni Şifre</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-navy-900/60 border border-navy-600/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all shadow-inner"
                  placeholder="En az 8 karakter"
                />
              </div>
              <div>
                <label className="block text-navy-300 text-sm mb-2">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full bg-navy-900/60 border border-navy-600/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all shadow-inner"
                  placeholder="Yeni şifrenizi tekrar girin"
                />
              </div>

              {/* Şifre kontrol */}
              <div className="space-y-1.5">
                {[
                  { label: 'En az 8 karakter', valid: newPassword.length >= 8 },
                  {
                    label: 'Şifreler eşleşiyor',
                    valid: newPassword && confirmNewPassword && newPassword === confirmNewPassword,
                  },
                ].map((check, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <FiCheck size={13} className={check.valid ? 'text-teal-400' : 'text-navy-600'} />
                    <span className={check.valid ? 'text-teal-400' : 'text-navy-500'}>{check.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiSave size={14} />
                  )}
                  Şifreyi Güncelle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSection(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                  className="text-navy-400 hover:text-navy-200 px-4 py-2.5 text-sm transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ProfilePage;
