import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiBell,
  FiClock,
  FiCpu,
  FiDownload,
  FiLock,
  FiRefreshCw,
  FiSave,
  FiSettings,
  FiShield,
  FiStar,
  FiTrash2,
  FiUser,
} from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import useAuthStore from '../stores/authStore';
import useSettingsStore from '../stores/settingsStore';

const defaultSettings = {
  notifications_enabled: true,
  voice_notifications_enabled: false,
  medication_reminders_enabled: true,
  family_invite_notifications_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '23:00',
  quiet_hours_end: '08:00',
  ai_use_health_records: true,
  ai_use_documents: true,
  ai_use_doctor_reports: true,
  ai_use_profile: true,
  birth_year: '',
  biological_sex: '',
  height_cm: '',
  weight_kg: '',
  blood_type: '',
  chronic_conditions: '',
  allergies: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
};

function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { settings, isLoading, isSaving, fetchSettings, updateSettings, exportAccountData, deleteAccount } = useSettingsStore();
  const [form, setForm] = useState(defaultSettings);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    fetchSettings().catch((error) => toast.error(error.message));
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setForm({
        ...defaultSettings,
        ...settings,
        birth_year: settings.birth_year ?? '',
        height_cm: settings.height_cm ?? '',
        weight_kg: settings.weight_kg ?? '',
        quiet_hours_start: settings.quiet_hours_start || '23:00',
        quiet_hours_end: settings.quiet_hours_end || '08:00',
      });
    }
  }, [settings]);

  const setValue = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    const payload = {
      ...form,
      birth_year: form.birth_year ? Number(form.birth_year) : null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      quiet_hours_start: form.quiet_hours_enabled ? form.quiet_hours_start : null,
      quiet_hours_end: form.quiet_hours_enabled ? form.quiet_hours_end : null,
    };

    try {
      await updateSettings(payload);
      toast.success('Ayarlar kaydedildi.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      toast.error('Bu tarayıcı bildirim desteklemiyor.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') toast.success('Bildirim izni verildi.');
    else toast.error('Bildirim izni kapalı.');
  };

  const handleExport = async () => {
    try {
      const data = await exportAccountData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tanilog-veri-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Veri dosyası hazırlandı.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Veriler dışa aktarılamadı.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount(deletePassword, deleteConfirmation);
      toast.success('Hesap silindi.');
      logout();
      window.location.href = '/';
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Hesap silinemedi.');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[92rem] mx-auto space-y-6 pb-10">
        <section className="glass rounded-3xl border border-navy-700/50 p-7 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/25 bg-teal-500/10 text-teal-200 px-3 py-1 text-xs font-semibold mb-4">
                <FiSettings /> Ara Faz
              </div>
              <h1 className="text-white text-3xl font-bold">Ayarlar</h1>
              <p className="text-navy-300 mt-2 max-w-2xl">
                Bildirimleri, AI veri izinlerini ve sağlık profilini tek yerden yönet.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-white px-5 py-3 font-bold transition-colors"
            >
              {isSaving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
              Kaydet
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.9fr] gap-6">
          <div className="space-y-6">
            <SettingsSection icon={<FiBell />} title="Bildirim Ayarları" description="İlaç, davet ve sesli hatırlatma tercihleri.">
              <Toggle label="Tarayıcı bildirimleri" checked={form.notifications_enabled} onChange={(value) => setValue('notifications_enabled', value)} />
              <Toggle label="Sesli bildirimler" checked={form.voice_notifications_enabled} onChange={(value) => setValue('voice_notifications_enabled', value)} />
              <Toggle label="İlaç hatırlatmaları" checked={form.medication_reminders_enabled} onChange={(value) => setValue('medication_reminders_enabled', value)} />
              <Toggle label="Aile daveti bildirimleri" checked={form.family_invite_notifications_enabled} onChange={(value) => setValue('family_invite_notifications_enabled', value)} />
              <Toggle label="Sessiz saatler" checked={form.quiet_hours_enabled} onChange={(value) => setValue('quiet_hours_enabled', value)} />
              {form.quiet_hours_enabled && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Başlangıç" type="time" value={form.quiet_hours_start} onChange={(value) => setValue('quiet_hours_start', value)} />
                  <Field label="Bitiş" type="time" value={form.quiet_hours_end} onChange={(value) => setValue('quiet_hours_end', value)} />
                </div>
              )}
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-navy-700 bg-navy-800 hover:bg-navy-700 text-navy-100 px-4 py-2.5 text-sm font-semibold transition-colors"
              >
                <FiBell /> Bildirim iznini test et
              </button>
            </SettingsSection>

            <SettingsSection icon={<FiCpu />} title="AI ve Veri Kullanımı" description="Asistan ve raporlar hangi verileri bağlam olarak kullanabilir?">
              <Toggle label="Sağlık kayıtlarım AI bağlamına dahil olsun" checked={form.ai_use_health_records} onChange={(value) => setValue('ai_use_health_records', value)} />
              <Toggle label="Belgelerim ve analizlerim kullanılsın" checked={form.ai_use_documents} onChange={(value) => setValue('ai_use_documents', value)} />
              <Toggle label="Kayıtlı doktor raporları kullanılsın" checked={form.ai_use_doctor_reports} onChange={(value) => setValue('ai_use_doctor_reports', value)} />
              <Toggle label="Sağlık profilim AI bağlamına dahil olsun" checked={form.ai_use_profile} onChange={(value) => setValue('ai_use_profile', value)} />
            </SettingsSection>

            <SettingsSection icon={<FiUser />} title="Sağlık Profili" description="AI yorumlarının daha anlamlı olması için temel sağlık bilgileri.">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Doğum yılı" type="number" value={form.birth_year} onChange={(value) => setValue('birth_year', value)} />
                <Select label="Biyolojik cinsiyet" value={form.biological_sex || ''} onChange={(value) => setValue('biological_sex', value)}>
                  <option value="">Belirtmek istemiyorum</option>
                  <option value="female">Kadın</option>
                  <option value="male">Erkek</option>
                  <option value="other">Diğer</option>
                </Select>
                <Field label="Boy (cm)" type="number" value={form.height_cm} onChange={(value) => setValue('height_cm', value)} />
                <Field label="Kilo (kg)" type="number" value={form.weight_kg} onChange={(value) => setValue('weight_kg', value)} />
                <Select label="Kan grubu" value={form.blood_type || ''} onChange={(value) => setValue('blood_type', value)}>
                  <option value="">Bilinmiyor</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
              </div>
              <TextArea label="Kronik hastalıklar" value={form.chronic_conditions || ''} onChange={(value) => setValue('chronic_conditions', value)} />
              <TextArea label="Alerjiler" value={form.allergies || ''} onChange={(value) => setValue('allergies', value)} />
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Acil kişi" value={form.emergency_contact_name || ''} onChange={(value) => setValue('emergency_contact_name', value)} />
                <Field label="Acil telefon" value={form.emergency_contact_phone || ''} onChange={(value) => setValue('emergency_contact_phone', value)} />
              </div>
            </SettingsSection>
          </div>

          <aside className="space-y-6">
            <SettingsSection icon={<FiShield />} title="Gizlilik ve Güvenlik" description="Hesap güvenliği ve veri aksiyonları.">
              <Link to="/profile" className="flex items-center gap-2 rounded-xl border border-navy-700 bg-navy-900/45 px-4 py-3 text-sm font-semibold text-navy-100 hover:bg-navy-800 transition-colors">
                <FiLock /> Şifre değiştir
              </Link>
              <button type="button" onClick={handleExport} className="flex w-full items-center gap-2 rounded-xl border border-navy-700 bg-navy-900/45 px-4 py-3 text-sm font-semibold text-navy-100 hover:bg-navy-800 transition-colors">
                <FiDownload /> Verilerimi dışa aktar
              </button>
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 space-y-3">
                <div className="flex items-center gap-2 text-red-200 font-semibold text-sm">
                  <FiTrash2 /> Hesabımı sil
                </div>
                <p className="text-red-100/80 text-xs">Kalıcı silme için şifreni ve HESABIMI SIL onay metnini gir.</p>
                <Field label="Şifre" type="password" value={deletePassword} onChange={setDeletePassword} />
                <Field label="Onay metni" value={deleteConfirmation} onChange={setDeleteConfirmation} />
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={!deletePassword || deleteConfirmation.trim().toUpperCase() !== 'HESABIMI SIL'}
                  className="w-full rounded-xl bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-100 px-4 py-3 text-sm font-bold transition-colors"
                >
                  Hesabımı kalıcı sil
                </button>
              </div>
            </SettingsSection>

            <SettingsSection icon={<FiStar />} title="Premium ve Abonelik" description="Plan bilgisi ve ödeme sayfası.">
              <div className="rounded-2xl border border-navy-700 bg-navy-900/45 p-4">
                <p className="text-navy-400 text-sm">Mevcut plan</p>
                <p className="text-white font-bold text-xl mt-1">{user?.is_premium ? 'Premium' : 'Ücretsiz'}</p>
              </div>
              <Link to="/billing" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white px-4 py-3 font-bold transition-colors">
                <FiStar /> Premium sayfasına git
              </Link>
            </SettingsSection>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm text-blue-100">
              <div className="flex items-start gap-3">
                <FiClock className="mt-0.5 shrink-0" />
                <p>
                  Sessiz saatler ve AI veri izinleri kaydedilir. AI servisleri yalnızca izin verdiğin veri bağlamını kullanır.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SettingsSection({ icon, title, description, children }) {
  return (
    <section className="glass rounded-2xl border border-navy-700/50 p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-300 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h2 className="text-white text-xl font-bold">{title}</h2>
          <p className="text-navy-400 text-sm mt-1">{description}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-navy-700 bg-navy-900/35 p-4">
      <span className="text-navy-100 text-sm font-medium">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors ${checked ? 'bg-teal-500' : 'bg-navy-700'}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </label>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-sm text-navy-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full bg-navy-900/50 border border-navy-700 rounded-xl px-4 py-3 text-white placeholder-navy-500 focus:outline-none focus:border-teal-500 transition-colors"
      />
    </label>
  );
}

function Select({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="text-sm text-navy-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full bg-navy-900/50 border border-navy-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
      >
        {children}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm text-navy-300">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-[7rem] w-full resize-none bg-navy-900/50 border border-navy-700 rounded-xl px-4 py-3 text-white placeholder-navy-500 focus:outline-none focus:border-teal-500 transition-colors"
      />
    </label>
  );
}

export default SettingsPage;
