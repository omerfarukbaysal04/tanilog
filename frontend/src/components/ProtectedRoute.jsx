import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

/**
 * Korumalı route bileşeni.
 * Giriş yapmamış kullanıcıları /login'e yönlendirir.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, user, isLoading, fetchUser } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Token varsa ama kullanıcı bilgisi yoksa, bilgiyi çek
    if (isAuthenticated && !user) {
      fetchUser();
    }
  }, [isAuthenticated, user, fetchUser]);

  // Yükleniyor durumu
  if (isAuthenticated && !user && isLoading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-navy-300 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Giriş yapmamışsa login'e yönlendir
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
