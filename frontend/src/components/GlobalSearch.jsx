import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiActivity, FiCoffee, FiFileText, FiHeart, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import useDashboardStore from '../stores/dashboardStore';

const resultIcons = {
  symptom: <FiActivity />,
  medication: <FiPlus />,
  sleep: <FiHeart />,
  nutrition: <FiCoffee />,
  document: <FiFileText />,
  report: <FiFileText />,
};

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  const { searchResults, isSearching, search, clearSearch } = useDashboardStore();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        search(query).catch(() => {});
        setOpen(true);
      } else {
        clearSearch();
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, search, clearSearch]);

  const reset = () => {
    setQuery('');
    setOpen(false);
    clearSearch();
  };

  const openAdvancedSearch = () => {
    const trimmed = query.trim();
    reset();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  };

  return (
    <div ref={wrapperRef} className="relative hidden md:block w-full max-w-md">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              openAdvancedSearch();
            }
          }}
          placeholder="Sağlık verilerinde ara..."
          className="w-full h-10 rounded-xl border border-navy-700/70 bg-navy-900/45 pl-10 pr-10 text-sm text-white placeholder:text-navy-500 outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/10"
        />
        {query && (
          <button
            type="button"
            onClick={reset}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800"
            title="Aramayı temizle"
          >
            <FiX className="mx-auto" />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-12 z-[150] rounded-2xl border border-navy-700 bg-[#102334] shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-navy-700/60 flex items-center justify-between">
            <span className="text-white text-sm font-semibold">Arama Sonuçları</span>
            {isSearching && <span className="text-navy-400 text-xs">Aranıyor...</span>}
          </div>
          <div className="max-h-80 overflow-y-auto hide-scrollbar p-2">
            {!isSearching && searchResults.length === 0 ? (
              <div className="px-4 py-6 text-center text-navy-400 text-sm">Sonuç bulunamadı.</div>
            ) : (
              searchResults.map((item, index) => (
                <Link
                  key={`${item.kind}-${item.created_at}-${index}`}
                  to={item.route || '/dashboard'}
                  onClick={reset}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-navy-800/80 transition-colors"
                >
                  <span className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 flex items-center justify-center">
                    {resultIcons[item.kind] || <FiSearch />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-white text-sm font-semibold truncate">{item.title}</span>
                    <span className="block text-navy-400 text-xs truncate">{item.description}</span>
                  </span>
                </Link>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={openAdvancedSearch}
            className="w-full border-t border-navy-700/60 px-4 py-3 text-left text-sm font-semibold text-teal-300 hover:bg-navy-800/70 transition-colors"
          >
            Filtrelerle detaylı ara
          </button>
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
