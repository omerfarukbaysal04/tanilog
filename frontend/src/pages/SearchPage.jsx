import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiAlertTriangle, FiFilter, FiSearch } from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import useSearchStore from '../stores/searchStore';

const categories = [
  ['all', 'Tümü'],
  ['symptom', 'Semptom'],
  ['medication', 'İlaç'],
  ['sleep', 'Uyku'],
  ['nutrition', 'Beslenme'],
  ['document', 'Belge'],
  ['report', 'Rapor'],
  ['risk', 'Risk'],
];

const kindLabels = {
  symptom: 'Semptom',
  medication: 'İlaç',
  sleep: 'Uyku',
  nutrition: 'Beslenme',
  document: 'Belge',
  report: 'Rapor',
  risk: 'Risk uyarısı',
};

function SearchPage() {
  const { results, isLoading, search } = useSearchStore();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [filters, setFilters] = useState({ q: initialQuery, category: 'all', start_date: '', end_date: '', risky_only: false, document_type: '' });

  useEffect(() => {
    setFilters((prev) => {
      const next = { ...prev, q: initialQuery };
      search(next).catch(() => {});
      return next;
    });
  }, [initialQuery, search]);

  const submit = (event) => {
    event.preventDefault();
    search(filters).catch(() => {});
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        <section className="glass rounded-3xl border border-navy-700/50 p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 flex items-center justify-center">
              <FiSearch size={22} />
            </div>
            <div>
              <h1 className="text-white text-3xl font-bold">Gelişmiş Arama</h1>
              <p className="text-navy-300 text-sm mt-1">Semptom, ilaç, belge, rapor ve risk uyarılarında tek yerden ara.</p>
            </div>
          </div>
          <form onSubmit={submit} className="grid lg:grid-cols-[1.5fr_1fr_1fr_auto] gap-3">
            <input className={inputClass} placeholder="Parol, baş ağrısı, CRP, uyku..." value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
            <select className={inputClass} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
              {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select className={inputClass} value={filters.document_type} onChange={(e) => setFilters({ ...filters, document_type: e.target.value })}>
              <option value="">Belge türü</option>
              <option value="tahlil">Tahlil</option>
              <option value="recete">Reçete</option>
              <option value="epikriz">Epikriz</option>
              <option value="diger">Diğer</option>
            </select>
            <button className="rounded-xl bg-teal-500 hover:bg-teal-400 text-white px-5 py-3 font-bold inline-flex items-center justify-center gap-2">
              <FiFilter /> Ara
            </button>
            <input className={inputClass} type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
            <input className={inputClass} type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
            <label className="rounded-xl border border-navy-700 bg-navy-900/45 px-4 py-3 text-navy-200 flex items-center gap-2">
              <input type="checkbox" checked={filters.risky_only} onChange={(e) => setFilters({ ...filters, risky_only: e.target.checked })} />
              Sadece riskli kayıtlar
            </label>
          </form>
        </section>

        <section className="glass rounded-2xl border border-navy-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-xl">Sonuçlar</h2>
            {isLoading && <span className="text-navy-400 text-sm">Aranıyor...</span>}
          </div>
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-navy-700 p-8 text-center text-navy-400">Sonuç bulunamadı.</div>
          ) : (
            <div className="space-y-3">
              {results.map((item, index) => (
                <Link key={`${item.kind}-${item.created_at}-${index}`} to={item.route || '/dashboard'} className="block rounded-2xl border border-navy-700/60 bg-navy-900/35 hover:bg-navy-800/70 p-4 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold">{item.title}</p>
                      <p className="text-navy-300 text-sm mt-1">{item.description}</p>
                      <p className="text-navy-500 text-xs mt-2">{kindLabels[item.kind] || item.kind}</p>
                    </div>
                    {item.is_risky && <span className="text-yellow-300"><FiAlertTriangle /></span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

const inputClass = 'w-full rounded-xl border border-navy-700 bg-navy-900/45 text-white placeholder:text-navy-500 px-4 py-3 outline-none focus:border-teal-500/60';

export default SearchPage;
