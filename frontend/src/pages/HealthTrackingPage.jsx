import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { FiActivity, FiPlus, FiHeart, FiCoffee, FiTrash2, FiClock } from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import Calendar from '../components/health/Calendar';
import useHealthStore from '../stores/healthStore';
import { SymptomModal, MedicationModal, SleepModal, NutritionModal } from '../components/health/LogModals';

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
    addMedication, deleteMedication,
    addSleep, deleteSleep,
    addNutrition, deleteNutrition
  } = useHealthStore();

  const [activeTab, setActiveTab] = useState('symptoms');
  
  // Modal States
  const [modals, setModals] = useState({
    symptoms: false,
    medications: false,
    sleep: false,
    nutrition: false
  });

  const openModal = (type) => setModals(prev => ({ ...prev, [type]: true }));
  const closeModal = (type) => setModals(prev => ({ ...prev, [type]: false }));

  useEffect(() => {
    // Component yüklendiğinde bugünün verilerini çek
    setSelectedDate(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');

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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Sağlık Takibi</h1>
          <p className="text-navy-400 text-sm mt-1">Günlük sağlık verilerinizi kaydedin ve takip edin</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sol Kolon: Takvim */}
          <div className="lg:col-span-4 space-y-6">
            <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
            
            {/* Lottie Animasyonlu Motivasyon Kartı */}
            <div className="glass-card bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 rounded-2xl p-6 relative overflow-hidden">
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
          <div className="lg:col-span-8">
            <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-full min-h-[500px] relative">
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
                      <button
                        onClick={() => openModal(activeTab)}
                        className="bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-xl transition-colors shadow-lg shadow-teal-500/20"
                        title="Yeni Ekle"
                      >
                        <FiPlus size={20} />
                      </button>
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
        </div>
      </div>

      {/* Modallar */}
      <SymptomModal isOpen={modals.symptoms} onClose={() => closeModal('symptoms')} onSave={addSymptom} selectedDate={formattedDate} />
      <MedicationModal isOpen={modals.medications} onClose={() => closeModal('medications')} onSave={addMedication} selectedDate={formattedDate} />
      <SleepModal isOpen={modals.sleep} onClose={() => closeModal('sleep')} onSave={addSleep} selectedDate={formattedDate} />
      <NutritionModal isOpen={modals.nutrition} onClose={() => closeModal('nutrition')} onSave={addNutrition} selectedDate={formattedDate} />

    </DashboardLayout>
  );
}

export default HealthTrackingPage;
