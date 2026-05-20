import { create } from 'zustand';
import { Alert, Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import api from '../lib/api';
import { DoctorPrepReport, SavedDoctorReport } from '../types';

// ─── PDF kütüphaneleri — native build gerektirir, yoksa sessizce devre dışı ────
let Print: typeof import('expo-print') | null = null;
let Sharing: typeof import('expo-sharing') | null = null;
try { Print = require('expo-print'); } catch { /* Yeni build'de kullanılabilir */ }
try { Sharing = require('expo-sharing'); } catch { /* Yeni build'de kullanılabilir */ }

// ─── Yardımcılar ────────────────────────────────────────────────────────────────
function buildHtml(report: any, title: string): string {
  const ul = (items: string[]) => items.map((i) => `<li style="margin-bottom:6px">${i}</li>`).join('');
  return `<!DOCTYPE html><html lang="tr">
<head><meta charset="utf-8"><title>${title}</title>
<style>
  body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;color:#1a2233;line-height:1.7}
  h1{color:#0fb8a5;font-size:1.6rem;margin-bottom:4px}
  h2{color:#1e40af;font-size:1.05rem;margin-top:28px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
  .risk h2{color:#dc2626}
  p.summary{background:#f0fdfa;border-left:4px solid #0fb8a5;padding:14px 18px;border-radius:6px;margin:18px 0}
  ul{padding-left:20px} li{margin-bottom:6px}
  footer{margin-top:40px;font-size:.75rem;color:#94a3b8;text-align:center}
</style></head>
<body>
<h1>📋 ${title}</h1>
${report.date_range ? `<p style="color:#64748b;font-size:.85rem">Dönem: ${report.date_range.start} – ${report.date_range.end}</p>` : ''}
<p class="summary">${report.summary || ''}</p>
${report.key_findings?.length ? `<h2>🔑 Kilit Bulgular</h2><ul>${ul(report.key_findings)}</ul>` : ''}
${report.risk_flags?.length ? `<section class="risk"><h2>⚠️ Risk Uyarıları</h2><ul>${ul(report.risk_flags)}</ul></section>` : ''}
${report.doctor_questions?.length ? `<h2>❓ Doktora Soracağın Sorular</h2><ul>${ul(report.doctor_questions)}</ul>` : ''}
${report.preparation_checklist?.length ? `<h2>✅ Hazırlık Listesi</h2><ul>${ul(report.preparation_checklist)}</ul>` : ''}
<footer>TanıLog ile oluşturuldu · ${new Date().toLocaleDateString('tr-TR')}</footer>
</body></html>`;
}

function buildText(report: any, title: string): string {
  return [
    `📋 ${title}`,
    report.date_range ? `Dönem: ${report.date_range.start} – ${report.date_range.end}` : '',
    `\n📝 Özet:\n${report.summary}`,
    report.key_findings?.length ? `\n🔑 Kilit Bulgular:\n${report.key_findings.map((f: string) => `• ${f}`).join('\n')}` : '',
    report.risk_flags?.length ? `\n⚠️ Risk Uyarıları:\n${report.risk_flags.map((f: string) => `• ${f}`).join('\n')}` : '',
    report.doctor_questions?.length ? `\n❓ Doktora Sorular:\n${report.doctor_questions.map((q: string) => `• ${q}`).join('\n')}` : '',
    report.preparation_checklist?.length ? `\n✅ Hazırlık:\n${report.preparation_checklist.map((c: string) => `• ${c}`).join('\n')}` : '',
    '\n\nTanıLog ile oluşturuldu.',
  ].filter(Boolean).join('\n');
}

async function shareAsPdf(report: any, title: string): Promise<void> {
  // expo-print mevcut ise PDF oluştur
  if (Print) {
    try {
      const { uri } = await (Print as any).printToFileAsync({ html: buildHtml(report, title), base64: false });
      if (Sharing) {
        const canShare = await (Sharing as any).isAvailableAsync();
        if (canShare) {
          await (Sharing as any).shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `${title}.pdf`,
            UTI: 'com.adobe.pdf',
          });
          return;
        }
      }
      // iOS Share.share url ile
      await Share.share({ url: uri, title, message: title });
      return;
    } catch (printErr: any) {
      console.warn('[pdf] expo-print hatası:', printErr?.message);
    }
  }

  // FileSystem ile HTML olarak kaydet + paylaş
  const cache = FileSystem.cacheDirectory;
  if (cache) {
    try {
      const safeName = title.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 40);
      const localUri = `${cache}${safeName}-${Date.now()}.html`;
      await FileSystem.writeAsStringAsync(localUri, buildHtml(report, title), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (Sharing) {
        const canShare = await (Sharing as any).isAvailableAsync();
        if (canShare) {
          await (Sharing as any).shareAsync(localUri, { mimeType: 'text/html', dialogTitle: title });
          return;
        }
      }
      // iOS'ta URL ile paylaş
      if (Platform.OS === 'ios') {
        await Share.share({ url: localUri, title });
        return;
      }
    } catch (fsErr: any) {
      console.warn('[pdf] FileSystem hatası:', fsErr?.message);
    }
  }

  // Son çare: metin paylaşımı
  await Share.share({ message: buildText(report, title), title });
}

