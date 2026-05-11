import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiExternalLink,
  FiMessageCircle,
  FiMinus,
  FiPaperclip,
  FiPlus,
  FiSend,
  FiX,
} from 'react-icons/fi';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';
import useHealthStore from '../stores/healthStore';

function ChatAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const { user } = useAuthStore();
  const {
    sessions,
    activeSession,
    messages,
    isLoading,
    isSending,
    error,
    fetchSessions,
    createSession,
    openSession,
    sendMessage,
    sendAttachment,
    clearError,
  } = useChatStore();
  const { addSymptom, addMedication, addSleep, addNutrition } = useHealthStore();

  const isPremium = !!user?.is_premium;
  const isChatPage = location.pathname === '/chat';

  useEffect(() => {
    if (!isOpen || !isPremium) return;
    fetchSessions()
      .then((items) => {
        if (!activeSession && items?.[0]) {
          openSession(items[0]).catch(() => {});
        }
      })
      .catch(() => {});
  }, [activeSession, fetchSessions, isOpen, isPremium, openSession]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isSending]);

  if (isChatPage) return null;

  const handleNewChat = async () => {
    try {
      await createSession('Yeni Sağlık Sohbeti');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSend = async (event) => {
    event?.preventDefault();
    if (!input.trim() || isSending) return;
    clearError();
    const text = input.trim();
    setInput('');
    try {
      await sendMessage(text);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAttachment = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || isSending) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu en fazla 5 MB olabilir.');
      return;
    }
    const note = input.trim();
    setInput('');
    try {
      await sendAttachment({ file, message: note });
      toast.success('Dosya asistana gönderildi.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSuggestedAction = async (action) => {
    try {
      const payload = normalizePayload(action);
      if (action.type === 'symptom') await addSymptom(payload);
      if (action.type === 'medication') await addMedication(payload);
      if (action.type === 'sleep') await addSleep(payload);
      if (action.type === 'nutrition') await addNutrition(payload);
      toast.success('Kayıt eklendi.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Kayıt eklenemedi.');
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[min(92vw,390px)] h-[min(74vh,580px)] glass-card rounded-2xl border border-navy-700/70 shadow-2xl overflow-hidden flex flex-col">
          <header className="px-4 py-3 border-b border-navy-700/60 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-teal-300 text-xs font-semibold">Premium AI</p>
              <h3 className="text-white font-bold truncate">Sağlık Asistanı</h3>
            </div>
            <div className="flex items-center gap-1">
              {isPremium && (
                <button
                  onClick={handleNewChat}
                  className="w-9 h-9 rounded-xl text-navy-200 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
                  title="Yeni sohbet"
                >
                  <FiPlus />
                </button>
              )}
              <Link
                to="/chat"
                className="w-9 h-9 rounded-xl text-navy-200 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
                title="Tam ekranda aç"
              >
                <FiExternalLink />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-xl text-navy-200 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
                title="Kapat"
              >
                <FiX />
              </button>
            </div>
          </header>

          {!isPremium ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-300 flex items-center justify-center mb-4">
                <FiMessageCircle size={24} />
              </div>
              <h3 className="text-white font-semibold">AI Asistan Premium</h3>
              <p className="text-navy-400 text-sm mt-2">
                Sağlık kayıtlarınla bağlamlı sohbet, belge ve görsel analizi Premium planda açılır.
              </p>
              <Link
                to="/billing"
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-teal-500 hover:bg-teal-400 text-white px-4 py-2.5 text-sm font-bold transition-colors"
              >
                Premium'a Geç
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mx-4 mt-3 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-red-200 text-xs flex gap-2">
                  <FiAlertTriangle className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center">
                    <FiMessageCircle className="text-teal-300 mb-3" size={30} />
                    <p className="text-white font-semibold">Buradan hızlıca sorabilirsin.</p>
                    <p className="text-navy-400 text-sm mt-1">Belge, görsel veya sağlık kaydı hakkında konuşabiliriz.</p>
                    {isLoading && <p className="text-navy-500 text-xs mt-3">Sohbetler yükleniyor...</p>}
                  </div>
                ) : (
                  messages.slice(-10).map((message) => (
                    <WidgetMessage
                      key={message.id}
                      message={message}
                      onSuggestedAction={handleSuggestedAction}
                    />
                  ))
                )}
                {isSending && (
                  <div className="rounded-2xl bg-navy-800 border border-navy-700 px-3 py-2 text-navy-300 text-xs w-fit">
                    Yanıt hazırlanıyor...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-3 border-t border-navy-700/60">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,application/pdf,text/plain"
                  onChange={handleAttachment}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-11 h-11 rounded-xl bg-navy-800 hover:bg-navy-700 text-white flex items-center justify-center transition-colors"
                    title="Belge veya görsel yükle"
                  >
                    <FiPaperclip />
                  </button>
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    className="min-w-0 flex-1 bg-navy-900/70 border border-navy-700 rounded-xl px-3 py-3 text-sm text-white placeholder-navy-500 focus:outline-none focus:border-teal-500"
                    placeholder="Asistana sor..."
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isSending}
                    className="w-11 h-11 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white flex items-center justify-center transition-colors"
                  >
                    <FiSend />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen((value) => !value)}
        className="w-14 h-14 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white shadow-2xl border border-white/10 flex items-center justify-center transition-all hover:-translate-y-0.5"
        title={isOpen ? 'Asistanı küçült' : 'AI Asistan'}
      >
        {isOpen ? <FiMinus size={24} /> : <FiMessageCircle size={24} />}
      </button>
    </div>
  );
}

function WidgetMessage({ message, onSuggestedAction }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[86%] rounded-2xl px-3 py-2 border text-sm ${
        isUser
          ? 'bg-teal-500 text-white border-teal-400/30'
          : 'bg-navy-900/70 text-navy-100 border-navy-700/70'
      }`}>
        <div className="prose prose-invert prose-teal max-w-none prose-xs prose-p:text-current prose-li:text-current prose-strong:text-white">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {!isUser && message.suggested_actions?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.suggested_actions.map((action, index) => (
              <button
                key={`${action.type}-${index}`}
                onClick={() => onSuggestedAction(action)}
                className="inline-flex items-center gap-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 px-2 py-1 text-[11px] text-teal-100 transition-colors"
              >
                <FiCheckCircle /> {action.label || 'Kaydı ekle'}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function normalizePayload(action) {
  const today = new Date().toISOString().slice(0, 10);
  const payload = { ...(action.payload || {}) };
  payload.date = payload.date || today;

  if (action.type === 'symptom') {
    return {
      date: payload.date,
      symptom_name: payload.symptom_name || 'Chatbot kaydı',
      severity: Number(payload.severity || 5),
      notes: payload.notes || 'AI asistan önerisi',
    };
  }
  if (action.type === 'medication') {
    return {
      date: payload.date,
      name: payload.name || 'Chatbot ilaç kaydı',
      dosage: payload.dosage || 'Belirtilmedi',
      time_taken: payload.time_taken || null,
      reminder_enabled: !!payload.reminder_enabled,
      reminder_time: payload.reminder_enabled ? payload.reminder_time || payload.time_taken || null : null,
      notes: payload.notes || 'AI asistan önerisi',
    };
  }
  if (action.type === 'sleep') {
    return {
      date: payload.date,
      hours_slept: Number(payload.hours_slept || 0),
      quality: payload.quality || 'good',
      notes: payload.notes || 'AI asistan önerisi',
    };
  }
  return {
    date: payload.date,
    meal_type: payload.meal_type || 'snack',
    water_ml: Number(payload.water_ml || 0),
    notes: payload.notes || 'AI asistan önerisi',
  };
}

export default ChatAssistantWidget;
