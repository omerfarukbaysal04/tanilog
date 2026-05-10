import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiCpu,
  FiEdit3,
  FiMessageCircle,
  FiMic,
  FiMicOff,
  FiPaperclip,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiTrash2,
  FiVolume2,
} from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import useChatStore from '../stores/chatStore';
import useHealthStore from '../stores/healthStore';

const inputClass = "w-full bg-navy-900/60 border border-navy-700 rounded-2xl px-4 py-3 text-white placeholder-navy-500 focus:outline-none focus:border-teal-500 transition-colors";

function ChatAssistantPage() {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const {
    sessions,
    activeSession,
    messages,
    followUps,
    isLoading,
    isSending,
    error,
    fetchSessions,
    createSession,
    renameSession,
    deleteSession,
    openSession,
    sendMessage,
    sendAttachment,
    clearError,
  } = useChatStore();
  const { addSymptom, addMedication, addSleep, addNutrition } = useHealthStore();

  const speechSupport = useMemo(() => {
    if (typeof window === 'undefined') return { supported: false };
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return { supported: !!SpeechRecognition, SpeechRecognition };
  }, []);

  useEffect(() => {
    fetchSessions().catch(() => {});
  }, [fetchSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const handleNewChat = async () => {
    try {
      await createSession('Yeni Sağlık Sohbeti');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSend = async (text = input) => {
    if (!text.trim() || isSending) return;
    clearError();
    setInput('');
    try {
      await sendMessage(text.trim());
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRenameSession = async (session) => {
    const nextTitle = window.prompt('Sohbet adı', session.title);
    if (!nextTitle || !nextTitle.trim() || nextTitle.trim() === session.title) return;
    try {
      await renameSession(session.id, nextTitle.trim());
      toast.success('Sohbet adı güncellendi.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteSession = async (session) => {
    const confirmed = window.confirm(`"${session.title}" sohbeti silinsin mi?`);
    if (!confirmed) return;
    try {
      await deleteSession(session.id);
      toast.success('Sohbet silindi.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAttachment = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || isSending) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Dosya boyutu en fazla 5 MB olabilir.');
      return;
    }

    clearError();
    const note = input.trim();
    setInput('');
    try {
      await sendAttachment({ file, message: note });
      toast.success('Dosya asistana gönderildi.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const startListening = () => {
    if (!speechSupport.supported) {
      toast.error('Bu tarayıcı ses tanımayı desteklemiyor.');
      return;
    }
    const recognition = new speechSupport.SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const text = Array.from(event.results).map((result) => result[0]?.transcript || '').join(' ').trim();
      setInput(text);
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Ses alınamadı.');
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

  const speak = (text) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Bu tarayıcı sesli okuma desteklemiyor.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
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
    <DashboardLayout>
      <div className="max-w-[92rem] mx-auto grid xl:grid-cols-[320px_1fr] gap-6 h-[calc(100vh-8rem)] min-h-[680px]">
        <aside className="glass-card rounded-2xl border border-navy-700/50 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-navy-700/50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-teal-300 text-xs font-semibold">Premium</p>
                <h1 className="text-white text-xl font-bold">AI Sağlık Asistanı</h1>
              </div>
              <button
                onClick={handleNewChat}
                className="w-10 h-10 rounded-xl bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center transition-colors"
                title="Yeni sohbet"
              >
                <FiPlus />
              </button>
            </div>
          </div>

          <div className="p-3 flex-1 overflow-y-auto space-y-2">
            {sessions.length === 0 && !isLoading && (
              <div className="rounded-xl border border-dashed border-navy-700 p-4 text-sm text-navy-400 text-center">
                Henüz sohbet yok.
              </div>
            )}
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`rounded-xl border transition-colors flex items-center gap-2 ${
                  activeSession?.id === session.id
                    ? 'border-teal-500/40 bg-teal-500/10'
                    : 'border-navy-700/50 bg-navy-900/30 hover:bg-navy-800/60'
                }`}
              >
                <button
                  onClick={() => openSession(session).catch((err) => toast.error(err.message))}
                  className="min-w-0 flex-1 text-left p-3"
                >
                  <p className="text-white text-sm font-semibold truncate">{session.title}</p>
                  <p className="text-navy-500 text-xs mt-1">
                    {session.updated_at ? new Date(session.updated_at).toLocaleString('tr-TR') : ''}
                  </p>
                </button>
                <div className="flex items-center pr-2 gap-1">
                  <button
                    onClick={() => handleRenameSession(session)}
                    className="w-8 h-8 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700/70 flex items-center justify-center transition-colors"
                    title="Sohbet adını değiştir"
                  >
                    <FiEdit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session)}
                    className="w-8 h-8 rounded-lg text-navy-400 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                    title="Sohbeti sil"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="glass-card rounded-2xl border border-navy-700/50 overflow-hidden flex flex-col min-w-0">
          <header className="p-5 border-b border-navy-700/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 flex items-center justify-center">
                <FiCpu size={22} />
              </div>
              <div>
                <h2 className="text-white font-semibold">{activeSession?.title || 'Yeni sohbet'}</h2>
                <p className="text-navy-400 text-sm">Kayıtların, belgelerin ve doktor raporlarınla bağlamlı sohbet.</p>
              </div>
            </div>
            {isLoading && <FiRefreshCw className="animate-spin text-navy-400" />}
          </header>

          {error && (
            <div className="mx-5 mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-red-200 text-sm flex gap-2">
              <FiAlertTriangle className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 ? (
              <EmptyChat onPrompt={handleSend} />
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onSpeak={speak}
                  onSuggestedAction={handleSuggestedAction}
                />
              ))
            )}
            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-navy-800 border border-navy-700 px-4 py-3 text-navy-300 text-sm flex items-center gap-2">
                  <FiRefreshCw className="animate-spin" />
                  Yanıt hazırlanıyor...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {followUps.length > 0 && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {followUps.map((question, index) => (
                <button
                  key={`${question}-${index}`}
                  onClick={() => handleSend(question)}
                  className="rounded-full border border-navy-700 bg-navy-900/50 px-3 py-1.5 text-xs text-navy-200 hover:border-teal-500/40 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
            className="p-5 border-t border-navy-700/50"
          >
            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,application/pdf,text/plain"
                onChange={handleAttachment}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-2xl bg-navy-800 hover:bg-navy-700 text-white flex items-center justify-center transition-colors"
                title="Belge veya görsel yükle"
              >
                <FiPaperclip />
              </button>
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-colors ${
                  isListening ? 'bg-red-500' : 'bg-navy-800 hover:bg-navy-700'
                }`}
                title="Sesli soru"
              >
                {isListening ? <FiMicOff /> : <FiMic />}
              </button>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className={inputClass}
                placeholder="Örn: Son 30 günde baş ağrım arttı mı? Bu raporu doktoruma nasıl anlatmalıyım?"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="w-12 h-12 rounded-2xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white flex items-center justify-center transition-colors"
              >
                <FiSend />
              </button>
            </div>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}

function EmptyChat({ onPrompt }) {
  const prompts = [
    'Son 30 gündeki sağlık kayıtlarımı özetler misin?',
    'Doktoruma hangi soruları sormalıyım?',
    'İlaç kayıtlarımda dikkat etmem gereken bir şey var mı?',
  ];
  return (
    <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-300 flex items-center justify-center mb-4">
        <FiMessageCircle size={28} />
      </div>
      <h2 className="text-white font-semibold text-xl">Nasıl yardımcı olayım?</h2>
      <p className="text-navy-400 text-sm mt-2 max-w-lg">
        TanıLog kayıtlarınla bağlamlı sohbet edebilirim. Tıbbi teşhis koymam, ama doktor görüşmesine hazırlanmanı ve kayıtlarını anlamanı kolaylaştırırım.
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPrompt(prompt)}
            className="rounded-full border border-navy-700 bg-navy-900/50 px-4 py-2 text-sm text-navy-200 hover:border-teal-500/40 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message, onSpeak, onSuggestedAction }) {
  const isUser = message.role === 'user';
  const safetyStyle = {
    normal: 'border-teal-500/20 bg-teal-500/10 text-teal-100',
    caution: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-100',
    urgent: 'border-red-500/30 bg-red-500/10 text-red-100',
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[82%] rounded-2xl px-4 py-3 border ${
        isUser
          ? 'bg-teal-500 text-white border-teal-400/30'
          : 'bg-navy-900/60 text-navy-100 border-navy-700/60'
      }`}>
        {!isUser && message.safety_level && (
          <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${safetyStyle[message.safety_level] || safetyStyle.caution}`}>
            <FiAlertTriangle />
            {message.safety_level === 'urgent' ? 'Acil dikkat' : message.safety_level === 'caution' ? 'Dikkatli değerlendir' : 'Bilgilendirici yanıt'}
          </div>
        )}
        <div className="prose prose-invert prose-teal max-w-none prose-sm prose-p:text-current prose-li:text-current prose-strong:text-white">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {!isUser && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => onSpeak(message.content)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-2.5 py-1.5 text-xs text-white transition-colors"
            >
              <FiVolume2 /> Sesli oku
            </button>
            {message.suggested_actions?.map((action, index) => (
              <button
                key={`${action.type}-${index}`}
                onClick={() => onSuggestedAction(action)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 px-2.5 py-1.5 text-xs text-teal-100 transition-colors"
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

export default ChatAssistantPage;
