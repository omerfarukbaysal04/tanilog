import { format, addDays, subDays, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function Calendar({ selectedDate, onDateSelect, compact = false }) {
  // Gösterilecek günleri hesapla (seçili günden 3 gün önce, 3 gün sonra)
  const days = [];
  for (let i = -3; i <= 3; i++) {
    days.push(addDays(selectedDate, i));
  }

  const handlePrevDay = () => onDateSelect(subDays(selectedDate, 1));
  const handleNextDay = () => onDateSelect(addDays(selectedDate, 1));
  const handleToday = () => onDateSelect(new Date());

  return (
    <div className={`bg-navy-800/60 border border-navy-700/50 rounded-2xl ${compact ? 'p-4 h-full' : 'p-6'}`}>
      <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-6'}`}>
        <h3 className={`text-white font-semibold ${compact ? 'text-base' : 'text-lg'}`}>
          {format(selectedDate, 'MMMM yyyy', { locale: tr })}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="text-xs font-medium text-teal-400 hover:text-teal-300 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 transition-colors"
          >
            Bugün
          </button>
          <div className="flex items-center gap-1 bg-navy-900/50 rounded-lg p-1">
            <button
              onClick={handlePrevDay}
              className="p-1.5 text-navy-400 hover:text-white rounded-md hover:bg-navy-700/50 transition-colors"
            >
              <FiChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 text-navy-400 hover:text-white rounded-md hover:bg-navy-700/50 transition-colors"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className={`flex justify-between items-center overflow-x-auto hide-scrollbar ${compact ? 'gap-1 pb-1' : 'gap-2 pb-2'}`}>
        {days.map((day, index) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={index}
              onClick={() => onDateSelect(day)}
              className={`flex flex-col items-center justify-center rounded-xl transition-all ${compact ? 'min-w-[2.6rem] p-2' : 'min-w-[3rem] p-3'} ${
                isSelected
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                  : isToday
                  ? 'bg-navy-700/50 text-white border border-navy-600/50'
                  : 'text-navy-400 hover:bg-navy-700/30 hover:text-white'
              }`}
            >
              <span className={`text-xs mb-1 ${isSelected ? 'text-teal-100' : 'text-navy-500'}`}>
                {format(day, 'EEE', { locale: tr })}
              </span>
              <span className={`${compact ? 'text-base' : 'text-lg'} font-semibold`}>{format(day, 'd')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
