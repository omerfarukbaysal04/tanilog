import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiActivity, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import api from '../../lib/api';

function AIAnalysisModal({ isOpen, onClose, document, onAnalyzeComplete }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && document) {
      setAnalysis(null);
      setError(null);
      fetchOrAnalyze();
    }
  }, [isOpen, document]);

  const fetchOrAnalyze = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/documents/${document.id}/analyze`);
      setAnalysis(response.data);
      if (onAnalyzeComplete) onAnalyzeComplete();
    } catch (err) {
      console.error("AI Analysis Error:", err);
      setError(err.response?.data?.detail || "Analiz sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-navy-800 border border-navy-700/50 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col relative z-10 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-navy-700/50 bg-navy-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
                <FiActivity className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                  Yapay Zeka Analizi <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full border border-teal-500/30">Beta</span>
                </h3>
                <p className="text-navy-400 text-sm truncate max-w-sm">{document?.original_filename}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-navy-400 hover:text-white hover:bg-navy-700 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 border-4 border-teal-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-teal-400 rounded-full border-t-transparent animate-spin"></div>
                  <FiActivity className="absolute inset-0 m-auto text-teal-400 animate-pulse" size={24} />
                </div>
                <h4 className="text-white font-medium text-lg mb-2">Tıbbi Belgeniz İnceleniyor...</h4>
                <p className="text-navy-400 text-center max-w-md">
                  Gemini yapay zekası sonuçlarınızı analiz ediyor, tıbbi terimleri Türkçeleştiriyor ve değerlerinizi yorumluyor. Bu işlem birkaç saniye sürebilir.
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
                  <FiAlertCircle size={32} />
                </div>
                <h4 className="text-white font-medium text-lg mb-2">Analiz Başarısız</h4>
                <p className="text-red-400 text-sm">{error}</p>
                <button 
                  onClick={onClose}
                  className="mt-6 px-6 py-2 bg-navy-700 text-white rounded-lg hover:bg-navy-600 transition-colors"
                >
                  Kapat
                </button>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                {/* Critical Findings Alert */}
                {analysis.has_critical_alert && analysis.critical_findings && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-4"
                  >
                    <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <FiAlertCircle className="text-red-400" size={18} />
                    </div>
                    <div>
                      <h4 className="text-red-400 font-semibold mb-1">Kritik Bulgular Tespit Edildi</h4>
                      <p className="text-red-300 text-sm">{analysis.critical_findings}</p>
                    </div>
                  </motion.div>
                )}

                {!analysis.has_critical_alert && (
                  <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                      <FiCheckCircle className="text-teal-400" size={18} />
                    </div>
                    <div>
                      <h4 className="text-teal-400 font-semibold mb-1">Acil Durum Gözlemlenmedi</h4>
                      <p className="text-teal-300/80 text-sm">Analiz sonucunda kritik veya referans dışı acil bir değer tespit edilmedi.</p>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-navy-900/50 rounded-xl p-5 border border-navy-700/50">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    Özet Değerlendirme
                  </h4>
                  <p className="text-navy-300 text-sm leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                {/* Full Analysis Markdown */}
                <div className="bg-navy-900/50 rounded-xl p-6 border border-navy-700/50">
                  <h4 className="text-white font-medium mb-4 border-b border-navy-700/50 pb-2">
                    Detaylı Analiz
                  </h4>
                  <div className="prose prose-invert prose-teal max-w-none prose-sm sm:prose-base
                    prose-headings:font-semibold prose-headings:text-white
                    prose-a:text-teal-400 hover:prose-a:text-teal-300
                    prose-strong:text-white prose-strong:font-semibold
                    prose-ul:list-disc prose-ol:list-decimal
                    prose-li:text-navy-300
                    prose-p:text-navy-300 prose-p:leading-relaxed"
                  >
                    <ReactMarkdown>{analysis.full_analysis}</ReactMarkdown>
                  </div>
                </div>
                
                <div className="text-center">
                   <p className="text-xs text-navy-500 italic">
                     * Bu analiz yapay zeka tarafından oluşturulmuştur ve tıbbi tavsiye yerine geçmez. Doğru teşhis ve tedavi için her zaman bir sağlık profesyoneline danışın.
                   </p>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default AIAnalysisModal;