// ─── Store ─────────────────────────────────────────────────────────────────────
type DoctorPrepState = {
  report: (DoctorPrepReport & Record<string, any>) | null;
  savedReports: SavedDoctorReport[];
  isGenerating: boolean;
  isLoadingSaved: boolean;
  isSaving: boolean;
  isSharingPdf: boolean;
  error: string | null;
  createReport: (specialty: string) => Promise<void>;
  fetchSavedReports: () => Promise<void>;
  openSavedReport: (reportId: number) => Promise<void>;
  saveReport: (title: string) => Promise<void>;
  shareReport: (reportId: number) => Promise<void>;
  shareReportPdf: (reportId: number, title?: string) => Promise<void>;
  shareCurrentAsPdf: () => Promise<void>;
  clearError: () => void;
};

const useDoctorPrepStore = create<DoctorPrepState>((set, get) => ({
  report: null,
  savedReports: [],
  isGenerating: false,
  isLoadingSaved: false,
  isSaving: false,
  isSharingPdf: false,
  error: null,

  createReport: async (specialty) => {
    set({ isGenerating: true, error: null, report: null });
    try {
      const { data } = await api.post('/ai/doctor-prep', { specialty });
      set({ report: data });
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail
        : Array.isArray(detail) ? detail.map((d: any) => d.msg || String(d)).join('; ')
        : typeof detail === 'object' && detail ? JSON.stringify(detail)
        : e.message;
      set({ error: msg });
    } finally {
      set({ isGenerating: false });
    }
  },

  fetchSavedReports: async () => {
    set({ isLoadingSaved: true });
    try {
      const { data } = await api.get<SavedDoctorReport[]>('/ai/doctor-prep/saved');
      set({ savedReports: data });
    } catch {
      /* sessiz */
    } finally {
      set({ isLoadingSaved: false });
    }
  },

  openSavedReport: async (reportId) => {
    set({ isLoadingSaved: true, error: null });
    try {
      // Backend doğrudan parse edilmiş report_json döner + saved_report_id, saved_title
      const { data } = await api.get(`/ai/doctor-prep/saved/${reportId}`);
      set({ report: data });
    } catch (e: any) {
      const detail = e.response?.data?.detail || e.message;
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      set({ error: msg });
      throw new Error(msg);
    } finally {
      set({ isLoadingSaved: false });
    }
  },

  saveReport: async (title) => {
    const { report } = get();
    if (!report) return;

    // date_range backend için zorunlu — yoksa bugünden 30 gün geriye fallback
    const today = new Date().toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const safeReport = {
      ...report,
      date_range: report.date_range ?? { start: monthAgo, end: today },
    };

    set({ isSaving: true, error: null });
    try {
      // Sadece title + report_data gönder — backend bunu beklior
      const { data } = await api.post<SavedDoctorReport>('/ai/doctor-prep/save', {
        title,
        report_data: safeReport,
      });
      set({ savedReports: [data, ...get().savedReports] });
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail
        : Array.isArray(detail) ? detail.map((d: any) => d.msg || String(d)).join('; ')
        : e.message;
      set({ error: msg });
      throw new Error(msg);
    } finally {
      set({ isSaving: false });
    }
  },

  shareReport: async (reportId) => {
    // Rastgele kısa şifre üret — hardcoded credential olmaması için
    const password = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data } = await api.post<{ share_url: string }>(
      `/ai/doctor-prep/saved/${reportId}/share`,
      { password, hours: 24 },
    );
    await Share.share({
      message: `TanıLog doktor raporum:\n${data.share_url}\nŞifre: ${password}`,
      title: 'Doktor Hazırlık Raporumu Paylaş',
    });
  },

  shareReportPdf: async (reportId, title) => {
    set({ isSharingPdf: true });
    try {
      const { data } = await api.get(`/ai/doctor-prep/saved/${reportId}`);
      const pdfTitle = title || data.saved_title || 'Doktor Hazırlık Raporu';
      await shareAsPdf(data, pdfTitle);
    } catch (e: any) {
      const detail = e.response?.data?.detail || e.message;
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      set({ isSharingPdf: false });
    }
  },

  shareCurrentAsPdf: async () => {
    const { report } = get();
    if (!report) return;
    set({ isSharingPdf: true });
    try {
      await shareAsPdf(report, report.saved_title || 'Doktor Hazırlık Raporu');
    } finally {
      set({ isSharingPdf: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useDoctorPrepStore;
