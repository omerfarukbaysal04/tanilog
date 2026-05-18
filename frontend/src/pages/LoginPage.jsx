import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import AnimatedHeroBackground from '../components/ui/AnimatedHeroBackground';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      await login(email, password);
      toast.success('Giriş başarılı! Yönlendiriliyorsunuz...');
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.detail || 'Giriş başarısız.';
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
          <h1 className="text-2xl font-bold text-white mb-2">Tekrar Hoş Geldiniz</h1>
          <p className="text-navy-300 text-sm">Hesabınıza giriş yapın</p>
        </div>

        {/* Form Kartı */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-blue-500" />
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* E-posta */}
            <div>
              <label htmlFor="login-email" className="block text-navy-200 text-sm font-medium mb-2">
                E-posta Adresi
              </label>
              <div className="relative group">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400 group-focus-within:text-teal-400 transition-colors" size={18} />
                <input
                  id="login-email"
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
              <label htmlFor="login-password" className="block text-navy-200 text-sm font-medium mb-2">
                Şifre
              </label>
              <div className="relative group">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400 group-focus-within:text-teal-400 transition-colors" size={18} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            {/* Giriş butonu */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-shimmer bg-gradient-to-r from-teal-400 to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:shadow-teal-500/30 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Giriş Yap
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

          {/* Kayıt linki */}
          <p className="text-center text-navy-300 text-sm">
            Hesabınız yok mu?{' '}
            <Link
              to="/register"
              className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
            >
              Ücretsiz Kayıt Ol
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
