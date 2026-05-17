import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  FiActivity,
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiCpu,
  FiFileText,
  FiRefreshCw,
  FiZap,
} from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import useAIStore from '../stores/aiStore';

const dayOptions = [
  { value: 7, label: 'Son 7 gün' },
  { value: 30, label: 'Son 30 gün' },
  { value: 60, label: 'Son 60 gün' },
];

const reportOptions = [
  { value: 'weekly', label: 'Haftalık' },
  { value: 'monthly', label: 'Aylık' },
];

function AIPage() {
  const {
    analyzedDocuments,
    crossAnalysis,
    healthReport,
    isLoadingDocuments,
    isAnalyzing,
    isGeneratingReport,
    error,
    fetchAnalyzedDocuments,
    createCrossAnalysis,
    createHealthReport,
    clearError,
  } = useAIStore();

  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');

  useEffect(() => {
    fetchAnalyzedDocuments();
  }, [fetchAnalyzedDocuments]);

  useEffect(() => {
    if (!selectedDocumentId && analyzedDocuments.length > 0) {
      setSelectedDocumentId(String(analyzedDocuments[0].id));
    }
  }, [analyzedDocuments, selectedDocumentId]);

  const selectedDocument = useMemo(
    () => analyzedDocuments.find((doc) => String(doc.id) === selectedDocumentId),
    [analyzedDocuments, selectedDocumentId]
  );

  const handleCrossAnalysis = async () => {
    if (!selectedDocumentId) return;
    clearError();
    try {
      await createCrossAnalysis({
        documentId: Number(selectedDocumentId),
        days: Number(selectedDays),
      });
    } catch {
      // Store handles the visible error state.
    }
  };

  const handleReport = async () => {
    clearError();
    try {
      await createHealthReport(selectedPeriod);
    } catch {
      // Store handles the visible error state.
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">AI Analiz</h1>
            <p className="text-navy-300 text-sm mt-2 max-w-2xl">
              Tahlil analizlerini günlük sağlık kayıtlarınla birlikte değerlendir ve haftalık ya da aylık sağlık raporu oluştur.
            </p>
          </div>

          <button
            onClick={fetchAnalyzedDocuments}
            disabled={isLoadingDocuments}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy-800 border border-navy-700 text-navy-200 hover:text-white hover:border-teal-500/40 transition-colors disabled:opacity-60"
          >
            <FiRefreshCw className={isLoadingDocuments ? 'animate-spin' : ''} size={16} />
            Belgeleri Yenile
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3 text-red-200">
            <FiAlertCircle className="mt-0.5 flex-shrink-0" size={18} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <section className="glass-card rounded-2xl border border-navy-700/50 overflow-hidden">
            <div className="p-6 border-b border-navy-700/50 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 flex items-center justify-center">
                <FiZap size={22} />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Semptom-Tahlil Çapraz Analizi</h2>
                <p className="text-navy-400 text-sm mt-1">Analiz edilmiş bir belgeyi son kayıtlarınla birlikte yorumlat.</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="md:col-span-2">
                  <span className="block text-sm text-navy-300 mb-2">Analiz edilmiş belge</span>
                  <select
                    value={selectedDocumentId}
                    onChange={(event) => setSelectedDocumentId(event.target.value)}
                    className="w-full bg-navy-900/70 border border-navy-700 rounded-xl px-4 py-3 text-white outline-none focus:border-teal-500"
                    disabled={isLoadingDocuments || analyzedDocuments.length === 0}
                  >
                    {analyzedDocuments.length === 0 ? (
                      <option value="">Analiz edilmiş belge yok</option>
                    ) : (
                      analyzedDocuments.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.original_filename}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label>
                  <span className="block text-sm text-navy-300 mb-2">Dönem</span>
                  <select
                    value={selectedDays}
                    onChange={(event) => setSelectedDays(Number(event.target.value))}
                    className="w-full bg-navy-900/70 border border-navy-700 rounded-xl px-4 py-3 text-white outline-none focus:border-teal-500"
                  >
                    {dayOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedDocument && (
                <div className="rounded-xl bg-navy-900/50 border border-navy-700/50 p-4">
                  <div className="flex items-start gap-3">
                    <FiFileText className="text-teal-300 mt-0.5 flex-shrink-0" size={18} />
                    <div>
                      <p className="text-white text-sm font-medium">{selectedDocument.original_filename}</p>
                      <p className="text-navy-400 text-xs mt-1">{selectedDocument.summary}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleCrossAnalysis}
                disabled={!selectedDocumentId || isAnalyzing}
                className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-navy-700 disabled:text-navy-400 text-white rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isAnalyzing ? <FiRefreshCw className="animate-spin" /> : <FiActivity />}
                Çapraz Analiz Oluştur
              </button>

              {analyzedDocuments.length === 0 && !isLoadingDocuments && (
                <EmptyState text="Önce Belgelerim sayfasında bir belge yükleyip AI analizini başlatın." />
              )}

              {crossAnalysis && (
                <AnalysisResult data={crossAnalysis} markdownKey="full_analysis" title="Çapraz Analiz Sonucu" />
              )}
            </div>
          </section>

          <section className="glass-card rounded-2xl border border-navy-700/50 overflow-hidden">
            <div className="p-6 border-b border-navy-700/50 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center justify-center">
                <FiCalendar size={22} />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Sağlık Raporu</h2>
                <p className="text-navy-400 text-sm mt-1">Haftalık veya aylık kayıtlarını anlık rapora dönüştür.</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {reportOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedPeriod(option.value)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      selectedPeriod === option.value
                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                        : 'border-navy-700 bg-navy-900/40 text-navy-300 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleReport}
                disabled={isGeneratingReport}
                className="w-full bg-white hover:bg-navy-100 disabled:bg-navy-700 disabled:text-navy-400 text-navy-900 rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isGeneratingReport ? <FiRefreshCw className="animate-spin" /> : <FiCpu />}
                Rapor Oluştur
              </button>

              {!healthReport && !isGeneratingReport && (
                <EmptyState text="Seçili dönem için rapor oluşturduğunda özet, trendler ve doktor soruları burada görünür." />
              )}

              {healthReport && (
                <ReportResult data={healthReport} />
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-navy-700 bg-navy-900/30 p-8 text-center">
      <p className="text-navy-400 text-sm">{text}</p>
    </div>
  );
}

function ListBlock({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="text-white font-semibold text-sm mb-3">{title}</h4>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="flex gap-3 rounded-xl bg-navy-900/50 border border-navy-700/50 p-3">
            <span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-300 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              {index + 1}
            </span>
            <p className="text-navy-300 text-sm leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisResult({ data, markdownKey, title }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <StatusAlert hasAlert={data.has_critical_alert} text={data.critical_findings} />
      <div className="rounded-2xl bg-navy-900/50 border border-navy-700/50 p-5">
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        <p className="text-navy-300 text-sm leading-relaxed">{data.summary}</p>
      </div>
      <ListBlock title="Baglantili Bulgular" items={data.linked_findings} />
      <ListBlock title="Oneriler" items={data.recommendations} />
      <MarkdownPanel title="Detayli Analiz" content={data[markdownKey]} />
      <Disclaimer />
    </motion.div>
  );
}

function ReportResult({ data }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <StatusAlert hasAlert={data.has_critical_alert} />
      <div className="rounded-2xl bg-navy-900/50 border border-navy-700/50 p-5">
        <h3 className="text-white font-semibold mb-2">Rapor Ozeti</h3>
        <p className="text-navy-300 text-sm leading-relaxed">{data.summary}</p>
        {data.date_range && (
          <p className="text-navy-500 text-xs mt-3">
            {data.date_range.start} - {data.date_range.end}
          </p>
        )}
      </div>
      <ListBlock title="Trendler" items={data.trends} />
      <ListBlock title="Oneriler" items={data.recommendations} />
      <ListBlock title="Doktora Sorulacaklar" items={data.doctor_questions} />
      <MarkdownPanel title="Detayli Rapor" content={data.full_report} />
      <Disclaimer />
    </motion.div>
  );
}

function StatusAlert({ hasAlert, text }) {
  if (hasAlert) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex gap-3">
        <FiAlertCircle className="text-red-300 mt-0.5 flex-shrink-0" size={20} />
        <div>
          <h4 className="text-red-300 font-semibold text-sm">Kritik uyarı var</h4>
          <p className="text-red-200/90 text-sm mt-1">{text || 'AI raporu dikkat gerektiren bir bulgu isaretledi.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4 flex gap-3">
      <FiCheckCircle className="text-teal-300 mt-0.5 flex-shrink-0" size={20} />
      <div>
        <h4 className="text-teal-300 font-semibold text-sm">Acil uyarı yok</h4>
        <p className="text-teal-100/80 text-sm mt-1">AI sonucunda acil olarak isaretlenen kritik bir bulgu bulunmuyor.</p>
      </div>
    </div>
  );
}

function MarkdownPanel({ title, content }) {
  if (!content) return null;
  return (
    <div className="rounded-2xl bg-navy-900/50 border border-navy-700/50 p-5">
      <h4 className="text-white font-semibold text-sm mb-4 pb-3 border-b border-navy-700/50">{title}</h4>
      <div className="prose prose-invert prose-teal max-w-none prose-sm prose-headings:text-white prose-p:text-navy-300 prose-li:text-navy-300 prose-strong:text-white">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

function Disclaimer() {
  return (
    <p className="text-center text-xs text-navy-500 italic">
      Bu AI çıktısı bilgilendirme amaçlıdır; teşhis veya tedavi yerine geçmez. Şüpheli durumlarda sağlık profesyoneline danışın.
    </p>
  );
}

export default AIPage;
