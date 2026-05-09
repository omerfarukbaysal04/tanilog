import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle,
  FiCheck,
  FiEdit3,
  FiMic,
  FiMicOff,
  FiPlus,
  FiRefreshCw,
} from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import useHealthStore from '../stores/healthStore';
import useVoiceStore from '../stores/voiceStore';

const fieldClass = "w-full bg-navy-900/50 border border-navy-700 rounded-xl px-4 py-3 text-white placeholder-navy-500 focus:outline-none focus:border-teal-500 transition-colors";

function UsageCard({ usage }) {
  const isUnlimited = usage?.limit === -1;
  const used = usage?.used_today ?? 0;
  const remaining = usage?.remaining ?? 0;

  return (
    <div className="glass rounded-2xl border border-navy-700/50 p-5">
      <p className="text-sm text-navy-400 mb-2">Günlük kullanım</p>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-bold text-white">{isUnlimited ? 'Sınırsız' : `${remaining} hak`}</p>
          <p className="text-sm text-navy-400 mt-1">
            {isUnlimited ? 'Premium sesli asistan aktif' : `${used}/3 sesli giriş kullanıldı`}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-300">
          <FiMic size={22} />
        </div>
      </div>
    </div>
  );
}

function ResultEditor({ result, draft, setDraft, onConfirm, isSaving }) {
  if (!result) {
    return (
      <div className="glass rounded-2xl border border-dashed border-navy-700/70 min-h-[22rem] flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-navy-800/70 flex items-center justify-center text-navy-400 mb-4">
          <FiEdit3 size={24} />
        </div>
        <p className="text-white font-semibold">Henüz analiz yok</p>
        <p className="text-sm text-navy-400 mt-2 max-w-md">
          Ses kaydı metne çevrildikten sonra TanıLog bunu semptom veya ilaç kaydı taslağına dönüştürür.
        </p>
      </div>
    );
  }

  const isSymptom = result.intent === 'symptom';
  const isMedication = result.intent === 'medication';

  return (
    <div className="glass rounded-2xl border border-navy-700/50 p-5 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-sm text-navy-400">AI taslağı</p>
          <h2 className="text-xl font-bold text-white">
            {isSymptom ? 'Semptom kaydı' : isMedication ? 'İlaç kaydı' : 'Gözden geçir'}
          </h2>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
          Güven: %{Math.round((result.confidence || 0) * 100)}
        </span>
      </div>

      {result.warnings?.length > 0 && (
        <div className="mb-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
          <div className="flex items-start gap-2">
            <FiAlertTriangle className="mt-0.5 shrink-0" />
            <p>{result.warnings.join(' ')}</p>
          </div>
        </div>
      )}

      {isSymptom && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-navy-300">Semptom</span>
            <input
              className={`${fieldClass} mt-2`}
              value={draft.symptom_name || ''}
              onChange={(event) => setDraft({ ...draft, symptom_name: event.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm text-navy-300">Şiddet: {draft.severity || 5}/10</span>
            <input
              type="range"
              min="1"
              max="10"
              className="w-full mt-3 accent-teal-400"
              value={draft.severity || 5}
              onChange={(event) => setDraft({ ...draft, severity: Number(event.target.value) })}
            />
          </label>
          <label className="block">
            <span className="text-sm text-navy-300">Not</span>
            <textarea
              className={`${fieldClass} mt-2 min-h-[8rem] resize-none`}
              value={draft.notes || ''}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            />
          </label>
        </div>
      )}

      {isMedication && (
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block md:col-span-2">
            <span className="text-sm text-navy-300">İlaç adı</span>
            <input
              className={`${fieldClass} mt-2`}
              value={draft.name || ''}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm text-navy-300">Doz</span>
            <input
              className={`${fieldClass} mt-2`}
              value={draft.dosage || ''}
              onChange={(event) => setDraft({ ...draft, dosage: event.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm text-navy-300">Alınma saati</span>
            <input
              type="time"
              className={`${fieldClass} mt-2`}
              value={draft.time_taken || ''}
              onChange={(event) => setDraft({ ...draft, time_taken: event.target.value })}
            />
          </label>
          <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-navy-700 bg-navy-900/40 px-4 py-3">
            <input
              type="checkbox"
              className="w-4 h-4 accent-teal-400"
              checked={!!draft.reminder_enabled}
              onChange={(event) => setDraft({ ...draft, reminder_enabled: event.target.checked })}
            />
            <span className="text-sm text-navy-200">Bu ilaç için hatırlatma kur</span>
          </label>
          {draft.reminder_enabled && (
            <label className="block md:col-span-2">
              <span className="text-sm text-navy-300">Hatırlatma saati</span>
              <input
                type="time"
                className={`${fieldClass} mt-2`}
                value={draft.reminder_time || ''}
                onChange={(event) => setDraft({ ...draft, reminder_time: event.target.value })}
              />
            </label>
          )}
          <label className="block md:col-span-2">
            <span className="text-sm text-navy-300">Not</span>
            <textarea
              className={`${fieldClass} mt-2 min-h-[7rem] resize-none`}
              value={draft.notes || ''}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            />
          </label>
        </div>
      )}

      {result.intent === 'unknown' && (
        <div className="rounded-xl border border-navy-700 bg-navy-900/40 p-4 text-navy-300">
          Bu metin sağlık kaydına çevrilmeden önce biraz daha netleştirilmeli.
        </div>
      )}

      <button
        type="button"
        onClick={onConfirm}
        disabled={isSaving || result.intent === 'unknown'}
        className="mt-6 w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
      >
        {isSaving ? <FiRefreshCw className="animate-spin" /> : <FiPlus />}
        Kayda Ekle
      </button>
    </div>
  );
}

function VoiceAssistantPage() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState({});
  const recognitionRef = useRef(null);

  const { selectedDate, addSymptom, addMedication } = useHealthStore();
  const { usage, parseResult, isLoading, fetchUsage, parseTranscript, clearResult } = useVoiceStore();

  const support = useMemo(() => {
    if (typeof window === 'undefined') return { supported: false };
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return { supported: !!SpeechRecognition, SpeechRecognition };
  }, []);

  useEffect(() => {
    fetchUsage().catch(() => {});
  }, [fetchUsage]);

  useEffect(() => {
    if (parseResult?.extracted_data) {
      setDraft(parseResult.extracted_data);
    }
  }, [parseResult]);

  const startListening = () => {
    if (!support.supported) {
      toast.error('Bu tarayıcı ses tanımayı desteklemiyor.');
      return;
    }

    const recognition = new support.SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();
      setTranscript(text);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Ses alınamadı. Tarayıcı izinlerini kontrol edin.');
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleParse = async () => {
    if (!transcript.trim()) {
      toast.error('Önce bir ses kaydı veya metin girin.');
      return;
    }

    try {
      await parseTranscript({
        transcript: transcript.trim(),
        targetDate: format(selectedDate, 'yyyy-MM-dd'),
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Sesli giriş analiz edilemedi.');
    }
  };

  const handleConfirm = async () => {
    if (!parseResult) return;
    setIsSaving(true);
    try {
      if (parseResult.intent === 'symptom') {
        await addSymptom({
          date: draft.date,
          symptom_name: draft.symptom_name,
          severity: Number(draft.severity || 5),
          notes: draft.notes || transcript,
        });
        toast.success('Semptom kaydı eklendi.');
      }

      if (parseResult.intent === 'medication') {
        await addMedication({
          date: draft.date,
          name: draft.name,
          dosage: draft.dosage || 'Belirtilmedi',
          time_taken: draft.time_taken || null,
          reminder_enabled: !!draft.reminder_enabled,
          reminder_time: draft.reminder_enabled ? draft.reminder_time || draft.time_taken || null : null,
          notes: draft.notes || transcript,
        });
        toast.success('İlaç kaydı eklendi.');
      }

      setTranscript('');
      setDraft({});
      clearResult();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kayıt eklenemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-6">
          <div className="space-y-6">
            <div className="glass rounded-2xl border border-navy-700/50 p-5 lg:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-navy-400">Türkçe sesli giriş</p>
                  <h1 className="text-2xl font-bold text-white">Sesli Asistan</h1>
                </div>
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all ${
                    isListening ? 'bg-red-500 shadow-red-500/20' : 'bg-teal-500 hover:bg-teal-400 shadow-teal-500/20'
                  }`}
                >
                  {isListening ? <FiMicOff size={28} /> : <FiMic size={28} />}
                </button>
              </div>

              {!support.supported && (
                <div className="mb-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                  Bu tarayıcıda Web Speech API yok. Metni manuel yazarak aynı AI akışını kullanabilirsiniz.
                </div>
              )}

              <textarea
                className={`${fieldClass} min-h-[15rem] resize-none`}
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                placeholder="Örn: Başım çok ağrıyor, şiddeti 7. / Parol 500 mg aldım, saat 11:30."
              />

              <div className="flex flex-col sm:flex-row gap-3 mt-5">
                <button
                  type="button"
                  onClick={handleParse}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-semibold transition-colors"
                >
                  {isLoading ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
                  Analiz Et
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('');
                    setDraft({});
                    clearResult();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-navy-800 hover:bg-navy-700 text-navy-200 font-semibold transition-colors"
                >
                  Temizle
                </button>
              </div>
            </div>

            <UsageCard usage={usage} />
          </div>

          <ResultEditor
            result={parseResult}
            draft={draft}
            setDraft={setDraft}
            onConfirm={handleConfirm}
            isSaving={isSaving}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default VoiceAssistantPage;
