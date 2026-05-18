import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiShield, FiStar, FiUsers } from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import useAdminStore from '../stores/adminStore';
import useAuthStore from '../stores/authStore';

const planLabels = {
  free: 'Ücretsiz',
  monthly: 'Premium Aylık',
  yearly: 'Premium Yıllık',
};

function AdminPage() {
  const { user } = useAuthStore();
  const { overview, users, auditLogs, isLoading, fetchAdminData, updatePremium, updateAdmin } = useAdminStore();

  useEffect(() => {
    fetchAdminData().catch((error) => toast.error(error.message));
  }, [fetchAdminData]);

  if (user && !user.is_admin) return <Navigate to="/dashboard" replace />;

  const handlePremium = async (targetUser, plan) => {
    try {
      await updatePremium(targetUser.id, plan);
      toast.success('Plan güncellendi.');
      fetchAdminData().catch(() => {});
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Plan güncellenemedi.');
    }
  };

  const handleAdmin = async (targetUser) => {
    try {
      await updateAdmin(targetUser.id, !targetUser.is_admin);
      toast.success('Admin yetkisi güncellendi.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Admin yetkisi güncellenemedi.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        <section className="glass rounded-3xl border border-navy-700/50 p-7 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/25 bg-teal-500/10 text-teal-200 px-3 py-1 text-xs font-semibold mb-4">
                <FiShield /> Yönetici
              </div>
              <h1 className="text-3xl font-bold text-white">Admin Paneli</h1>
              <p className="text-navy-300 mt-2">Kullanıcı, premium ve sistem özetini hızlı kontrol et.</p>
            </div>
            <button
              onClick={() => fetchAdminData().catch((error) => toast.error(error.message))}
              className="inline-flex items-center gap-2 rounded-xl border border-navy-700 bg-navy-800 px-4 py-3 text-sm font-bold text-navy-100 hover:bg-navy-700"
            >
              <FiRefreshCw className={isLoading ? 'animate-spin' : ''} /> Yenile
            </button>
          </div>
        </section>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Metric label="Kullanıcı" value={overview?.users || 0} icon={<FiUsers />} />
          <Metric label="Premium" value={overview?.premium_users || 0} icon={<FiStar />} />
          <Metric label="AI Analiz" value={overview?.ai_analyses || 0} icon={<FiShield />} />
          <Metric label="Sağlık Kaydı" value={overview?.health_records || 0} icon={<FiRefreshCw />} />
        </div>

        <section className="glass rounded-2xl border border-navy-700/50 p-5 overflow-hidden">
          <h2 className="text-xl font-bold text-white mb-4">Kullanıcılar</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-navy-400">
                <tr className="border-b border-navy-700">
                  <th className="text-left py-3 px-3">Kullanıcı</th>
                  <th className="text-left py-3 px-3">Plan</th>
                  <th className="text-left py-3 px-3">Yetki</th>
                  <th className="text-right py-3 px-3">Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} className="border-b border-navy-800/80">
                    <td className="py-4 px-3">
                      <p className="text-white font-semibold">{item.full_name}</p>
                      <p className="text-navy-400 text-xs">{item.email}</p>
                    </td>
                    <td className="py-4 px-3 text-navy-200">{item.is_premium ? planLabels[item.subscription_plan] || item.subscription_plan : 'Ücretsiz'}</td>
                    <td className="py-4 px-3 text-navy-200">{item.is_admin ? 'admin' : 'user'}</td>
                    <td className="py-4 px-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handlePremium(item, item.is_premium ? 'free' : 'monthly')} className="rounded-lg bg-teal-500/15 text-teal-200 px-3 py-2 font-semibold hover:bg-teal-500/25">
                          {item.is_premium ? 'Ücretsiz yap' : 'Premium yap'}
                        </button>
                        <button onClick={() => handleAdmin(item)} className="rounded-lg bg-blue-500/15 text-blue-200 px-3 py-2 font-semibold hover:bg-blue-500/25">
                          {item.is_admin ? 'Admin kaldır' : 'Admin yap'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="glass rounded-2xl border border-navy-700/50 p-5 overflow-hidden">
          <h2 className="text-xl font-bold text-white mb-4">Audit Log</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto hide-scrollbar">
            {(auditLogs || []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-navy-700 p-5 text-navy-400 text-sm text-center">Henüz admin aksiyonu yok.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="rounded-xl border border-navy-700/60 bg-navy-900/35 p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="text-white font-semibold">{log.action}</p>
                      <p className="text-navy-400 text-sm">Admin: {log.admin_name || log.admin_user_id} · Hedef: {log.target_name || log.target_user_id}</p>
                    </div>
                    <p className="text-navy-500 text-xs">{new Date(log.created_at).toLocaleString('tr-TR')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function Metric({ label, value, icon }) {
  return (
    <div className="glass-card rounded-2xl border border-navy-700/50 p-5">
      <div className="w-11 h-11 rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-300 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-navy-400 text-sm">{label}</p>
      <p className="text-white text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

export default AdminPage;
