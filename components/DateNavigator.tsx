
import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({ selectedDate, onDateChange }) => {
  const changeDate = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    onDateChange(newDate);
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      // Parse YYYY-MM-DD manually to create a local date object
      const [year, month, day] = e.target.value.split('-').map(Number);
      onDateChange(new Date(year, month - 1, day));
    }
  };

  // Format date for input value (YYYY-MM-DD) to handle timezone correctly
  const d = new Date(selectedDate);
  const year = d.getFullYear();
  const inputMonth = String(d.getMonth() + 1).padStart(2, '0');
  const inputDay = String(d.getDate()).padStart(2, '0');
  const dateInputValue = `${year}-${inputMonth}-${inputDay}`;

  const isToday = new Date(selectedDate).setHours(0,0,0,0) === new Date().setHours(0,0,0,0);
  
  // Custom display format: 10/24 週四
  const displayMonth = d.getMonth() + 1;
  const displayDate = d.getDate();
  const weekday = d.toLocaleDateString('zh-TW', { weekday: 'short' });
  const dateString = `${displayMonth}/${displayDate} ${weekday}`;
  const fullDisplayDate = isToday ? `今日 (${dateString})` : dateString;

  return (
    <div className="flex items-center justify-between px-1 gap-3 mb-2">
      <button 
        onClick={() => changeDate(-1)}
        className="p-3 bg-blue-50 border border-blue-100 shadow-sm rounded-2xl text-blue-600 hover:bg-blue-100 hover:border-blue-200 transition-all active:scale-95 flex-shrink-0"
        title="上一天"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <div className="flex flex-col items-center flex-1 min-w-0">
        <div className="relative group w-full max-w-[200px]">
          <div className="flex items-center justify-center gap-2 font-bold text-slate-800 text-lg cursor-pointer bg-white border border-slate-200 shadow-sm px-4 py-3 rounded-2xl group-hover:border-secondary group-hover:text-secondary group-hover:bg-blue-50 transition-all">
            <Calendar className="w-5 h-5 text-slate-400 group-hover:text-secondary transition-colors" />
            <span className="truncate">{fullDisplayDate}</span>
          </div>
          {/* Hidden date input overlaid for picker functionality */}
          <input
            type="date"
            value={dateInputValue}
            onChange={handleDateInputChange}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            title="選擇日期"
          />
        </div>
        
        {!isToday && (
           <button 
             onClick={() => onDateChange(new Date())}
             className="text-xs text-secondary font-bold mt-2 px-3 py-1 bg-white border border-blue-100 shadow-sm rounded-full hover:bg-blue-50 transition-all"
           >
             回到今天
           </button>
        )}
      </div>

      <button 
        onClick={() => changeDate(1)}
        disabled={isToday}
        className={`p-3 border shadow-sm rounded-2xl transition-all active:scale-95 flex-shrink-0 ${
          isToday 
            ? 'bg-slate-100 border-slate-100 text-slate-300 cursor-not-allowed' 
            : 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100 hover:border-blue-200'
        }`}
        title="下一天"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};
