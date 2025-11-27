import React, { useState } from 'react';
import { Droplets, Plus, Minus, CupSoda, Edit3, Check, X } from 'lucide-react';

interface WaterTrackerProps {
  currentAmount: number;
  goal: number;
  onAddWater: (amount: number) => void;
  onRemoveWater: (amount: number) => void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({ currentAmount, goal, onAddWater, onRemoveWater }) => {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const percentage = Math.min(Math.round((currentAmount / goal) * 100), 100);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(customValue);
    if (!isNaN(amount) && amount > 0) {
      onAddWater(amount);
      setCustomValue('');
      setIsCustomMode(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-blue-100 mb-6 p-5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Droplets className="w-32 h-32 text-blue-600" />
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-blue-100 p-1.5 rounded-lg text-blue-500">
              <Droplets className="w-4 h-4" />
            </span>
            飲水記錄
          </h3>
          <p className="text-xs text-slate-400 mt-1">保持水分充足對代謝很重要！</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-blue-600">
            {currentAmount} <span className="text-sm font-medium text-slate-400">/ {goal} ml</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-4 w-full bg-blue-50 rounded-full overflow-hidden mb-6 relative border border-blue-100 z-10">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
          style={{ width: `${percentage}%` }}
        >
          {percentage > 20 && <span className="text-[9px] font-bold text-white shadow-sm">{percentage}%</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10">
        {isCustomMode ? (
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <input
              type="number"
              autoFocus
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="輸入水量 (ml)"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-400"
            />
            <button 
              type="button"
              onClick={() => setIsCustomMode(false)}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <button 
              type="submit"
              disabled={!customValue}
              className="p-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-blue-200"
            >
              <Check className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-4 gap-3 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => onRemoveWater(250)}
              className="col-span-1 py-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-400 font-bold text-sm transition-colors flex flex-col items-center justify-center gap-1 border border-slate-100"
              title="減少記錄"
            >
              <Minus className="w-4 h-4" />
              <span className="text-[10px]">-250</span>
            </button>

            <button 
              onClick={() => onAddWater(250)}
              className="col-span-2 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-sm transition-colors flex flex-col items-center justify-center gap-1 border border-blue-100 active:scale-95"
            >
              <div className="flex items-center gap-1">
                 <Plus className="w-3 h-3" />
                 <CupSoda className="w-4 h-4" />
              </div>
              <span className="text-xs">+ 1杯 (250ml)</span>
            </button>

            <button 
              onClick={() => setIsCustomMode(true)}
              className="col-span-1 py-2 rounded-xl bg-purple-500 text-white hover:bg-purple-600 font-bold text-sm transition-colors flex flex-col items-center justify-center gap-1 shadow-md shadow-purple-200 active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span className="text-[10px]">自訂</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};