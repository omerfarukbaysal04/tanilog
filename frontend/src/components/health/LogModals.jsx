import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export function ModalContainer({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
          />
          <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`bg-navy-800 border border-navy-700 rounded-2xl w-full ${maxWidth} max-h-[90vh] pointer-events-auto overflow-hidden shadow-2xl flex flex-col`}
            >
              <div className="flex items-center justify-between p-5 border-b border-navy-700/50">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <button onClick={onClose} className="text-navy-400 hover:text-white transition-colors p-1">
                  <FiX size={20} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}

export function SymptomModal({ isOpen, onClose, onSave, selectedDate }) {
  const [name, setName] = useState('');
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return toast.error('Semptom adı gerekli');

    setIsSubmitting(true);
    try {
      await onSave({
        date: selectedDate,
        symptom_name: name,
        severity: Number(severity),
        notes: notes || null,
      });
      toast.success('Semptom eklendi');
      onClose();
      setName('');
      setSeverity(5);
      setNotes('');
    } catch {
      toast.error('Eklenemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} title="Semptom Ekle">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-navy-300 text-sm mb-1.5">Semptom Adı</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Baş ağrısı"
            className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-navy-300 text-sm mb-1.5">
            Şiddet (1-10): <span className="text-teal-400 font-semibold">{severity}</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full accent-teal-500"
          />
        </div>
        <div>
          <label className="block text-navy-300 text-sm mb-1.5">Notlar</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            placeholder="Ekstra detaylar..."
            className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none resize-none"
          />
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-medium transition-colors">
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </ModalContainer>
  );
}

export function MedicationModal({ isOpen, onClose, onSave, onScan, selectedDate }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [notes, setNotes] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [aiScanSummary, setAiScanSummary] = useState(null);
  const [aiScanDetails, setAiScanDetails] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setDosage('');
    setTime('');
    setReminderEnabled(false);
    setReminderTime('');
    setNotes('');
    setScanResult(null);
    setImageDataUrl(null);
    setAiScanSummary(null);
    setAiScanDetails(null);
  };

  const fillFromCandidate = (candidate) => {
    setName(candidate.name || '');
    setDosage(candidate.dosage || '');
    setTime(candidate.suggested_time || '');
    setReminderEnabled(!!candidate.suggested_time);
    setReminderTime(candidate.suggested_time || '');
    setAiScanSummary(scanResult?.summary || null);
    setAiScanDetails(JSON.stringify({ candidate, warnings: scanResult?.warnings || [] }, null, 2));
    setNotes([candidate.usage, candidate.notes, candidate.barcode ? `Barkod: ${candidate.barcode}` : null].filter(Boolean).join(' | '));
    toast.success('AI aday bilgileri forma aktarıldı');
  };

  const readImagePreview = (file) => new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

  const handleScan = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onScan) return;

    setIsScanning(true);
    setScanResult(null);
    setImageDataUrl(await readImagePreview(file));
    try {
      const result = await onScan(file);
      setScanResult(result);
      if (!result.medications?.length) {
        toast.error('Dosyada ilaç adayı bulunamadı');
      } else {
        toast.success(`${result.medications.length} ilaç adayı bulundu`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'AI tarama başarısız oldu');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !dosage) return toast.error('İlaç adı ve dozu gerekli');

    setIsSubmitting(true);
    try {
      await onSave({
        date: selectedDate,
        name,
        dosage,
        time_taken: time || null,
        reminder_enabled: reminderEnabled,
        reminder_time: reminderEnabled ? (reminderTime || time || null) : null,
        notes: notes || null,
        image_data_url: imageDataUrl,
        ai_scan_summary: aiScanSummary,
        ai_scan_details: aiScanDetails,
      });
      toast.success('İlaç eklendi');
      onClose();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Eklenemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} title="İlaç Ekle">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-white text-sm font-semibold">AI ile reçete/kutu tara</h4>
              <p className="text-navy-300 text-xs mt-1">
                PDF, JPG veya PNG yükle; AI ilaç adaylarını çıkarır, sen seçip forma aktarırsın.
              </p>
            </div>
            <label className="shrink-0 bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
              {isScanning ? 'Taranıyor...' : 'Dosya Seç'}
              <input type="file" accept="image/png,image/jpeg,application/pdf" onChange={handleScan} disabled={isScanning} className="hidden" />
            </label>
          </div>

          {scanResult && (
            <div className="mt-4 space-y-3">
              <p className="text-navy-300 text-xs">{scanResult.summary}</p>
              {scanResult.medications?.map((candidate, index) => (
                <button
                  key={`${candidate.name}-${index}`}
                  type="button"
                  onClick={() => fillFromCandidate(candidate)}
                  className="w-full text-left rounded-lg bg-navy-900/60 border border-navy-700/60 p-3 hover:border-teal-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white text-sm font-semibold">{candidate.name || 'İlaç adı okunamadı'}</p>
                      <p className="text-navy-300 text-xs mt-1">{candidate.dosage || 'Doz bilgisi yok'}</p>
                      {(candidate.usage || candidate.notes) && (
                        <p className="text-navy-400 text-xs mt-1">{[candidate.usage, candidate.notes].filter(Boolean).join(' | ')}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-teal-300 bg-teal-500/10 px-2 py-1 rounded-full">
                      %{Math.round((candidate.confidence || 0) * 100)}
                    </span>
                  </div>
                </button>
              ))}
              {scanResult.warnings?.length > 0 && (
                <div className="text-xs text-yellow-200/90 space-y-1">
                  {scanResult.warnings.map((warning, index) => (
                    <p key={index}>• {warning}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-navy-300 text-sm mb-1.5">İlaç Adı</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Parol"
            className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-navy-300 text-sm mb-1.5">Dozaj</label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="Örn: 500mg"
              className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-navy-300 text-sm mb-1.5">Alınma Saati</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none [color-scheme:dark]"
            />
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-xl bg-navy-900/40 border border-navy-700/50 p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
            className="mt-1 accent-teal-500"
          />
          <span>
            <span className="block text-white text-sm font-medium">Hatırlatma aktif</span>
            <span className="block text-navy-400 text-xs mt-1">Uygulama açıkken tarayıcı bildirimi gönderilir.</span>
          </span>
        </label>
        {reminderEnabled && (
          <div>
            <label className="block text-navy-300 text-sm mb-1.5">Hatırlatma Saati</label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none [color-scheme:dark]"
            />
          </div>
        )}
        <div>
          <label className="block text-navy-300 text-sm mb-1.5">Notlar</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tok karnına vb."
            className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-medium transition-colors">
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </ModalContainer>
  );
}

export function SleepModal({ isOpen, onClose, onSave, selectedDate }) {
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState('good');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hours) return toast.error('Uyku süresi gerekli');

    setIsSubmitting(true);
    try {
      await onSave({
        date: selectedDate,
        hours_slept: parseFloat(hours),
        quality,
        notes: notes || null,
      });
      toast.success('Uyku eklendi');
      onClose();
      setHours('');
      setQuality('good');
      setNotes('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Eklenemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} title="Uyku Kaydı">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-navy-300 text-sm mb-1.5">Uyku Süresi (Saat)</label>
          <input
            type="number"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Örn: 7.5"
            className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-navy-300 text-sm mb-1.5">Uyku Kalitesi</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="bad">Kötü</option>
            <option value="fair">Orta</option>
            <option value="good">İyi</option>
            <option value="excellent">Mükemmel</option>
          </select>
        </div>
        <div>
          <label className="block text-navy-300 text-sm mb-1.5">Notlar</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Sık uyandım vb."
            className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-medium transition-colors">
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </ModalContainer>
  );
}

export function NutritionModal({ isOpen, onClose, onSave, selectedDate }) {
  const [mealType, setMealType] = useState('breakfast');
  const [water, setWater] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes && !water) return toast.error('Yemek notu veya su miktarı girin');

    setIsSubmitting(true);
    try {
      await onSave({
        date: selectedDate,
        meal_type: mealType,
        water_ml: parseInt(water) || 0,
        notes: notes || 'Sadece su',
      });
      toast.success('Beslenme eklendi');
      onClose();
      setMealType('breakfast');
      setWater('');
      setNotes('');
    } catch {
      toast.error('Eklenemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} title="Beslenme Kaydı">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-navy-300 text-sm mb-1.5">Öğün</label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="breakfast">Kahvaltı</option>
            <option value="lunch">Öğle Yemeği</option>
            <option value="dinner">Akşam Yemeği</option>
            <option value="snack">Atıştırmalık</option>
          </select>
        </div>
        <div>
          <label className="block text-navy-300 text-sm mb-1.5">Su (ml)</label>
          <input
            type="number"
            step="100"
            value={water}
            onChange={(e) => setWater(e.target.value)}
            placeholder="Örn: 250"
            className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-navy-300 text-sm mb-1.5">Yedikleriniz</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            placeholder="Yulaf, yumurta vb."
            className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none resize-none"
          />
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-medium transition-colors">
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </ModalContainer>
  );
}
