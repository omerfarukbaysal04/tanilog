import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiArrowRight, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import AnimatedHeroBackground from '../components/ui/AnimatedHeroBackground';

function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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

    if (!acceptedTerms) {
      toast.error('Devam etmek için kullanım şartları ve KVKK metnini kabul etmelisiniz.');
      return;
    }

    try {
      await register(email, password, fullName, acceptedTerms);
      toast.success('Kayıt başarılı! Giriş yapabilirsiniz.');
      navigate('/login');
    } catch (error) {
      const msg = error.response?.data?.detail || 'Kayıt başarısız.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4 py-12 relative overflow-hidden font-poppins">
      <AnimatedHeroBackground />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <img src="/logos/logo-white-text.png" alt="TanıLog Logo" className="h-16 w-auto group-hover:scale-105 transition-transform" />
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Hesap Oluşturun</h1>
          <p className="text-navy-300 text-sm">Sağlığınızı takip etmeye başlayın</p>
        </div>

        {/* Form Kartı */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-blue-500" />
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Ad Soyad */}
            <div>
              <label htmlFor="register-name" className="block text-navy-200 text-sm font-medium mb-2">
                Ad Soyad
              </label>
              <div className="relative group">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400 group-focus-within:text-teal-400 transition-colors" size={18} />
                <input
                  id="register-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="w-full bg-navy-900/60 border border-navy-600/50 rounded-xl pl-12 pr-4 py-3 text-white text-sm placeholder-navy-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* E-posta */}
            <div>
              <label htmlFor="register-email" className="block text-navy-200 text-sm font-medium mb-2">
                E-posta Adresi
              </label>
              <div className="relative group">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400 group-focus-within:text-teal-400 transition-colors" size={18} />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="w-full bg-navy-900/60 border border-navy-600/50 rounded-xl pl-12 pr-4 py-3 text-white text-sm placeholder-navy-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label htmlFor="register-password" className="block text-navy-200 text-sm font-medium mb-2">
                Şifre
              </label>
              <div className="relative group">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400 group-focus-within:text-teal-400 transition-colors" size={18} />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 8 karakter"
                  className="w-full bg-navy-900/60 border border-navy-600/50 rounded-xl pl-12 pr-12 py-3 text-white text-sm placeholder-navy-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-400 hover:text-teal-400 transition-colors"
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
              <div className="relative group">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400 group-focus-within:text-teal-400 transition-colors" size={18} />
                <input
                  id="register-confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Şifrenizi tekrar girin"
                  className="w-full bg-navy-900/60 border border-navy-600/50 rounded-xl pl-12 pr-4 py-3 text-white text-sm placeholder-navy-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all shadow-inner"
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
            <label className="flex items-start gap-3 rounded-xl border border-navy-700/60 bg-navy-900/35 p-3 text-xs text-navy-300">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-0.5 accent-teal-500"
              />
              <span>
                <Link to="/terms" className="text-teal-300 hover:text-teal-200">Kullanım Şartları</Link>,{' '}
                <Link to="/privacy" className="text-teal-300 hover:text-teal-200">Gizlilik Politikası</Link> ve{' '}
                <Link to="/kvkk" className="text-teal-300 hover:text-teal-200">KVKK Aydınlatma Metni</Link>'ni okudum, kabul ediyorum.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-shimmer bg-gradient-to-r from-teal-400 to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:shadow-teal-500/30 flex items-center justify-center gap-2 mt-4"
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
              className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
            >
              Giriş Yap
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default RegisterPage;
