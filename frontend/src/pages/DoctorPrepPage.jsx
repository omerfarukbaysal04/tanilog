import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClipboard,
  FiDownload,
  FiFileText,
  FiLock,
  FiPauseCircle,
  FiPrinter,
  FiRefreshCw,
  FiSave,
  FiShare2,
  FiVolume2,
  FiTrash2,
} from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import { ModalContainer } from '../components/health/LogModals';
import useAuthStore from '../stores/authStore';
import useDoctorPrepStore from '../stores/doctorPrepStore';
import useNotificationStore from '../stores/notificationStore';

function DoctorPrepPage() {
  const { user } = useAuthStore();
  const pushLocal = useNotificationStore((state) => state.pushLocal);
  const {
    report,
    savedReports,
    isGenerating,
    isLoadingSaved,
    isSaving,
    error,
    createDoctorPrepReport,
    fetchSavedReports,
    loadSavedReport,
    saveCurrentReport,
    deleteSavedReport,
    createShareLink,
    clearError,
  } = useDoctorPrepStore();
  const isPremium = !!user?.is_premium;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechUtteranceRef = useRef(null);
  const speechStopRequestedRef = useRef(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [specialty, setSpecialty] = useState('family');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const printableHtml = useMemo(() => (report ? buildPrintableReport(report) : ''), [report]);

  useEffect(() => () => {
    if ('speechSynthesis' in window) {
      speechStopRequestedRef.current = true;
      speechUtteranceRef.current = null;
      window.speechSynthesis.pause();
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    if (isPremium) fetchSavedReports().catch(() => {});
  }, [fetchSavedReports, isPremium]);

  const handleGenerate = async () => {
    clearError();
    toast('Rapor arka planda hazırlanıyor. Bu sırada sitede gezinmeye devam edebilirsin.');
    try {
      const generatedReport = await createDoctorPrepReport(specialty);
      toast.success('Doktor raporu hazır.');
      pushLocal({
        type: 'doctor_report',
        title: 'Doktor raporu hazır',
        body: generatedReport?.summary || 'Doktora hazırlık raporun oluşturuldu.',
        route: '/doctor-prep',
        priority: 'important',
      });
    } catch {
      // Store handles visible error state.
    }
  };

  const handlePrint = () => {
    if (!report) return;
    const printWindow = window.open('', '_blank', 'width=980,height=1200');
    if (!printWindow) {
      toast.error('PDF penceresi açılamadı. Pop-up iznini kontrol edin.');
      return;
    }
    printWindow.document.write(printableHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const handleOpenPdfPreview = () => {
    if (!report) return;
    setPdfPreviewOpen(true);
  };

  const handleShare = async () => {
    if (!report) return;
    const text = report.share_text || report.summary;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'TanıLog Doktor Raporu', text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Paylaşım metni kopyalandı.');
      }
    } catch {
      toast.error('Paylaşım tamamlanamadı.');
    }
  };

  const handleSave = async () => {
    if (!report) return;
    const title = window.prompt('Rapor adı', report.saved_title || `Doktor Raporu ${report.date_range?.end || ''}`);
    if (!title) return;
    try {
      await saveCurrentReport({ title, report });
      toast.success('Rapor kaydedildi.');
    } catch (error) {
      toast.error(error.message || 'Rapor kaydedilemedi.');
    }
  };

  const handleCreateSecureShare = async () => {
    if (!report) {
      toast.error('Önce rapor oluşturmalısın.');
      return;
    }
    if (sharePassword.length < 4) {
      toast.error('Paylaşım şifresi en az 4 karakter olmalı.');
      return;
    }
    try {
      let reportId = report.saved_report_id;
      if (!reportId) {
        const saved = await saveCurrentReport({
          title: report.saved_title || `Doktor Raporu ${report.date_range?.end || new Date().toISOString().slice(0, 10)}`,
          report,
        });
        reportId = saved.id;
        toast.success('Rapor kaydedildi.');
      }
      const data = await createShareLink({ reportId, password: sharePassword, hours: 24 });
      setShareUrl(data.share_url);
      await navigator.clipboard.writeText(data.share_url);
      toast.success('24 saat geçerli paylaşım linki kopyalandı.');
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Paylaşım linki oluşturulamadı.');
    }
  };

  const handleVoiceSummary = () => {
    if (!report) return;
    if (!('speechSynthesis' in window)) {
      toast.error('Bu tarayıcı sesli özetlemeyi desteklemiyor.');
      return;
    }

    const stopSpeech = () => {
      speechStopRequestedRef.current = true;
      speechUtteranceRef.current = null;
      window.speechSynthesis.pause();
      window.speechSynthesis.cancel();
      window.setTimeout(() => window.speechSynthesis.cancel(), 0);
      window.setTimeout(() => {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
      }, 120);
      setIsSpeaking(false);
    };

    if (isSpeaking || window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      stopSpeech();
      return;
    }

    speechStopRequestedRef.current = true;
    window.speechSynthesis.cancel();
    speechStopRequestedRef.current = false;

    const text = buildVoiceSummary(report);
    const utterance = new SpeechSynthesisUtterance(text);
    speechUtteranceRef.current = utterance;
    utterance.lang = 'tr-TR';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => {
      if (speechUtteranceRef.current === utterance) {
        speechUtteranceRef.current = null;
      }
      setIsSpeaking(false);
    };
    utterance.onerror = (event) => {
      const expectedCancel = speechStopRequestedRef.current || ['interrupted', 'canceled', 'cancelled'].includes(event.error);
      if (speechUtteranceRef.current === utterance) {
        speechUtteranceRef.current = null;
      }
      setIsSpeaking(false);
      if (expectedCancel) return;
      toast.error('Sesli özet okunamadı.');
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleOpenSaved = async (id) => {
    try {
      await loadSavedReport(id);
      toast.success('Kayıtlı rapor açıldı.');
    } catch (error) {
      toast.error(error.message || 'Rapor açılamadı.');
    }
  };

  const handleDeleteSaved = async (id) => {
    if (!window.confirm('Bu kayıtlı raporu silmek istiyor musun?')) return;
    try {
      await deleteSavedReport(id);
      toast.success('Rapor silindi.');
    } catch (error) {
      toast.error(error.message || 'Rapor silinemedi.');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-10">
        <div className="glass-card rounded-2xl border border-navy-700/50 p-6 lg:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Doktora Hazırlan</h1>
              <p className="text-navy-300 text-sm mt-2 max-w-2xl">
                Son 30 günlük sağlık kayıtlarını, ilaçlarını ve analizli belgelerini doktor görüşmesi için profesyonel bir rapora dönüştür.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={specialty}
                onChange={(event) => setSpecialty(event.target.value)}
                className="rounded-xl border border-navy-700 bg-navy-900/60 text-white px-4 py-3 text-sm font-semibold outline-none"
              >
                <option value="family">Aile Hekimi</option>
                <option value="internal">Dahiliye</option>
                <option value="neurology">Nöroloji</option>
                <option value="cardiology">Kardiyoloji</option>
              </select>
              <ActionButton onClick={handleGenerate} disabled={isGenerating} tone="primary">
                {isGenerating ? <FiRefreshCw className="animate-spin" /> : <FiFileText />}
                Rapor Oluştur
              </ActionButton>
              <ActionButton onClick={handleOpenPdfPreview} disabled={!report} tone="light">
                <FiPrinter />
                PDF Önizle
              </ActionButton>
              <ActionButton onClick={handleSave} disabled={!report || isSaving} tone="blue">
                {isSaving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
                Kaydet
              </ActionButton>
              <ActionButton onClick={handleVoiceSummary} disabled={!report} tone="purple">
                {isSpeaking ? <FiPauseCircle /> : <FiVolume2 />}
                {isSpeaking ? 'Durdur' : 'Sesli Özetle'}
              </ActionButton>
              <ActionButton onClick={handleShare} disabled={!report} tone="dark">
                <FiShare2 />
                Paylaş
              </ActionButton>
              <ActionButton onClick={() => setShareModalOpen(true)} disabled={!report || isSaving} tone="dark">
                <FiLock />
                Link Oluştur
              </ActionButton>
            </div>
          </div>
        </div>

        {!isPremium && (
          <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-5 flex gap-3">
            <FiLock className="text-yellow-200 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h2 className="text-yellow-100 font-semibold">Premium özellik</h2>
              <p className="text-yellow-100/80 text-sm mt-1">
                Doktora Hazırlan modu Premium kullanıcılar için açılır. Devam etmek için Premium plana geçebilirsin.
              </p>
              <Link
                to="/billing"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-yellow-400 hover:bg-yellow-300 text-navy-900 px-4 py-2 text-sm font-bold transition-colors"
              >
                Premium'a Geç
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3 text-red-200">
            <FiAlertCircle className="mt-0.5 flex-shrink-0" size={18} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isPremium && (
          <SavedReports
            reports={savedReports}
            isLoading={isLoadingSaved}
            onRefresh={() => fetchSavedReports().catch(() => {})}
            onOpen={handleOpenSaved}
            onDelete={handleDeleteSaved}
          />
        )}

        {!report && !isGenerating && (
          <div className="rounded-2xl border border-dashed border-navy-700 bg-navy-900/30 p-10 text-center">
            <FiClipboard className="mx-auto text-navy-500 mb-4" size={34} />
            <h2 className="text-white font-semibold">Rapor henüz oluşturulmadı</h2>
            <p className="text-navy-400 text-sm mt-2 max-w-xl mx-auto">
              Oluşturduktan sonra özet, dikkat noktaları, doktora sorulacaklar ve PDF’ye hazır tam rapor burada görünür.
            </p>
          </div>
        )}

        {report && (
          <DoctorReport
            report={report}
            onPrint={handleOpenPdfPreview}
            onShare={handleShare}
            onSave={handleSave}
            onVoiceSummary={handleVoiceSummary}
            isSaving={isSaving}
            isSpeaking={isSpeaking}
          />
        )}

        <ModalContainer
          isOpen={pdfPreviewOpen}
          onClose={() => setPdfPreviewOpen(false)}
          title="PDF Önizleme"
          maxWidth="max-w-6xl"
        >
          {report && (
            <PdfPreview
              report={report}
              onPrint={handlePrint}
              onClose={() => setPdfPreviewOpen(false)}
            />
          )}
        </ModalContainer>

        <ModalContainer
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          title="Şifreli Paylaşım Linki"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <p className="text-navy-300 text-sm">
              Bu link 24 saat geçerli olur. Şifreyi doktorunla ayrı bir kanaldan paylaşman daha güvenlidir.
            </p>
            <input
              className="w-full rounded-xl border border-navy-700 bg-navy-900/45 text-white px-4 py-3 outline-none focus:border-teal-500"
              type="password"
              placeholder="Paylaşım şifresi"
              value={sharePassword}
              onChange={(event) => setSharePassword(event.target.value)}
            />
            {shareUrl && (
              <div className="rounded-xl border border-teal-500/20 bg-teal-500/10 p-3 text-teal-100 text-sm break-all">{shareUrl}</div>
            )}
            <button onClick={handleCreateSecureShare} className="w-full rounded-xl bg-teal-500 hover:bg-teal-400 text-white px-4 py-3 font-bold">
              Linki Oluştur ve Kopyala
            </button>
          </div>
        </ModalContainer>
      </div>
    </DashboardLayout>
  );
}

function ActionButton({ children, onClick, disabled, tone }) {
  const classes = {
    primary: 'bg-teal-500 hover:bg-teal-600 text-white',
    light: 'bg-white hover:bg-navy-100 text-navy-900 disabled:bg-navy-700 disabled:text-navy-400',
    blue: 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-100 border border-blue-500/20',
    purple: 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-100 border border-purple-500/20',
    dark: 'bg-navy-800 hover:bg-navy-700 text-navy-100',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 ${classes[tone]}`}
    >
      {children}
    </button>
  );
}

function SavedReports({ reports, isLoading, onRefresh, onOpen, onDelete }) {
  return (
    <section className="glass-card rounded-2xl border border-navy-700/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-white font-semibold">Kayıtlı Raporlar</h2>
          <p className="text-navy-400 text-sm mt-1">Kaydettiğin raporları yeniden açıp okuyabilir veya PDF olarak indirebilirsin.</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-navy-200 text-sm font-semibold transition-colors disabled:opacity-60"
        >
          <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
          Yenile
        </button>
      </div>

      {reports.length === 0 && !isLoading ? (
        <div className="rounded-xl border border-dashed border-navy-700 bg-navy-900/30 p-5 text-center text-sm text-navy-400">
          Henüz kayıtlı doktor raporu yok.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {reports.map((item) => (
            <div key={item.id} className="rounded-xl bg-navy-900/50 border border-navy-700/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-white font-semibold truncate">{item.title}</h3>
                  <p className="text-navy-500 text-xs mt-1">{item.period_start} - {item.period_end}</p>
                </div>
                <button onClick={() => onDelete(item.id)} className="text-navy-500 hover:text-red-300 transition-colors p-1" title="Sil">
                  <FiTrash2 />
                </button>
              </div>
              <p className="text-navy-300 text-sm mt-3 line-clamp-2">{item.summary}</p>
              <button
                onClick={() => onOpen(item.id)}
                className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-200 text-sm font-semibold transition-colors"
              >
                <FiFileText />
                Raporu Aç
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DoctorReport({ report, onPrint, onShare, onSave, onVoiceSummary, isSaving, isSpeaking }) {
  const isCrossAnalysis = report.type === 'cross_analysis';
  const isHealthReport = report.type === 'health_report';

  return (
    <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
      <div className="space-y-5">
        {report.saved_report_id && (
          <div className="rounded-2xl border border-teal-500/25 bg-teal-500/10 p-4 flex items-center gap-3 text-teal-100">
            <FiSave className="flex-shrink-0" />
            <p className="text-sm">Bu rapor kayıtlı: {report.saved_title || `#${report.saved_report_id}`}</p>
          </div>
        )}

        {!isCrossAnalysis && !isHealthReport && (
          <>
            <Panel title="Hasta ve Dönem">
              <div className="grid sm:grid-cols-2 gap-3">
                <Info label="Hasta" value={report.patient?.full_name || '-'} />
                <Info label="E-posta" value={report.patient?.email || '-'} />
                <Info label="Başlangıç" value={report.date_range?.start || '-'} />
                <Info label="Bitiş" value={report.date_range?.end || '-'} />
              </div>
            </Panel>

            <Panel title="Kaynak Özeti">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <Count label="Semptom" value={report.source_counts?.symptoms} />
                <Count label="İlaç" value={report.source_counts?.medications} />
                <Count label="Uyku" value={report.source_counts?.sleep} />
                <Count label="Beslenme" value={report.source_counts?.nutrition} />
                <Count label="Belge" value={report.source_counts?.documents} />
              </div>
            </Panel>
          </>
        )}

        <Panel title="Rapor Özeti">
           {report.date_range && isHealthReport && (
               <p className="text-navy-500 text-xs mb-3 font-semibold">{report.date_range.start} - {report.date_range.end}</p>
           )}
           <p className="text-navy-300 text-sm leading-relaxed">{report.summary}</p>
        </Panel>

        {!isCrossAnalysis && !isHealthReport && (
          <>
            <ListPanel title="Önemli Bulgular" items={report.key_findings} />
            <ListPanel title="Risk / Dikkat Noktaları" items={report.risk_flags} icon="alert" />
            <ListPanel title="Doktoruna Bunları Sor" items={report.doctor_questions} />
            <ListPanel title="Randevu Hazırlık Listesi" items={report.preparation_checklist} />
          </>
        )}

        {isCrossAnalysis && (
          <>
            {report.has_critical_alert && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex gap-3">
                 <FiAlertCircle className="text-red-300 mt-0.5 flex-shrink-0" size={20} />
                 <div>
                    <h4 className="text-red-300 font-semibold text-sm">Kritik uyarı var</h4>
                    <p className="text-red-200/90 text-sm mt-1">{report.critical_findings || 'Dikkat gerektiren bir bulgu işaretlendi.'}</p>
                 </div>
              </div>
            )}
            <ListPanel title="Bağlantılı Bulgular" items={report.linked_findings} />
            <ListPanel title="Öneriler" items={report.recommendations} />
          </>
        )}

        {isHealthReport && (
          <>
            <ListPanel title="Trendler" items={report.trends} />
            <ListPanel title="Öneriler" items={report.recommendations} />
            <ListPanel title="Doktora Sorulacaklar" items={report.doctor_questions} />
          </>
        )}

        <div className="flex flex-wrap gap-3">
          <ActionButton onClick={onPrint} tone="light">
            <FiDownload /> PDF Önizle
          </ActionButton>
          <ActionButton onClick={onSave} disabled={isSaving} tone="blue">
            {isSaving ? <FiRefreshCw className="animate-spin" /> : <FiSave />} Raporu Kaydet
          </ActionButton>
          <ActionButton onClick={onVoiceSummary} tone="purple">
            {isSpeaking ? <FiPauseCircle /> : <FiVolume2 />} {isSpeaking ? 'Özeti Durdur' : 'Sesli Özetle'}
          </ActionButton>
          <ActionButton onClick={onShare} tone="dark">
            <FiShare2 /> Paylaşım Metni
          </ActionButton>
        </div>
      </div>

      <div className="space-y-5">
        <CollapsibleMarkdown title="Tam Rapor" content={report.full_report || report.full_analysis} />
      </div>
    </div>
  );
}

function PdfPreview({ report, onPrint, onClose }) {
  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-5">
      <aside className="space-y-3">
        <div className="rounded-2xl border border-navy-700/50 bg-navy-900/50 p-4">
          <h3 className="text-white font-semibold">PDF’ye hazır</h3>
          <p className="text-navy-400 text-sm mt-2">
            Rapor beyaz A4 düzeninde hazırlanır. Açılan yazdırma ekranında hedef olarak PDF kaydetmeyi seçebilirsin.
          </p>
        </div>
        <button
          onClick={onPrint}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white px-4 py-3 font-semibold transition-colors"
        >
          <FiDownload />
          PDF Olarak Kaydet
        </button>
        <button
          onClick={onClose}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-navy-100 px-4 py-3 font-semibold transition-colors"
        >
          Kapat
        </button>
      </aside>

      <div className="max-h-[72vh] overflow-y-auto bg-navy-950/50 rounded-2xl border border-navy-700/50 p-4">
        <article className="mx-auto bg-white text-slate-900 shadow-2xl rounded-sm w-full max-w-[794px] min-h-[1123px] p-10 font-sans">
          <header className="border-b-4 border-teal-500 pb-5 mb-7">
            <p className="text-teal-700 text-sm font-bold tracking-wide">TanıLog</p>
            <h1 className="text-3xl font-bold mt-2">Doktora Hazırlık Raporu</h1>
            <p className="text-slate-500 text-sm mt-2">
              {report.patient?.full_name || '-'} · {report.date_range?.start || '-'} - {report.date_range?.end || '-'}
            </p>
          </header>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 mb-6">
            <h2 className="text-lg font-bold text-teal-800 mb-2">Özet</h2>
            <p className="text-sm leading-6 text-slate-700">{report.summary}</p>
          </section>

          <PrintableSection title="Önemli Bulgular" items={report.key_findings} />
          <PrintableText title="İlaç Özeti" text={report.medication_summary} />
          <PrintableText title="Belge Özeti" text={report.document_summary} />
          <PrintableSection title="Doktora Sorulacaklar" items={report.doctor_questions} />
          <PrintableSection title="Hazırlık Listesi" items={report.preparation_checklist} />

          <section className="mt-7">
            <h2 className="text-lg font-bold text-teal-800 mb-3">Tam Rapor</h2>
            <div className="text-sm leading-6 text-slate-700 rounded-xl border border-slate-200 p-5 prose prose-slate max-w-none prose-sm prose-headings:text-teal-800 prose-strong:text-slate-900">
              <ReactMarkdown>{(report.full_report || report.full_analysis || '').replace(/\n/g, '\n\n').replace(/\n\n\n+/g, '\n\n')}</ReactMarkdown>
            </div>
          </section>

          <footer className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500">
            Bu rapor bilgilendirme ve randevu hazırlığı içindir; teşhis veya tedavi yerine geçmez.
          </footer>
        </article>
      </div>
    </div>
  );
}

function PrintableSection({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold text-teal-800 mb-3">{title}</h2>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-3 text-sm leading-6 text-slate-700">
            <span className="mt-1 w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PrintableText({ title, text }) {
  if (!text) return null;
  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold text-teal-800 mb-2">{title}</h2>
      <p className="text-sm leading-6 text-slate-700">{text}</p>
    </section>
  );
}

function Panel({ title, children }) {
  return (
    <section className="glass-card rounded-2xl border border-navy-700/50 p-5">
      <h2 className="text-white font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-navy-900/50 border border-navy-700/50 p-3">
      <p className="text-navy-400 text-xs">{label}</p>
      <p className="text-white text-sm font-medium mt-1 break-words">{value}</p>
    </div>
  );
}

function Count({ label, value = 0 }) {
  return (
    <div className="rounded-xl bg-navy-900/50 border border-navy-700/50 p-3 text-center">
      <p className="text-white text-xl font-bold">{value ?? 0}</p>
      <p className="text-navy-400 text-xs mt-1">{label}</p>
    </div>
  );
}

function ListPanel({ title, items, icon }) {
  if (!items || items.length === 0) return null;
  return (
    <Panel title={title}>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="flex gap-3 rounded-xl bg-navy-900/50 border border-navy-700/50 p-3">
            <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5 ${
              icon === 'alert' ? 'bg-yellow-500/10 text-yellow-200' : 'bg-teal-500/10 text-teal-300'
            }`}>
              {icon === 'alert' ? <FiAlertCircle size={13} /> : <FiCheckCircle size={13} />}
            </span>
            <p className="text-navy-300 text-sm leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function buildPrintableReport(report) {
  const escape = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const list = (items) => (items || []).map((item) => `<li>${escape(item)}</li>`).join('');
  const reportHtml = markdownToPrintHtml(report.full_report || report.full_analysis || '');

  const isCrossAnalysis = report.type === 'cross_analysis';
  const isHealthReport = report.type === 'health_report';

  let title = 'Doktora Hazırlık Raporu';
  if (isCrossAnalysis) title = 'Sağlık Verileri Çapraz Analizi';
  if (isHealthReport) title = 'Sağlık Raporu';

  let dynamicSections = '';
  
  if (isCrossAnalysis) {
    if (report.related_findings?.length) {
      dynamicSections += `<h2>Bağlantılı Bulgular</h2><ul>${list(report.related_findings)}</ul>`;
    }
    if (report.recommendations?.length) {
      dynamicSections += `<h2>Öneriler</h2><ul>${list(report.recommendations)}</ul>`;
    }
    if (report.doctor_questions?.length) {
      dynamicSections += `<h2>Doktora Sorulacaklar</h2><ul>${list(report.doctor_questions)}</ul>`;
    }
    if (report.risk_flags?.length) {
      dynamicSections += `<h2>Dikkat Noktaları</h2><ul class="alert">${list(report.risk_flags)}</ul>`;
    }
  } else if (isHealthReport) {
    if (report.trends?.length) {
      dynamicSections += `<h2>Trendler</h2><ul>${list(report.trends)}</ul>`;
    }
    if (report.recommendations?.length) {
      dynamicSections += `<h2>Öneriler</h2><ul>${list(report.recommendations)}</ul>`;
    }
  } else {
    if (report.key_findings?.length) {
      dynamicSections += `<h2>Önemli Bulgular</h2><ul>${list(report.key_findings)}</ul>`;
    }
    if (report.medication_summary) {
      dynamicSections += `<h2>İlaç Özeti</h2><p>${escape(report.medication_summary)}</p>`;
    }
    if (report.document_summary) {
      dynamicSections += `<h2>Belge Özeti</h2><p>${escape(report.document_summary)}</p>`;
    }
    if (report.doctor_questions?.length) {
      dynamicSections += `<h2>Doktora Sorulacaklar</h2><ul>${list(report.doctor_questions)}</ul>`;
    }
    if (report.preparation_checklist?.length) {
      dynamicSections += `<h2>Hazırlık Listesi</h2><ul>${list(report.preparation_checklist)}</ul>`;
    }
  }

  const patientInfo = report.patient?.full_name ? escape(report.patient.full_name) + ' • ' : '';
  const dateInfo = escape(report.date_range?.start || '') + ' - ' + escape(report.date_range?.end || '');

  return `
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>TanıLog - ${title}</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #334155; line-height: 1.6; }
    header { border-bottom: 3px solid #0fb8a5; padding-bottom: 14px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: 26px; color: #0f172a; }
    h2 { margin-top: 24px; color: #0f766e; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
    h3 { margin-top: 18px; color: #0f766e; font-size: 15px; margin-bottom: 8px; }
    p { margin: 10px 0; color: #475569; }
    .muted { color: #64748b; font-size: 13px; margin-top: 6px; }
    .box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 16px 0; background-color: #f8fafc; }
    .box h2 { margin-top: 0; border: none; font-size: 18px; color: #0f766e; }
    ul { padding-left: 0; list-style: none; margin: 12px 0; }
    ul.alert li::before { color: #eab308; }
    li { margin: 8px 0; padding-left: 24px; position: relative; color: #475569; }
    li::before { content: '•'; color: #0fb8a5; font-size: 20px; font-weight: bold; position: absolute; left: 6px; top: -2px; }
    strong { color: #0f766e; font-weight: 600; }
    .footer { margin-top: 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <p class="muted">${patientInfo}${dateInfo}</p>
  </header>
  <section class="box">
    <h2>Özet</h2>
    <p>${escape(report.summary)}</p>
  </section>
  
  ${dynamicSections}
  
  <h2>Tam Rapor</h2>
  <div class="box">${reportHtml}</div>
  <p class="footer">Bu rapor bilgilendirme ve doktor randevusuna hazırlık içindir; tıbbi teşhis veya tedavi yerine geçmez.</p>
</body>
</html>`;
}

function markdownToPrintHtml(markdown) {
  const escape = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const inline = (value) => escape(value).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  const html = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      html.push('</ul>');
      listOpen = false;
    }
  };

  String(markdown || '').split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      return;
    }

    if (line.startsWith('### ')) {
      closeList();
      html.push(`<h3>${inline(line.slice(4))}</h3>`);
      return;
    }

    if (line.startsWith('## ')) {
      closeList();
      html.push(`<h2>${inline(line.slice(3))}</h2>`);
      return;
    }

    if (line.startsWith('# ')) {
      closeList();
      html.push(`<h2>${inline(line.slice(2))}</h2>`);
      return;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!listOpen) {
        html.push('<ul>');
        listOpen = true;
      }
      html.push(`<li>${inline(line.slice(2))}</li>`);
      return;
    }

    closeList();
    html.push(`<p>${inline(line)}</p>`);
  });

  closeList();
  return html.join('\n');
}

function buildVoiceSummary(report) {
  const findings = (report.key_findings || []).slice(0, 4).join('. ');
  const questions = (report.doctor_questions || []).slice(0, 5).join('. ');
  const risks = (report.risk_flags || []).slice(0, 3).join('. ');

  return [
    'TanıLog doktor hazırlık raporu sesli özeti.',
    report.summary,
    findings ? `Öne çıkan bulgular: ${findings}.` : '',
    risks ? `Dikkat noktaları: ${risks}.` : '',
    report.medication_summary ? `İlaç özeti: ${report.medication_summary}.` : '',
    questions ? `Doktoruna sorabileceğin sorular: ${questions}.` : '',
    'Bu sesli özet bilgilendirme amaçlıdır; teşhis veya tedavi yerine geçmez.',
  ].filter(Boolean).join(' ');
}


function CollapsibleMarkdown({ title, content }) {
  if (!content) return null;
  const formattedContent = content.replace(/\n/g, '\n\n').replace(/\n\n\n+/g, '\n\n');

  return (
    <div className="rounded-2xl border border-navy-700/50 overflow-hidden bg-navy-900/30">
      <div className="px-5 py-4 border-b border-navy-700/50 bg-navy-900/60">
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>
      <div className="px-5 py-5">
        <div className="prose prose-invert prose-teal max-w-none prose-sm prose-headings:text-white prose-headings:font-semibold prose-p:text-navy-300 prose-li:text-navy-300 prose-strong:text-teal-200 prose-h2:text-base prose-h3:text-sm">
          <ReactMarkdown>{formattedContent}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default DoctorPrepPage;
