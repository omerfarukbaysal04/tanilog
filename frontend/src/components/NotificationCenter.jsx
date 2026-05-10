import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiCheck,
  FiExternalLink,
  FiMic,
  FiMicOff,
  FiRefreshCw,
  FiVolume2,
} from 'react-icons/fi';
import useNotificationStore from '../stores/notificationStore';

function NotificationCenter() {
  const navigate = useNavigate();
  const {
    items,
    permission,
    voiceEnabled,
    isOpen,
    isLoading,
    init,
    refresh,
    requestPermission,
    sendTestNotification,
    toggleVoice,
    setOpen,
    markRead,
    markAllRead,
  } = useNotificationStore();

  useEffect(() => {
    init().catch(() => {});
  }, [init]);

  const unreadCount = items.filter((item) => !item.read).length;

  const openItem = (item) => {
    markRead(item.id);
    setOpen(false);
    if (item.route) navigate(item.route);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!isOpen)}
        className="relative w-10 h-10 rounded-xl bg-navy-800/70 hover:bg-navy-700 text-navy-200 hover:text-white border border-navy-700/70 flex items-center justify-center transition-colors"
        title="Bildirimler"
      >
        <FiBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-[min(92vw,390px)] rounded-2xl border border-navy-700 shadow-2xl overflow-hidden z-[120] bg-navy-900/98 backdrop-blur-2xl">
          <header className="p-4 border-b border-navy-700/60 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-white font-semibold">Bildirimler</h2>
              <p className="text-navy-400 text-xs">{unreadCount} okunmamış bildirim</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => refresh().catch(() => {})}
                className="w-8 h-8 rounded-lg text-navy-300 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
                title="Yenile"
              >
                <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={markAllRead}
                className="w-8 h-8 rounded-lg text-navy-300 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
                title="Tümünü okundu yap"
              >
                <FiCheck />
              </button>
            </div>
          </header>

          <div className="p-3 border-b border-navy-700/60 grid grid-cols-2 gap-2">
            {permission === 'default' && (
              <button
                onClick={requestPermission}
                className="col-span-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-200 px-3 py-2 text-xs font-semibold transition-colors"
              >
                Bildirim izni ver
              </button>
            )}
            <button
              onClick={toggleVoice}
              className={`rounded-xl px-3 py-2 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                voiceEnabled
                  ? 'bg-teal-500/10 text-teal-200 border border-teal-500/20'
                  : 'bg-navy-800 text-navy-300 border border-navy-700'
              }`}
            >
              {voiceEnabled ? <FiMic /> : <FiMicOff />}
              Sesli
            </button>
            <button
              onClick={sendTestNotification}
              className="rounded-xl bg-navy-800 hover:bg-navy-700 text-navy-200 border border-navy-700 px-3 py-2 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <FiVolume2 />
              Test
            </button>
          </div>

          <div className="max-h-[420px] min-h-[180px] overflow-y-auto p-3 space-y-2 bg-navy-900/95">
            {items.length === 0 ? (
              <div className="min-h-[128px] rounded-xl border border-dashed border-navy-700 bg-navy-950/30 p-6 text-center flex flex-col items-center justify-center">
                <FiBell className="mx-auto text-navy-500 mb-2" size={24} />
                <p className="text-navy-300 text-sm font-medium">Şimdilik bildirim yok.</p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openItem(item)}
                  className={`w-full text-left rounded-xl border p-3 transition-colors ${
                    item.read
                      ? 'border-navy-700/50 bg-navy-900/30 hover:bg-navy-800/60'
                      : 'border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold">{item.title}</p>
                      <p className="text-navy-300 text-xs mt-1 leading-relaxed">{item.body}</p>
                      <p className="text-navy-500 text-[11px] mt-2">{formatTime(item.eventTime)}</p>
                    </div>
                    <FiExternalLink className="text-navy-500 flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default NotificationCenter;
