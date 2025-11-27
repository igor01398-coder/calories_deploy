
import React, { useState, useEffect } from 'react';
import { X, Calculator, Activity, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

interface BMRCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile?: UserProfile;
  onSaveProfile: (data: Partial<UserProfile>) => void;
}

export const BMRCalculator: React.FC<BMRCalculatorProps> = ({ 
  isOpen, 
  onClose, 
  currentUserProfile,
  onSaveProfile
}) => {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState<string>(''); // cm
  const [weight, setWeight] = useState<string>(''); // kg
  const [age, setAge] = useState<string>('');
  const [bmr, setBmr] = useState<number | null>(null);
  const [activityLevel, setActivityLevel] = useState<number>(1.2); 

  // Load initial data when modal opens or user profile changes
  useEffect(() => {
    if (isOpen && currentUserProfile) {
      setGender(currentUserProfile.gender || 'male');
      setHeight(currentUserProfile.height?.toString() || '');
      setWeight(currentUserProfile.weight?.toString() || '');
      setAge(currentUserProfile.age?.toString() || '');
      setActivityLevel(currentUserProfile.activityLevel || 1.2);
      
      if (currentUserProfile.bmr) {
        setBmr(currentUserProfile.bmr);
      } else {
        // Try calculate if data exists but BMR wasn't saved
        if (currentUserProfile.height && currentUserProfile.weight && currentUserProfile.age) {
             const h = currentUserProfile.height;
             const w = currentUserProfile.weight;
             const a = currentUserProfile.age;
             let result = 0;
             if ((currentUserProfile.gender || 'male') === 'male') {
                result = (10 * w) + (6.25 * h) - (5 * a) + 5;
             } else {
                result = (10 * w) + (6.25 * h) - (5 * a) - 161;
             }
             setBmr(Math.round(result));
        } else {
            setBmr(null);
        }
      }
    }
  }, [isOpen, currentUserProfile]);

  const calculateBMR = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseFloat(age);

    if (!h || !w || !a) return;

    let result = 0;
    // Mifflin-St Jeor Equation
    if (gender === 'male') {
      result = (10 * w) + (6.25 * h) - (5 * a) + 5;
    } else {
      result = (10 * w) + (6.25 * h) - (5 * a) - 161;
    }

    setBmr(Math.round(result));
  };

  const handleSave = () => {
    if (bmr) {
      const tdee = Math.round(bmr * activityLevel);
      onSaveProfile({
        gender,
        height: parseFloat(height),
        weight: parseFloat(weight),
        age: parseFloat(age),
        activityLevel,
        bmr,
        dailyGoal: tdee
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  const tdee = bmr ? Math.round(bmr * activityLevel) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Calculator className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">BMR 計算器</h2>
              <p className="text-xs text-slate-400">基礎代謝率與每日目標</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto no-scrollbar">
          
          {/* Gender Selection */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setGender('male')}
              className={`py-3 rounded-xl border-2 font-bold transition-all ${
                gender === 'male' 
                  ? 'border-blue-500 bg-blue-50 text-blue-600' 
                  : 'border-slate-100 text-slate-400 hover:bg-slate-50'
              }`}
            >
              男性
            </button>
            <button
              onClick={() => setGender('female')}
              className={`py-3 rounded-xl border-2 font-bold transition-all ${
                gender === 'female' 
                  ? 'border-pink-500 bg-pink-50 text-pink-600' 
                  : 'border-slate-100 text-slate-400 hover:bg-slate-50'
              }`}
            >
              女性
            </button>
          </div>

          {/* Inputs */}
          <div className="space-y-6 mb-8 px-1">
            <div className="grid grid-cols-2 gap-6">
              <div className="relative group">
                <label className="block text-xs font-bold text-slate-500 mb-1 group-focus-within:text-secondary transition-colors">身高</label>
                <div className="relative">
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-slate-200 text-slate-900 font-bold text-2xl py-2 pr-8 focus:outline-none focus:border-secondary transition-colors placeholder:text-slate-200"
                      placeholder="0"
                    />
                    <span className="absolute right-0 bottom-3 text-sm font-bold text-slate-400 pointer-events-none">cm</span>
                </div>
              </div>
              <div className="relative group">
                <label className="block text-xs font-bold text-slate-500 mb-1 group-focus-within:text-secondary transition-colors">體重</label>
                <div className="relative">
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-slate-200 text-slate-900 font-bold text-2xl py-2 pr-8 focus:outline-none focus:border-secondary transition-colors placeholder:text-slate-200"
                      placeholder="0"
                    />
                    <span className="absolute right-0 bottom-3 text-sm font-bold text-slate-400 pointer-events-none">kg</span>
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <label className="block text-xs font-bold text-slate-500 mb-1 group-focus-within:text-secondary transition-colors">年齡</label>
              <div className="relative">
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-slate-200 text-slate-900 font-bold text-2xl py-2 pr-8 focus:outline-none focus:border-secondary transition-colors placeholder:text-slate-200"
                    placeholder="0"
                  />
                  <span className="absolute right-0 bottom-3 text-sm font-bold text-slate-400 pointer-events-none">歲</span>
              </div>
            </div>
          </div>

          <button
            onClick={calculateBMR}
            disabled={!height || !weight || !age}
            className={`w-full py-4 rounded-xl font-bold mb-8 transition-all shadow-lg ${
              !height || !weight || !age 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-slate-800 text-white hover:bg-slate-700 shadow-slate-300'
            }`}
          >
            計算 BMR
          </button>

          {/* Results Section */}
          {bmr !== null && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-center">
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">您的基礎代謝率 (BMR)</div>
                <div className="text-4xl font-black text-slate-800 mb-1">
                  {bmr} <span className="text-base font-medium text-slate-500">kcal</span>
                </div>
                <p className="text-xs text-slate-500">
                  這是您整天躺著不動所消耗的熱量
                </p>
              </div>

              {/* Activity Level / TDEE */}
              <div className="space-y-3 mb-6">
                <label className="block text-xs font-bold text-slate-500 ml-1">選擇您的活動量以計算每日消耗 (TDEE)</label>
                <select 
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(parseFloat(e.target.value))}
                  className="w-full bg-white text-slate-900 font-medium border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-secondary"
                >
                  <option value={1.2}>久坐 (辦公室工作，少運動)</option>
                  <option value={1.375}>輕度活動 (每週運動 1-3 天)</option>
                  <option value={1.55}>中度活動 (每週運動 3-5 天)</option>
                  <option value={1.725}>高度活動 (每週運動 6-7 天)</option>
                  <option value={1.9}>超高度活動 (體力工作或運動員)</option>
                </select>

                <div className="flex justify-between items-center px-2">
                    <span className="text-sm text-slate-500">建議每日攝取目標:</span>
                    <span className="text-xl font-bold text-secondary">{tdee} <span className="text-xs font-normal text-slate-400">kcal</span></span>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-secondary hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                儲存設定
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
