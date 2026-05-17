import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiActivity, FiCalendar, FiClock } from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import useTimelineStore from '../stores/timelineStore';

function TimelinePage() {
  const [days, setDays] = useState(30);
  const { timeline, isLoading, fetchTimeline } = useTimelineStore();

  useEffect(() => {
    fetchTimeline(days).catch(() => {});
  }, [days, fetchTimeline]);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        <section className="glass rounded-3xl border border-navy-700/50 p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center justify-center">
              <FiClock size={22} />
            </div>
            <div>
              <h1 className="text-white text-3xl font-bold">Sağlık Zaman Çizelgesi</h1>
              <p className="text-navy-300 text-sm mt-1">Kayıt, belge, AI analizi ve raporları gün gün tek akışta gör.</p>
            </div>
          </div>
          <select className="rounded-xl border border-navy-700 bg-navy-900/45 text-white px-4 py-3" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Son 7 gün</option>
            <option value={30}>Son 30 gün</option>
            <option value={90}>Son 90 gün</option>
          </select>
        </section>

        <section className="glass rounded-2xl border border-navy-700/50 p-5">
          {isLoading ? (
            <div className="text-navy-300">Yükleniyor...</div>
          ) : !timeline?.groups?.length ? (
            <div className="rounded-2xl border border-dashed border-navy-700 p-8 text-center text-navy-400">Henüz zaman çizelgesi verisi yok.</div>
          ) : (
            <div className="space-y-6">
              {timeline.groups.map((group) => (
                <div key={group.date}>
                  <div className="flex items-center gap-2 mb-3 text-teal-300 font-semibold">
                    <FiCalendar /> {new Date(group.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="space-y-3 border-l border-navy-700 ml-3 pl-5">
                    {group.items.map((item, index) => (
                      <Link key={`${item.kind}-${item.created_at}-${index}`} to={item.route || '/dashboard'} className="block relative rounded-2xl border border-navy-700/60 bg-navy-900/35 hover:bg-navy-800/70 p-4">
                        <span className="absolute -left-[27px] top-5 w-3 h-3 rounded-full bg-teal-400 border-2 border-navy-900" />
                        <div className="flex items-center gap-2 text-navy-400 text-xs mb-1">
                          <FiActivity /> {item.kind_label || item.kind}
                        </div>
                        <p className="text-white font-semibold">{item.title}</p>
                        <p className="text-navy-300 text-sm mt-1">{item.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default TimelinePage;
