import { useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { FiFileText, FiLock } from 'react-icons/fi';
import api from '../lib/api';

function SharedDoctorReportPage() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [report, setReport] = useState(null);
  const [isLoading, setLoading] = useState(false);

  const open = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post(`/ai/doctor-prep/shared/${token}`, { password });
      setReport(data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Rapor açılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white font-poppins p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="glass rounded-3xl border border-navy-700/50 p-6 flex items-center gap-4">
          <img src="/logos/logo-white-text.png" alt="TanıLog" className="h-14" />
          <div>
            <h1 className="text-2xl font-bold">Paylaşılan Doktor Raporu</h1>
            <p className="text-navy-300 text-sm">Bu bağlantı süreli ve şifre korumalıdır.</p>
          </div>
        </header>

        {!report ? (
          <form onSubmit={open} className="glass rounded-2xl border border-navy-700/50 p-6 space-y-4 max-w-lg">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 flex items-center justify-center">
              <FiLock size={22} />
            </div>
            <label className="block">
              <span className="text-navy-300 text-sm">Paylaşım şifresi</span>
              <input className="mt-2 w-full rounded-xl border border-navy-700 bg-navy-900/45 text-white px-4 py-3 outline-none focus:border-teal-500" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <button disabled={isLoading} className="rounded-xl bg-teal-500 hover:bg-teal-400 text-white px-5 py-3 font-bold">
              {isLoading ? 'Açılıyor...' : 'Raporu Aç'}
            </button>
          </form>
        ) : (
          <article className="glass rounded-2xl border border-navy-700/50 p-6">
            <div className="flex items-center gap-3 mb-5">
              <FiFileText className="text-teal-300" size={24} />
              <div>
                <h2 className="text-xl font-bold">{report.saved_title || 'Doktor Raporu'}</h2>
                <p className="text-navy-400 text-sm">{report.date_range?.start} - {report.date_range?.end}</p>
              </div>
            </div>
            <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-navy-100 prose-li:text-navy-100">
              <ReactMarkdown>{report.full_report_markdown || report.markdown_report || report.summary || ''}</ReactMarkdown>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

export default SharedDoctorReportPage;
