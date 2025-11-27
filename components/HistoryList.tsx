import React, { useState } from 'react';
import { FoodEntry } from '../types';
import { Trash2, Clock, Flame, Edit2, X, Save, Coffee, Sun, Moon, Utensils, Star, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface HistoryListProps {
  entries: FoodEntry[];
  onDelete: (id: string) => void;
  onUpdate: (entry: FoodEntry) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ entries, onDelete, onUpdate, selectedDate, onDateChange }) => {
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    mealType: 'breakfast' as FoodEntry['mealType']
  });

  const changeDate = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    onDateChange(newDate);
  };

  const isToday = new Date(selectedDate).setHours(0,0,0,0) === new Date().setHours(0,0,0,0);
  const formattedDate = new Date(selectedDate).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });

  // Group entries by meal type
  const groupedEntries = {
    breakfast: entries.filter(e => e.mealType === 'breakfast'),
    lunch: entries.filter(e => e.mealType === 'lunch'),
    dinner: entries.filter(e => e.mealType === 'dinner'),
    snack: entries.filter(e => e.mealType === 'snack'),
    lateNight: entries.filter(e => e.mealType === 'lateNight'),
  };

  const mealSections: { type: FoodEntry['mealType']; label: string; icon: React.ReactNode; color: string }[] = [
    { type: 'breakfast', label: '早餐', icon: <Coffee className="w-4 h-4" />, color: 'text-amber-500 bg-amber-50' },
    { type: 'lunch', label: '午餐', icon: <Sun className="w-4 h-4" />, color: 'text-orange-500 bg-orange-50' },
    { type: 'dinner', label: '晚餐', icon: <Utensils className="w-4 h-4" />, color: 'text-blue-500 bg-blue-50' },
    { type: 'snack', label: '點心', icon: <Star className="w-4 h-4" />, color: 'text-pink-500 bg-pink-50' },
    { type: 'lateNight', label: '宵夜', icon: <Moon className="w-4 h-4" />, color: 'text-indigo-500 bg-indigo-50' },
  ];

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  };

  const handleEditClick = (entry: FoodEntry) => {
    setEditingEntry(entry);
    setEditForm({
      name: entry.name,
      description: entry.description || '',
      calories: entry.calories.toString(),
      protein: entry.protein.toString(),
      carbs: entry.carbs.toString(),
      fat: entry.fat.toString(),
      mealType: entry.mealType
    });
  };

  const handleEditSave = () => {
    if (!editingEntry) return;

    const updatedEntry: FoodEntry = {
      ...editingEntry,
      name: editForm.name,
      description: editForm.description,
      calories: parseInt(editForm.calories) || 0,
      protein: parseInt(editForm.protein) || 0,
      carbs: parseInt(editForm.carbs) || 0,
      fat: parseInt(editForm.fat) || 0,
      mealType: editForm.mealType
    };

    onUpdate(updatedEntry);
    setEditingEntry(null);
  };

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div className="flex items-center justify-between px-2">
        <button 
          onClick={() => changeDate(-1)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-lg">
            <Calendar className="w-4 h-4 text-secondary" />
            {isToday ? '今日記錄' : formattedDate}
          </div>
          {!isToday && (
             <button 
               onClick={() => onDateChange(new Date())}
               className="text-xs text-secondary font-medium mt-0.5 hover:underline"
             >
               回到今天
             </button>
          )}
        </div>

        <button 
          onClick={() => changeDate(1)}
          disabled={isToday}
          className={`p-2 rounded-full transition-colors ${
            isToday 
              ? 'text-slate-200 cursor-not-allowed' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 border-dashed">
          <p className="text-slate-400">
            {isToday ? '今天還沒有記錄喔，快來新增第一餐吧！' : '這一天沒有飲食記錄。'}
          </p>
        </div>
      ) : (
        <>
          {mealSections.map((section) => {
            const sectionEntries = groupedEntries[section.type];
            if (sectionEntries.length === 0) return null;

            const sectionCalories = sectionEntries.reduce((sum, e) => sum + e.calories, 0);

            return (
              <div key={section.type} className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                {/* Section Header */}
                <div className="flex items-center justify-between px-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${section.color}`}>
                        {section.icon}
                      </div>
                      <span className="font-bold text-slate-700">{section.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                      {sectionCalories} kcal
                    </span>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {sectionEntries.sort((a,b) => a.timestamp - b.timestamp).map((entry) => (
                      <div key={entry.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4 transition-transform hover:scale-[1.01]">
                        {/* Image Thumbnail */}
                        <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                          {entry.imageUrl ? (
                            <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              🥗
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="pr-2">
                              <h4 className="font-bold text-slate-800 leading-tight break-words">{entry.name}</h4>
                            </div>
                            <div className="flex items-center gap-1 -mr-2 flex-shrink-0">
                              <button 
                                onClick={() => handleEditClick(entry)}
                                className="text-slate-300 hover:text-secondary p-1.5 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => onDelete(entry.id)}
                                className="text-slate-300 hover:text-red-400 p-1.5 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1 text-orange-500 font-semibold bg-orange-50 px-1.5 py-0.5 rounded-md flex-shrink-0">
                              <Flame className="w-3 h-3" />
                              {entry.calories} kcal
                            </span>
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              {formatTime(entry.timestamp)}
                            </span>
                          </div>

                          <div className="flex gap-2 mt-2 text-[10px] text-slate-400">
                            <span>P: {entry.protein}g</span>
                            <span>C: {entry.carbs}g</span>
                            <span>F: {entry.fat}g</span>
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-secondary" />
                編輯記錄
              </h3>
              <button onClick={() => setEditingEntry(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 ml-1">食物名稱</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-secondary text-slate-800"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 ml-1">餐別</label>
                    <select
                      value={editForm.mealType}
                      onChange={e => setEditForm({...editForm, mealType: e.target.value as any})}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 focus:outline-none focus:border-secondary text-slate-800 text-sm"
                    >
                      <option value="breakfast">早餐</option>
                      <option value="lunch">午餐</option>
                      <option value="dinner">晚餐</option>
                      <option value="snack">點心</option>
                      <option value="lateNight">宵夜</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 ml-1">備註 / 份量</label>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-secondary text-slate-800"
                      placeholder="例如：1碗"
                    />
                  </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 ml-1">熱量 (kcal)</label>
                <input
                  type="number"
                  value={editForm.calories}
                  onChange={e => setEditForm({...editForm, calories: e.target.value})}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-secondary text-slate-800 font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 ml-1">蛋白質</label>
                  <input
                    type="number"
                    value={editForm.protein}
                    onChange={e => setEditForm({...editForm, protein: e.target.value})}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:border-secondary text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 ml-1">碳水</label>
                  <input
                    type="number"
                    value={editForm.carbs}
                    onChange={e => setEditForm({...editForm, carbs: e.target.value})}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:border-secondary text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 ml-1">脂肪</label>
                  <input
                    type="number"
                    value={editForm.fat}
                    onChange={e => setEditForm({...editForm, fat: e.target.value})}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:border-secondary text-slate-800"
                  />
                </div>
              </div>

              <button
                onClick={handleEditSave}
                className="w-full bg-secondary hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
              >
                <Save className="w-5 h-5" />
                儲存變更
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};