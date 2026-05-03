import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiArrowRight, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';

function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const passwordChecks = [
    { label: 'En az 8 karakter', valid: password.length >= 8 },
    { label: 'Şifreler eşleşiyor', valid: password && confirmPassword && password === confirmPassword },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Lütfen tüm alanları doldurun.');
      return;
    }

    if (password.length < 8) {
      toast.error('Şifre en az 8 karakter olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor.');
      return;
    }

    try {
      await register(email, password, fullName);
      toast.success('Kayıt başarılı! Giriş yapabilirsiniz.');
      navigate('/login');
    } catch (error) {
      const msg = error.response?.data?.detail || 'Kayıt başarısız.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center px-4 py-12">
      {/* Arka plan efektleri */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-teal-500/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-11 h-11 bg-teal-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-white font-semibold text-2xl tracking-tight">
              Tanı<span className="text-teal-500">Log</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Hesap Oluşturun</h1>
          <p className="text-navy-300 text-sm">Sağlığınızı takip etmeye başlayın</p>
        </div>

        {/* Form Kartı */}
        <div className="bg-navy-800/60 backdrop-blur-xl border border-navy-700/50 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Ad Soyad */}
            <div>
              <label htmlFor="register-name" className="block text-navy-200 text-sm font-medium mb-2">
                Ad Soyad
              </label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" size={18} />
                <input
                  id="register-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="w-full bg-navy-900/60 border border-navy-600/50 rounded-xl pl-12 pr-4 py-3 text-white text-sm placeholder-navy-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                />
              </div>
            </div>

            {/* E-posta */}
            <div>
              <label htmlFor="register-email" className="block text-navy-200 text-sm font-medium mb-2">
                E-posta Adresi
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" size={18} />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="w-full bg-navy-900/60 border border-navy-600/50 rounded-xl pl-12 pr-4 py-3 text-white text-sm placeholder-navy-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label htmlFor="register-password" className="block text-navy-200 text-sm font-medium mb-2">
                Şifre
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" size={18} />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 8 karakter"
                  className="w-full bg-navy-900/60 border border-navy-600/50 rounded-xl pl-12 pr-12 py-3 text-white text-sm placeholder-navy-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-200 transition-colors"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Şifre Tekrar */}
            <div>
              <label htmlFor="register-confirm" className="block text-navy-200 text-sm font-medium mb-2">
                Şifre Tekrar
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" size={18} />
                <input
                  id="register-confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Şifrenizi tekrar girin"
                  className="w-full bg-navy-900/60 border border-navy-600/50 rounded-xl pl-12 pr-4 py-3 text-white text-sm placeholder-navy-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                />
              </div>
            </div>

            {/* Şifre kontrol listesi */}
            <div className="space-y-2">
              {passwordChecks.map((check, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <FiCheck
                    size={14}
                    className={check.valid ? 'text-teal-400' : 'text-navy-600'}
                  />
                  <span className={check.valid ? 'text-teal-400' : 'text-navy-500'}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Kayıt butonu */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-teal-500/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Kayıt Ol
                  <FiArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Ayırıcı */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-navy-700/50" />
            <span className="text-navy-500 text-xs">veya</span>
            <div className="flex-1 h-px bg-navy-700/50" />
          </div>

          {/* Giriş linki */}
          <p className="text-center text-navy-300 text-sm">
            Zaten hesabınız var mı?{' '}
            <Link
              to="/login"
              className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
            >
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
