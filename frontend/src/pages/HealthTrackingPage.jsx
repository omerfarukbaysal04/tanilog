import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { FiActivity, FiPlus, FiHeart, FiCoffee, FiTrash2, FiClock, FiBell, FiCheckCircle, FiShield, FiAlertCircle, FiEdit3, FiSave, FiImage, FiMic, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import Calendar from '../components/health/Calendar';
import useHealthStore from '../stores/healthStore';
import { ModalContainer, SymptomModal, MedicationModal, SleepModal, NutritionModal } from '../components/health/LogModals';
import { ResultEditor, UsageCard, VoiceMicButton, fieldClass, useVoiceRecorder } from './VoiceAssistantPage';

const tabs = [
  { id: 'symptoms', label: 'Semptomlar', icon: <FiActivity /> },
  { id: 'medications', label: 'İlaçlar', icon: <FiPlus /> },
  { id: 'sleep', label: 'Uyku', icon: <FiHeart /> },
  { id: 'nutrition', label: 'Beslenme', icon: <FiCoffee /> },
];

function HealthTrackingPage() {
  const {
    selectedDate, setSelectedDate, dailyData, isLoading,
    addSymptom, deleteSymptom,
    addMedication, updateMedication, deleteMedication, markMedicationTaken, checkMedicationInteractions, scanMedicationFile,
    addSleep, deleteSleep,
    addNutrition, deleteNutrition
  } = useHealthStore();
  const [activeTab, setActiveTab] = useState('symptoms');
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [interactionResult, setInteractionResult] = useState(null);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [interactionError, setInteractionError] = useState(null);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const voice = useVoiceRecorder({
    selectedDate,
    onSaved: () => setVoiceModalOpen(false),
  });
  
  // Modal States
  const [modals, setModals] = useState({
    symptoms: false,
    medications: false,
    sleep: false,
    nutrition: false
  });

  const openModal = (type) => setModals(prev => ({ ...prev, [type]: true }));
  const closeModal = (type) => setModals(prev => ({ ...prev, [type]: false }));
  const closeVoiceModal = () => {
    setVoiceModalOpen(false);
    voice.reset();
  };

  useEffect(() => {
    // Component yüklendiğinde bugünün verilerini çek
    setSelectedDate(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    if (typeof Notification === 'undefined' || notificationPermission !== 'granted') return;
    if (formattedDate !== format(new Date(), 'yyyy-MM-dd')) return;

    const timers = dailyData.medications
      .filter((item) => item.reminder_enabled && item.reminder_time && !item.is_taken)
      .map((item) => {
        const [hours, minutes] = item.reminder_time.substring(0, 5).split(':').map(Number);
        const target = new Date();
        target.setHours(hours, minutes, 0, 0);
        const delay = target.getTime() - Date.now();

        if (delay < 0 || delay > 24 * 60 * 60 * 1000) return null;

        return window.setTimeout(() => {
          new Notification('TanıLog ilaç hatırlatma', {
            body: `${item.name} (${item.dosage}) alma zamanı.`,
          });
        }, delay);
      })
      .filter(Boolean);

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [dailyData.medications, formattedDate, notificationPermission]);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      setNotificationPermission('unsupported');
      return 'unsupported';
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  };

  const sendTestNotification = async () => {
    if (typeof Notification === 'undefined') {
      window.alert('Bu tarayıcı bildirim desteklemiyor.');
      return;
    }

    let permission = notificationPermission;
    if (permission === 'default') {
      permission = await requestNotificationPermission();
    }

    if (permission === 'granted') {
      new Notification('TanıLog test bildirimi', {
        body: 'İlaç hatırlatmaları bu şekilde görünecek.',
      });
      return;
    }

    window.alert('Bildirim izni kapalı. Tarayıcı site ayarlarından izin vermen gerekiyor.');
  };

  const handleInteractionCheck = async () => {
    setInteractionLoading(true);
    setInteractionError(null);
    try {
      const result = await checkMedicationInteractions();
      setInteractionResult(result);
    } catch (error) {
      setInteractionError(error.response?.data?.detail || 'İlaç etkileşim kontrolü yapılamadı.');
    } finally {
      setInteractionLoading(false);
    }
  };

  // --- Render Helpers ---
  const renderEmptyState = (message) => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-navy-800/30 rounded-2xl border border-dashed border-navy-700">
      <div className="w-16 h-16 bg-navy-700/50 rounded-full flex items-center justify-center mb-4 text-navy-400">
        {tabs.find(t => t.id === activeTab)?.icon}
      </div>
      <p className="text-navy-300 mb-4">{message}</p>
      <button
        onClick={() => openModal(activeTab)}
        className="bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
      >
        <FiPlus size={16} /> Yeni Ekle
      </button>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-[92rem] mx-auto flex flex-col gap-6">

        <div className="order-2 grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
          <div className="h-full">
          {/* Sol Kolon: Takvim */}
            <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} compact />
            
            {/* Lottie Animasyonlu Motivasyon Kartı */}
          </div>

            <div className="glass-card bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 rounded-2xl p-4 relative overflow-hidden min-h-[118px] flex items-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 animate-pulse-glow" />
              <div className="relative z-10">
                <h3 className="text-white font-semibold mb-2">Harika Gidiyorsun!</h3>
                <p className="text-navy-300 text-sm">Sağlık verilerini düzenli kaydetmek, yapay zekanın sana daha doğru içgörüler sunmasını sağlar.</p>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 opacity-20 pointer-events-none">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#0fb8a5" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.1,73.1,41.9C64.8,54.7,53.8,65.7,40.6,73.1C27.4,80.5,13.7,84.3,0.1,84.1C-13.5,83.9,-27,79.8,-39.6,72.2C-52.2,64.6,-63.9,53.5,-72.1,40.4C-80.3,27.3,-85,13.7,-85.4,-0.2C-85.8,-14.1,-81.9,-28.2,-73.8,-40.1C-65.7,-52,-53.4,-61.7,-40.1,-69.3C-26.8,-76.9,-13.4,-82.4,1.4,-84.8C16.2,-87.2,32.4,-86.5,44.7,-76.4Z" transform="translate(100 100)" />
                </svg>
              </div>
            </div>
        </div>

          {/* Sağ Kolon: Veri Girişi ve Gösterimi */}
        <div className="order-1 glass-card rounded-2xl overflow-hidden flex flex-col min-h-[560px] relative">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />
              
              {/* Sekmeler */}
              <div className="flex overflow-x-auto border-b border-navy-700/50 hide-scrollbar">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[120px] py-4 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-all relative ${
                      activeTab === tab.id ? 'text-teal-400' : 'text-navy-400 hover:text-navy-200 hover:bg-navy-700/30'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Sekme İçeriği */}
              <div className="p-6 flex-1 relative">
                {isLoading && (
                  <div className="absolute inset-0 z-10 bg-navy-800/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                  </div>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Üst Kısım: Başlık ve Ekle Butonu */}
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                        {tabs.find(t => t.id === activeTab)?.label}
                      </h2>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setVoiceModalOpen(true)}
                          className="bg-blue-500/15 hover:bg-blue-500/25 text-blue-200 p-2 rounded-xl transition-colors border border-blue-500/20"
                          title="Sesli Ekle"
                        >
                          <FiMic size={20} />
                        </button>
                        <button
                          onClick={() => openModal(activeTab)}
                          className="bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-xl transition-colors shadow-lg shadow-teal-500/20"
                          title="Yeni Ekle"
                        >
                          <FiPlus size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Semptom Listesi */}
                    {activeTab === 'symptoms' && (
                      dailyData.symptoms.length === 0 ? renderEmptyState('Bu gün için kaydedilmiş bir semptom bulunmuyor.') : (
                        <div className="space-y-3">
                          {dailyData.symptoms.map(item => (
                            <div key={item.id} className="glass bg-navy-900/50 rounded-xl p-4 flex justify-between items-start group hover:border-teal-500/30 transition-colors relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50" />
                              <div>
                                <h4 className="text-white font-medium flex items-center gap-2">
                                  {item.symptom_name}
                                  <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Şiddet: {item.severity}/10</span>
                                </h4>
                                {item.notes && <p className="text-navy-400 text-sm mt-1">{item.notes}</p>}
                              </div>
                              <button onClick={() => deleteSymptom(item.id)} className="text-navy-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all">
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )
                    )}

                    {/* İlaç Listesi */}
                    {activeTab === 'medications' && (
                      <MedicationPanel
                        medications={dailyData.medications}
                        notificationPermission={notificationPermission}
                        onRequestNotificationPermission={requestNotificationPermission}
                        onTestNotification={sendTestNotification}
                        onInteractionCheck={handleInteractionCheck}
                        interactionLoading={interactionLoading}
                        interactionError={interactionError}
                        interactionResult={interactionResult}
                        onMarkTaken={markMedicationTaken}
                        onDelete={deleteMedication}
                        onOpenDetails={setSelectedMedication}
                        renderEmptyState={renderEmptyState}
                      />
                    )}

                    {false && activeTab === 'medications' && (
                      dailyData.medications.length === 0 ? renderEmptyState('Bu gün için kaydedilmiş bir ilaç bulunmuyor.') : (
                        <div className="space-y-3">
                          {dailyData.medications.map(item => (
                            <div key={item.id} className="glass bg-navy-900/50 rounded-xl p-4 flex justify-between items-start group hover:border-teal-500/30 transition-colors relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500/50" />
                              <div>
                                <h4 className="text-white font-medium flex items-center gap-2">
                                  {item.name} <span className="text-navy-400 text-sm font-normal">({item.dosage})</span>
                                </h4>
                                <div className="flex items-center gap-4 mt-2">
                                  {item.time_taken && (
                                    <span className="flex items-center gap-1 text-teal-400 text-xs bg-teal-500/10 px-2 py-1 rounded-md">
                                      <FiClock size={12} /> {item.time_taken.substring(0,5)}
                                    </span>
                                  )}
                                  {item.notes && <span className="text-navy-400 text-sm">{item.notes}</span>}
                                </div>
                              </div>
                              <button onClick={() => deleteMedication(item.id)} className="text-navy-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all">
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )
                    )}

                    {/* Uyku Listesi */}
                    {activeTab === 'sleep' && (
                      dailyData.sleep.length === 0 ? renderEmptyState('Bu gün için uyku kaydı bulunmuyor.') : (
                        <div className="space-y-3">
                          {dailyData.sleep.map(item => (
                            <div key={item.id} className="glass bg-navy-900/50 rounded-xl p-4 flex justify-between items-start group hover:border-teal-500/30 transition-colors relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500/50" />
                              <div>
                                <h4 className="text-white font-medium flex items-center gap-2">
                                  {item.hours_slept} Saat Uyku
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                    item.quality === 'excellent' ? 'bg-green-500/20 text-green-400' :
                                    item.quality === 'good' ? 'bg-blue-500/20 text-blue-400' :
                                    item.quality === 'fair' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {item.quality === 'excellent' ? 'Mükemmel' : item.quality === 'good' ? 'İyi' : item.quality === 'fair' ? 'Orta' : 'Kötü'}
                                  </span>
                                </h4>
                                {item.notes && <p className="text-navy-400 text-sm mt-1">{item.notes}</p>}
                              </div>
                              <button onClick={() => deleteSleep(item.id)} className="text-navy-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all">
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )
                    )}

                    {/* Beslenme Listesi */}
                    {activeTab === 'nutrition' && (
                      dailyData.nutrition.length === 0 ? renderEmptyState('Bu gün için beslenme kaydı bulunmuyor.') : (
                        <div className="space-y-3">
                          {dailyData.nutrition.map(item => (
                            <div key={item.id} className="glass bg-navy-900/50 rounded-xl p-4 flex justify-between items-start group hover:border-teal-500/30 transition-colors relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/50" />
                              <div>
                                <h4 className="text-white font-medium capitalize flex items-center gap-2">
                                  {item.meal_type === 'breakfast' ? 'Kahvaltı' : item.meal_type === 'lunch' ? 'Öğle Yemeği' : item.meal_type === 'dinner' ? 'Akşam Yemeği' : 'Atıştırmalık'}
                                  {item.water_ml > 0 && (
                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                                      {item.water_ml}ml Su
                                    </span>
                                  )}
                                </h4>
                                <p className="text-navy-300 text-sm mt-2 leading-relaxed">{item.notes}</p>
                              </div>
                              <button onClick={() => deleteNutrition(item.id)} className="text-navy-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all">
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
      </div>

      {/* Modallar */}
      <SymptomModal isOpen={modals.symptoms} onClose={() => closeModal('symptoms')} onSave={addSymptom} selectedDate={formattedDate} />
      <MedicationModal isOpen={modals.medications} onClose={() => closeModal('medications')} onSave={addMedication} onScan={scanMedicationFile} selectedDate={formattedDate} />
      <MedicationDetailModal
        medication={selectedMedication}
        onClose={() => setSelectedMedication(null)}
        onUpdate={updateMedication}
        onDelete={deleteMedication}
        onMarkTaken={markMedicationTaken}
      />
      <SleepModal isOpen={modals.sleep} onClose={() => closeModal('sleep')} onSave={addSleep} selectedDate={formattedDate} />
      <NutritionModal isOpen={modals.nutrition} onClose={() => closeModal('nutrition')} onSave={addNutrition} selectedDate={formattedDate} />
      <ModalContainer isOpen={voiceModalOpen} onClose={closeVoiceModal} title="Sesli Kayıt" maxWidth="max-w-5xl">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-5">
          <div className="space-y-4">
            <div className="rounded-2xl border border-navy-700/50 bg-navy-900/40 p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-navy-400 text-xs">Aktif tarih: {formattedDate}</p>
                  <h3 className="text-white font-semibold">Konuşarak kayıt ekle</h3>
                </div>
                <VoiceMicButton
                  size="sm"
                  isListening={voice.isListening}
                  onClick={voice.isListening ? voice.stopListening : voice.startListening}
                />
              </div>

              {!voice.support.supported && (
                <div className="mb-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                  Bu tarayıcıda mikrofonla metne çevirme yok. Metni yazıp aynı AI akışını kullanabilirsiniz.
                </div>
              )}

              <textarea
                className={`${fieldClass} min-h-[12rem] resize-none`}
                value={voice.transcript}
                onChange={(event) => voice.setTranscript(event.target.value)}
                placeholder="Örn: 7 saat uyudum, kalitesi iyiydi. / Öğlen tavuk salata yedim, 500 ml su içtim."
              />

              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  type="button"
                  onClick={voice.handleParse}
                  disabled={voice.isLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold transition-colors"
                >
                  {voice.isLoading ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />}
                  Analiz Et
                </button>
                <button
                  type="button"
                  onClick={voice.reset}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy-800 hover:bg-navy-700 text-navy-200 font-semibold transition-colors"
                >
                  Temizle
                </button>
              </div>
            </div>
            <UsageCard usage={voice.usage} />
          </div>

          <ResultEditor
            result={voice.parseResult}
            draft={voice.draft}
            setDraft={voice.setDraft}
            onConfirm={voice.handleConfirm}
            isSaving={voice.isSaving}
          />
        </div>
      </ModalContainer>

    </DashboardLayout>
  );
}

function MedicationPanel({
  medications,
  notificationPermission,
  onRequestNotificationPermission,
  onTestNotification,
  onInteractionCheck,
  interactionLoading,
  interactionError,
  interactionResult,
  onMarkTaken,
  onDelete,
  onOpenDetails,
  renderEmptyState,
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl bg-navy-900/50 border border-navy-700/50 p-4">
          <div className="flex items-start gap-3">
            <FiBell className="text-teal-400 mt-0.5" size={18} />
            <div>
              <h3 className="text-white text-sm font-semibold">Bildirim Durumu</h3>
              <p className="text-navy-400 text-xs mt-1">
                {notificationPermission === 'granted'
                  ? 'Tarayıcı bildirimleri açık.'
                  : notificationPermission === 'denied'
                  ? 'Tarayıcı bildirim izni kapalı.'
                  : notificationPermission === 'unsupported'
                  ? 'Bu tarayıcı bildirim desteklemiyor.'
                  : 'Hatırlatma için bildirim izni gerekiyor.'}
              </p>
            </div>
          </div>
          {notificationPermission === 'default' && (
            <button
              onClick={onRequestNotificationPermission}
              className="mt-3 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              Bildirime izin ver
            </button>
          )}
          <button
            onClick={onTestNotification}
            className="mt-3 ml-2 bg-white/10 text-white hover:bg-white/15 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
          >
            Test bildirimi gönder
          </button>
        </div>

        <div className="rounded-xl bg-navy-900/50 border border-navy-700/50 p-4">
          <div className="flex items-start gap-3">
            <FiShield className="text-blue-400 mt-0.5" size={18} />
            <div>
              <h3 className="text-white text-sm font-semibold">Etkileşim Kontrolü</h3>
              <p className="text-navy-400 text-xs mt-1">Premium için son 30 gün ilaç ve reçete analizi.</p>
            </div>
          </div>
          <button
            onClick={onInteractionCheck}
            disabled={interactionLoading}
            className="mt-3 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
          >
            {interactionLoading ? 'Kontrol ediliyor...' : 'Etkileşim kontrol et'}
          </button>
        </div>
      </div>

      {interactionError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
          <FiAlertCircle className="text-red-300 mt-0.5 flex-shrink-0" size={18} />
          <p className="text-red-200 text-sm">{interactionError}</p>
        </div>
      )}

      {interactionResult && (
        <div className="rounded-xl bg-navy-900/50 border border-navy-700/50 p-5 space-y-4">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <FiShield className="text-blue-300" /> İlaç Etkileşim Sonucu
            </h3>
            <p className="text-navy-300 text-sm mt-2">{interactionResult.summary}</p>
          </div>
          {interactionResult.interactions?.length > 0 && (
            <div className="space-y-2">
              {interactionResult.interactions.map((item, index) => (
                <p key={index} className="text-sm text-navy-300 rounded-lg bg-navy-800/60 border border-navy-700/50 p-3">
                  {item}
                </p>
              ))}
            </div>
          )}
          <div className="prose prose-invert prose-teal max-w-none prose-sm prose-p:text-navy-300 prose-li:text-navy-300">
            <ReactMarkdown>{interactionResult.full_analysis}</ReactMarkdown>
          </div>
        </div>
      )}

      {medications.length === 0 ? renderEmptyState('Bu gün için kaydedilmiş bir ilaç bulunmuyor.') : (
        <div className="space-y-3">
          {medications.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenDetails(item)}
              className="w-full text-left glass bg-navy-900/50 rounded-xl p-4 flex justify-between items-start group hover:border-teal-500/30 transition-colors relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.is_taken ? 'bg-teal-500/60' : 'bg-purple-500/50'}`} />
              <div className="min-w-0 pr-3">
                <h4 className="text-white font-medium flex flex-wrap items-center gap-2">
                  {item.name} <span className="text-navy-400 text-sm font-normal">({item.dosage})</span>
                  {item.ai_scan_summary && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">AI</span>
                  )}
                  {item.is_taken && (
                    <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FiCheckCircle size={11} /> Alındı
                    </span>
                  )}
                </h4>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {item.time_taken && (
                    <span className="flex items-center gap-1 text-teal-400 text-xs bg-teal-500/10 px-2 py-1 rounded-md">
                      <FiClock size={12} /> Alınma: {item.time_taken.substring(0, 5)}
                    </span>
                  )}
                  {item.reminder_enabled && item.reminder_time && (
                    <span className="flex items-center gap-1 text-blue-300 text-xs bg-blue-500/10 px-2 py-1 rounded-md">
                      <FiBell size={12} /> Hatırlatma: {item.reminder_time.substring(0, 5)}
                    </span>
                  )}
                  {item.notes && <span className="text-navy-400 text-sm">{item.notes}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!item.is_taken && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      onMarkTaken(item.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        onMarkTaken(item.id);
                      }
                    }}
                    className="text-teal-300 hover:text-white p-2 transition-all cursor-pointer"
                    title="Alındı işaretle"
                  >
                    <FiCheckCircle size={17} />
                  </span>
                )}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(item.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      onDelete(item.id);
                    }
                  }}
                  className="text-navy-500 hover:text-red-400 p-2 transition-all cursor-pointer"
                >
                  <FiTrash2 size={16} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MedicationDetailModal({ medication, onClose, onUpdate, onDelete, onMarkTaken }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    dosage: '',
    time_taken: '',
    reminder_enabled: false,
    reminder_time: '',
    notes: '',
  });

  useEffect(() => {
    if (!medication) return;

    setIsEditing(false);
    setForm({
      name: medication.name || '',
      dosage: medication.dosage || '',
      time_taken: medication.time_taken?.substring(0, 5) || '',
      reminder_enabled: !!medication.reminder_enabled,
      reminder_time: medication.reminder_time?.substring(0, 5) || '',
      notes: medication.notes || '',
    });
  }, [medication]);

  if (!medication) return null;

  let aiDetails = null;
  try {
    aiDetails = medication.ai_scan_details ? JSON.parse(medication.ai_scan_details) : null;
  } catch {
    aiDetails = null;
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.dosage.trim()) {
      toast.error('İlaç adı ve dozaj gerekli');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(medication.id, {
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        time_taken: form.time_taken || null,
        reminder_enabled: form.reminder_enabled,
        reminder_time: form.reminder_enabled ? (form.reminder_time || form.time_taken || null) : null,
        notes: form.notes || null,
        image_data_url: medication.image_data_url || null,
        ai_scan_summary: medication.ai_scan_summary || null,
        ai_scan_details: medication.ai_scan_details || null,
      });
      toast.success('İlaç güncellendi');
      setIsEditing(false);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İlaç güncellenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`${medication.name} kaydını silmek istiyor musun?`)) return;

    try {
      await onDelete(medication.id);
      toast.success('İlaç silindi');
      onClose();
    } catch {
      toast.error('İlaç silinemedi');
    }
  };

  const handleMarkTaken = async () => {
    try {
      await onMarkTaken(medication.id);
      toast.success('Alındı olarak işaretlendi');
      onClose();
    } catch {
      toast.error('İşaretlenemedi');
    }
  };

  return (
    <ModalContainer isOpen={!!medication} onClose={onClose} title="İlaç Detayı" maxWidth="max-w-3xl">
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-5">
          <div className="rounded-2xl border border-navy-700/60 bg-navy-900/50 min-h-[180px] overflow-hidden flex items-center justify-center">
            {medication.image_data_url ? (
              <img src={medication.image_data_url} alt={medication.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center px-4">
                <FiImage className="mx-auto text-navy-500 mb-3" size={34} />
                <p className="text-navy-400 text-xs">Bu kayıt için görsel eklenmemiş.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!isEditing ? (
              <>
                <div>
                  <h2 className="text-white text-2xl font-semibold flex flex-wrap items-center gap-2">
                    {medication.name}
                    {medication.is_taken && (
                      <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-1 rounded-full flex items-center gap-1">
                        <FiCheckCircle size={12} /> Alındı
                      </span>
                    )}
                    {medication.ai_scan_summary && (
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">AI tarama</span>
                    )}
                  </h2>
                  <p className="text-navy-300 mt-1">{medication.dosage}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoTile label="Kayıt tarihi" value={medication.date} />
                  <InfoTile label="Alınma saati" value={medication.time_taken?.substring(0, 5) || 'Belirtilmedi'} />
                  <InfoTile label="Hatırlatma" value={medication.reminder_enabled ? (medication.reminder_time?.substring(0, 5) || 'Aktif') : 'Kapalı'} />
                  <InfoTile label="Oluşturulma" value={medication.created_at ? new Date(medication.created_at).toLocaleString('tr-TR') : '-'} />
                </div>

                {medication.notes && (
                  <div className="rounded-xl bg-navy-900/50 border border-navy-700/50 p-4">
                    <p className="text-navy-400 text-xs mb-1">Notlar</p>
                    <p className="text-navy-200 text-sm leading-relaxed">{medication.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormInput label="İlaç adı" value={form.name} onChange={(value) => updateField('name', value)} />
                  <FormInput label="Dozaj" value={form.dosage} onChange={(value) => updateField('dosage', value)} />
                  <FormInput label="Alınma saati" type="time" value={form.time_taken} onChange={(value) => updateField('time_taken', value)} />
                  <FormInput label="Hatırlatma saati" type="time" value={form.reminder_time} onChange={(value) => updateField('reminder_time', value)} disabled={!form.reminder_enabled} />
                </div>
                <label className="flex items-center gap-3 rounded-xl bg-navy-900/50 border border-navy-700/50 p-3 text-sm text-navy-200">
                  <input
                    type="checkbox"
                    checked={form.reminder_enabled}
                    onChange={(event) => updateField('reminder_enabled', event.target.checked)}
                    className="accent-teal-500"
                  />
                  Hatırlatma aktif
                </label>
                <div>
                  <label className="block text-navy-300 text-sm mb-1.5">Notlar</label>
                  <textarea
                    value={form.notes}
                    onChange={(event) => updateField('notes', event.target.value)}
                    rows="3"
                    className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {(medication.ai_scan_summary || aiDetails) && (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 space-y-4">
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                <FiShield className="text-blue-300" /> AI Tarama Analizi
              </h3>
              {medication.ai_scan_summary && (
                <p className="text-navy-200 text-sm mt-2">{medication.ai_scan_summary}</p>
              )}
            </div>

            {aiDetails?.candidate && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoTile label="AI aday adı" value={aiDetails.candidate.name || '-'} />
                <InfoTile label="AI doz" value={aiDetails.candidate.dosage || '-'} />
                <InfoTile label="Kullanım" value={aiDetails.candidate.usage || '-'} />
                <InfoTile label="Güven" value={`%${Math.round((aiDetails.candidate.confidence || 0) * 100)}`} />
              </div>
            )}

            {aiDetails?.warnings?.length > 0 && (
              <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3">
                <p className="text-yellow-100 text-xs font-semibold mb-2">Uyarılar</p>
                <div className="space-y-1">
                  {aiDetails.warnings.map((warning, index) => (
                    <p key={index} className="text-yellow-100/90 text-xs">{warning}</p>
                  ))}
                </div>
              </div>
            )}

            {medication.ai_scan_details && !aiDetails && (
              <pre className="text-xs text-navy-300 bg-navy-900/50 border border-navy-700/50 rounded-xl p-3 overflow-x-auto">
                {medication.ai_scan_details}
              </pre>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-3 border-t border-navy-700/50 pt-4">
          <button onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-500/10 text-red-300 hover:bg-red-500/20 text-sm font-semibold transition-colors">
            <FiTrash2 className="inline mr-2" /> Sil
          </button>
          <div className="flex flex-wrap gap-3">
            {!medication.is_taken && (
              <button onClick={handleMarkTaken} className="px-4 py-2 rounded-xl bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 text-sm font-semibold transition-colors">
                <FiCheckCircle className="inline mr-2" /> Alındı
              </button>
            )}
            {isEditing ? (
              <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-xl bg-teal-500 text-white hover:bg-teal-600 text-sm font-semibold transition-colors disabled:opacity-60">
                <FiSave className="inline mr-2" /> {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 text-sm font-semibold transition-colors">
                <FiEdit3 className="inline mr-2" /> Düzenle
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalContainer>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-xl bg-navy-900/50 border border-navy-700/50 p-3">
      <p className="text-navy-400 text-xs">{label}</p>
      <p className="text-white text-sm font-medium mt-1 break-words">{value}</p>
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', disabled = false }) {
  return (
    <div>
      <label className="block text-navy-300 text-sm mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none disabled:opacity-50 [color-scheme:dark]"
      />
    </div>
  );
}

export default HealthTrackingPage;
