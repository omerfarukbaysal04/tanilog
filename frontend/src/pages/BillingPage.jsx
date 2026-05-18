import { useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FiCheck,
  FiCreditCard,
  FiRefreshCw,
  FiShield,
  FiStar,
  FiX,
  FiZap,
} from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import useAuthStore from '../stores/authStore';
import useBillingStore from '../stores/billingStore';

const planOrder = ['free', 'monthly', 'yearly'];
const planLabels = {
  free: 'Ücretsiz',
  monthly: 'Premium Aylık',
  yearly: 'Premium Yıllık',
};

const eventLabels = {
  checkout_created: 'Ödeme hazırlığı oluşturuldu',
  subscription_cancelled: 'Abonelik iptal edildi',
  admin_plan_updated: 'Plan yönetici tarafından güncellendi',
};

const eventStatusLabels = {
  pending: 'Bekliyor',
  completed: 'Tamamlandı',
  failed: 'Başarısız',
};

const providerLabels = {
  mock: 'Test ödeme',
  admin: 'Yönetici işlemi',
};

function BillingPage() {
  const { user, fetchUser } = useAuthStore();
  const {
    plans,
    subscription,
    events,
    checkout,
    isLoading,
    fetchBilling,
    createCheckout,
    completeCheckout,
    cancelSubscription,
  } = useBillingStore();

  useEffect(() => {
    fetchBilling().catch(() => {});
  }, [fetchBilling]);

  const handleCheckout = async (plan) => {
    try {
      await createCheckout(plan);
      toast.success('Premium geçişi hazırlandı.');
    } catch {
      toast.error('Premium geçişi başlatılamadı.');
    }
  };

  const handleComplete = async () => {
    if (!checkout?.session_id) return;
    try {
      await completeCheckout(checkout.session_id);
      await fetchUser();
      toast.success('Premium abonelik aktifleştirildi.');
    } catch {
      toast.error('Ödeme tamamlanamadı.');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSubscription();
      await fetchUser();
      toast.success('Premium abonelik iptal edildi.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Abonelik iptal edilemedi.');
    }
  };

  const activePlan = subscription?.subscription_plan || user?.subscription_plan || 'free';
  const isPremium = subscription?.is_premium || user?.is_premium;

  return (
    <DashboardLayout>
      <div className="space-y-7 pb-8">
        <section className="glass rounded-3xl border border-navy-700/50 p-7 md:p-8 overflow-hidden relative">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Ödeme ve Premium</h1>
              <p className="text-navy-300 mt-3 max-w-2xl">
                Premium planını yönet, test ödeme akışını çalıştır ve reklamsız TanıLog deneyimini aç.
              </p>
            </div>
            <div className="rounded-2xl border border-navy-700 bg-navy-900/60 p-5 min-w-[240px]">
              <p className="text-navy-400 text-sm">Mevcut plan</p>
              <div className="flex items-center gap-2 mt-2 text-white text-2xl font-bold">
                {isPremium ? <FiStar className="text-yellow-300 fill-current" /> : <FiShield className="text-navy-300" />}
                {isPremium ? planLabels[activePlan] : 'Ücretsiz'}
              </div>
              <p className="text-navy-400 text-sm mt-2">
                {isPremium && subscription?.premium_until
                  ? `${subscription.days_remaining} gün kaldı`
                  : 'Reklamlı ücretsiz deneyim'}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {planOrder.map((key) => {
            const plan = plans?.[key];
            if (!plan) return <PlanSkeleton key={key} />;
            const isCurrent = activePlan === key || (!isPremium && key === 'free');
            const premiumPlan = key !== 'free';

            return (
              <article
                key={key}
                className={`rounded-3xl border p-6 flex flex-col min-h-[430px] ${
                  isCurrent
                    ? 'border-teal-400/40 bg-teal-500/10'
                    : 'border-navy-700/60 bg-navy-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-teal-300 text-xs font-semibold uppercase tracking-[0.16em]">
                      {premiumPlan ? 'Premium' : 'Başlangıç'}
                    </p>
                    <h2 className="text-white text-2xl font-bold mt-2">{planLabels[key] || plan.name}</h2>
                  </div>
                  {isCurrent && (
                    <span className="rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-200 text-xs font-semibold px-3 py-1">
                      Aktif
                    </span>
                  )}
                </div>

                <div className="mt-6">
                  <span className="text-white text-4xl font-bold">₺{plan.price}</span>
                  <span className="text-navy-400 text-sm ml-2">
                    {key === 'monthly' ? '/ ay' : key === 'yearly' ? '/ yıl' : ''}
                  </span>
                </div>

                <ul className="space-y-3 mt-7 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-navy-200 text-sm">
                      <FiCheck className="text-teal-300 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {premiumPlan ? (
                  <button
                    onClick={() => handleCheckout(key)}
                    disabled={isLoading}
                    className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-white px-4 py-3 font-bold transition-colors"
                  >
                    <FiCreditCard /> {isCurrent ? 'Planı Yenile' : 'Bu Planı Seç'}
                  </button>
                ) : (
                  <div className="mt-7 rounded-xl border border-navy-700 bg-navy-900/50 px-4 py-3 text-navy-300 text-sm">
                    Ücretsiz plan otomatik aktiftir.
                  </div>
                )}
              </article>
            );
          })}
        </section>

        {checkout && (
          <section className="rounded-3xl border border-teal-500/30 bg-teal-500/10 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-teal-200 font-semibold">
                <FiZap /> Premium geçişi hazır
              </div>
              <p className="text-white font-bold text-xl mt-2">
                {planLabels[checkout.plan]} için ₺{checkout.amount} test ödeme
              </p>
              <p className="text-navy-300 text-sm mt-1">
                Bu demo akışında gerçek kart bilgisi alınmaz. Butona basınca premium hesabın aktifleşir.
              </p>
            </div>
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="rounded-xl bg-white text-navy-900 hover:bg-navy-100 disabled:opacity-60 px-5 py-3 font-bold transition-colors"
            >
              Test Ödemeyi Tamamla
            </button>
          </section>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="glass rounded-3xl border border-navy-700/50 p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-white text-xl font-bold">Abonelik durumu</h2>
                <p className="text-navy-400 text-sm">Plan, reklam ve premium erişim özeti.</p>
              </div>
              <button
                onClick={() => fetchBilling()}
                className="w-10 h-10 rounded-xl border border-navy-700 bg-navy-800 text-navy-200 hover:text-white flex items-center justify-center"
                title="Yenile"
              >
                <FiRefreshCw />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatusPill label="Premium" value={isPremium ? 'Aktif' : 'Kapalı'} positive={isPremium} />
              <StatusPill label="Reklam" value={isPremium ? 'Yok' : 'Gösterilir'} positive={isPremium} />
              <StatusPill label="Plan" value={planLabels[activePlan] || 'Ücretsiz'} positive={isPremium} />
              <StatusPill
                label="Bitiş"
                value={subscription?.premium_until ? new Date(subscription.premium_until).toLocaleDateString('tr-TR') : '-'}
                positive={isPremium}
              />
            </div>
            {isPremium && (
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 hover:bg-red-500/15 text-red-200 px-4 py-3 font-semibold transition-colors"
              >
                <FiX /> Test Aboneliğini İptal Et
              </button>
            )}
          </div>

          <div className="glass rounded-3xl border border-navy-700/50 p-6">
            <h2 className="text-white text-xl font-bold mb-1">İşlem geçmişi</h2>
            <p className="text-navy-400 text-sm mb-5">Son test ödeme ve abonelik hareketleri.</p>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-navy-700 text-navy-400 text-sm p-6 text-center">
                  Henüz ödeme hareketi yok.
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-navy-700 bg-navy-900/45 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-white font-semibold">{eventLabels[event.event_type] || event.event_type}</p>
                        <p className="text-navy-400 text-xs mt-1">
                          {planLabels[event.plan] || event.plan} - {providerLabels[event.provider] || event.provider}
                        </p>
                      </div>
                      <span className="text-xs font-semibold rounded-full border border-teal-500/20 text-teal-200 px-2.5 py-1">
                        {eventStatusLabels[event.status] || event.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function StatusPill({ label, value, positive }) {
  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900/45 p-4">
      <p className="text-navy-400 text-xs">{label}</p>
      <p className={`font-bold mt-1 ${positive ? 'text-teal-200' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function PlanSkeleton() {
  return <div className="rounded-3xl border border-navy-700/60 bg-navy-800/40 min-h-[430px] animate-pulse" />;
}

export default BillingPage;
