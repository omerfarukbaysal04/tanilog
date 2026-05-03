import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

// --- Ortak Modal Kapsayıcı ---
function ModalContainer({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-navy-800 border border-navy-700 rounded-2xl w-full max-w-md pointer-events-auto overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-navy-700/50">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-navy-400 hover:text-white transition-colors p-1"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="p-5">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// --- Semptom Modalı ---
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
        notes: notes || null
      });
      toast.success('Semptom eklendi');
      onClose();
      setName(''); setSeverity(5); setNotes('');
    } catch (err) {
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
            placeholder="Örn: Baş Ağrısı"
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
          <label className="block text-navy-300 text-sm mb-1.5">Notlar (Opsiyonel)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            placeholder="Ekstra detaylar..."
            className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-medium transition-colors"
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </ModalContainer>
  );
}

// --- İlaç Modalı ---
export function MedicationModal({ isOpen, onClose, onSave, selectedDate }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        notes: notes || null
      });
      toast.success('İlaç eklendi');
      onClose();
      setName(''); setDosage(''); setTime(''); setNotes('');
    } catch (err) {
      toast.error('Eklenemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} title="İlaç Ekle">
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-medium transition-colors"
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </ModalContainer>
  );
}

// --- Uyku Modalı ---
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
        notes: notes || null
      });
      toast.success('Uyku eklendi');
      onClose();
      setHours(''); setQuality('good'); setNotes('');
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
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-medium transition-colors"
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </ModalContainer>
  );
}

// --- Beslenme Modalı ---
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
        notes: notes || 'Sadece su'
      });
      toast.success('Beslenme eklendi');
      onClose();
      setMealType('breakfast'); setWater(''); setNotes('');
    } catch (err) {
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
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-medium transition-colors"
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </ModalContainer>
  );
}
