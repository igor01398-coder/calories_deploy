import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, Sparkles, X, Loader2, Send, Search, Plus, BookOpen } from 'lucide-react';
import { analyzeFoodWithGemini } from '../services/geminiService';
import { FoodEntry, AnalysisStatus, FoodItem } from '../types';

interface FoodEntryFormProps {
  onAddEntry: (entry: Omit<FoodEntry, 'id'>) => void;
  onSaveCustomFood: (item: FoodItem) => void;
  foodDatabase: FoodItem[];
}

type Tab = 'ai' | 'manual';

const MEAL_TYPES: { value: FoodEntry['mealType']; label: string }[] = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'snack', label: '點心' },
  { value: 'lateNight', label: '宵夜' },
];

export const FoodEntryForm: React.FC<FoodEntryFormProps> = ({ onAddEntry, onSaveCustomFood, foodDatabase }) => {
  const [activeTab, setActiveTab] = useState<Tab>('ai');
  
  const getMealTypeByTime = (): FoodEntry['mealType'] => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 14) return 'lunch';
    if (hour >= 14 && hour < 17) return 'snack';
    if (hour >= 17 && hour < 21) return 'dinner';
    if (hour >= 21 || hour < 5) return 'lateNight';
    return 'snack';
  };

  // AI State
  const [textInput, setTextInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [aiMealType, setAiMealType] = useState<FoodEntry['mealType']>(getMealTypeByTime());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual State
  const [manualForm, setManualForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    unit: '1份',
    mealType: getMealTypeByTime()
  });
  const [saveToDb, setSaveToDb] = useState(false);
  
  // Autocomplete State
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Update meal type when component mounts
  useEffect(() => {
    const currentType = getMealTypeByTime();
    setManualForm(prev => ({ ...prev, mealType: currentType }));
    setAiMealType(currentType);
  }, []);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput && !selectedImage) return;

    setStatus(AnalysisStatus.ANALYZING);

    try {
      const result = await analyzeFoodWithGemini(textInput, selectedImage || undefined);
      
      const newEntry: Omit<FoodEntry, 'id'> = {
        name: result.name,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        timestamp: Date.now(),
        imageUrl: selectedImage || undefined,
        description: textInput,
        mealType: aiMealType, // Use the user-selected meal type
      };

      onAddEntry(newEntry);
      
      // Reset form
      setTextInput('');
      setSelectedImage(null);
      // Reset meal type to current time for next entry
      setAiMealType(getMealTypeByTime());
      setStatus(AnalysisStatus.SUCCESS);
      setTimeout(() => setStatus(AnalysisStatus.IDLE), 2000);
      
    } catch (error) {
      console.error(error);
      setStatus(AnalysisStatus.ERROR);
      setTimeout(() => setStatus(AnalysisStatus.IDLE), 3000);
    }
  };

  const getSuggestions = (value: string) => {
    if (!value.trim()) return [];
    const searchTerm = value.toLowerCase();
    const numericValue = parseFloat(value);
    const isNumber = !isNaN(numericValue);

    return foodDatabase.filter(item => {
      // 1. Name Match
      const nameMatch = item.name.toLowerCase().includes(searchTerm);
      
      // 2. Nutrient Match (if input is numeric)
      let nutrientMatch = false;
      if (isNumber) {
        // Define tolerance: +/- 20 for calories, +/- 5 for macros
        const calTolerance = 20;
        const macroTolerance = 5;
        
        nutrientMatch = 
          Math.abs(item.calories - numericValue) <= calTolerance ||
          Math.abs(item.protein - numericValue) <= macroTolerance ||
          Math.abs(item.carbs - numericValue) <= macroTolerance ||
          Math.abs(item.fat - numericValue) <= macroTolerance;
      }

      return nameMatch || nutrientMatch;
    }).slice(0, 50); // Limit results
  };

  const handleAiTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTextInput(value);
    
    if (value.trim()) {
      setSuggestions(getSuggestions(value));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectAiSuggestion = (item: FoodItem) => {
    setTextInput(item.name);
    setShowSuggestions(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualForm(prev => ({ ...prev, name: value }));
    
    if (value.trim()) {
      setSuggestions(getSuggestions(value));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectManualSuggestion = (item: FoodItem) => {
    setManualForm(prev => ({
      ...prev,
      name: item.name,
      calories: item.calories.toString(),
      protein: item.protein.toString(),
      carbs: item.carbs.toString(),
      fat: item.fat.toString(),
      unit: item.unit
    }));
    setShowSuggestions(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name || !manualForm.calories) return;

    const calories = parseInt(manualForm.calories) || 0;
    const protein = parseInt(manualForm.protein) || 0;
    const carbs = parseInt(manualForm.carbs) || 0;
    const fat = parseInt(manualForm.fat) || 0;

    // Add to daily log
    const newEntry: Omit<FoodEntry, 'id'> = {
      name: manualForm.name,
      calories,
      protein,
      carbs,
      fat,
      timestamp: Date.now(),
      mealType: manualForm.mealType,
      description: `手動輸入: ${manualForm.unit}`
    };

    onAddEntry(newEntry);

    // Save to DB if requested
    if (saveToDb) {
      const newItem: FoodItem = {
        id: crypto.randomUUID(),
        name: manualForm.name,
        unit: manualForm.unit,
        calories,
        protein,
        carbs,
        fat,
        isCustom: true
      };
      onSaveCustomFood(newItem);
    }

    // Reset
    setManualForm({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      unit: '1份',
      mealType: getMealTypeByTime()
    });
    setSaveToDb(false);
    alert('已新增記錄！');
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 mb-6 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'ai' 
              ? 'text-primary bg-emerald-50/50 border-b-2 border-primary' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI 智能辨識
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'manual' 
              ? 'text-secondary bg-blue-50/50 border-b-2 border-secondary' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          手動記錄
        </button>
      </div>

      <div className="p-5">
        {activeTab === 'ai' ? (
          <form onSubmit={handleAiSubmit} className="space-y-4">
            {/* Image Preview Area */}
            {selectedImage && (
              <div className="relative w-full h-48 bg-slate-50 rounded-xl overflow-hidden mb-3 group">
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1" ref={activeTab === 'ai' ? wrapperRef : null}>
                  <input
                    type="text"
                    value={textInput}
                    onChange={handleAiTextChange}
                    onFocus={() => {
                        if (textInput.trim()) {
                            setSuggestions(getSuggestions(textInput));
                            setShowSuggestions(true);
                        }
                    }}
                    autoComplete="off"
                    placeholder="例如：一個漢堡和中薯"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner"
                    disabled={status === AnalysisStatus.ANALYZING}
                  />
                   {/* AI Autocomplete Dropdown */}
                   {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                            {suggestions.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => selectAiSuggestion(item)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-none flex justify-between items-center group"
                                >
                                    <div className="font-bold text-slate-800 text-sm group-hover:text-primary">{item.name}</div>
                                    <div className="text-xs text-slate-400">{item.calories} kcal</div>
                                </button>
                            ))}
                        </div>
                    )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-full transition-all flex-shrink-0 ${
                  selectedImage 
                    ? 'bg-blue-100 text-blue-600 border-blue-200 border' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
                disabled={status === AnalysisStatus.ANALYZING}
                title="上傳照片"
              >
                {selectedImage ? <ImageIcon className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              </button>
            </div>

            {/* AI Mode Meal Type Selector */}
            <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setAiMealType(type.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                    aiMealType === type.value
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <button
                type="submit"
                disabled={status === AnalysisStatus.ANALYZING || (!textInput && !selectedImage)}
                className={`w-full py-3 rounded-xl text-white font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                  status === AnalysisStatus.ANALYZING || (!textInput && !selectedImage)
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-primary hover:bg-emerald-600 active:scale-[0.98]'
                }`}
              >
                {status === AnalysisStatus.ANALYZING ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    開始分析
                  </>
                )}
            </button>
            
            {status === AnalysisStatus.ANALYZING && (
              <div className="text-center text-sm text-slate-500 animate-pulse">
                AI 正在辨識圖片與文字內容...
              </div>
            )}
            {status === AnalysisStatus.ERROR && (
              <div className="text-center text-sm text-red-500">
                分析失敗，請檢查網路或重試。
              </div>
            )}
          </form>
        ) : (
          <div className="space-y-4">
            {/* Manual Input Form */}
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                 <div className="col-span-2 relative" ref={activeTab === 'manual' ? wrapperRef : null}>
                    <label className="text-xs font-bold text-slate-500 ml-1">食物名稱</label>
                    <div className="relative">
                        <input
                        required
                        type="text"
                        value={manualForm.name}
                        onChange={handleNameChange}
                        onFocus={() => {
                            if (manualForm.name.trim()) {
                                setSuggestions(getSuggestions(manualForm.name));
                                setShowSuggestions(true);
                            }
                        }}
                        autoComplete="off"
                        className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-secondary transition-all"
                        placeholder="搜尋名稱或營養素數值..."
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 mt-0.5" />
                    </div>

                    {/* Manual Autocomplete Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                            {suggestions.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => selectManualSuggestion(item)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-none flex justify-between items-center group"
                                >
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm group-hover:text-secondary">{item.name}</div>
                                        <div className="text-xs text-slate-400">{item.unit} • {item.calories} kcal</div>
                                    </div>
                                    <Plus className="w-4 h-4 text-slate-300 group-hover:text-secondary" />
                                </button>
                            ))}
                        </div>
                    )}
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 ml-1">餐別</label>
                    <select
                      value={manualForm.mealType}
                      onChange={e => setManualForm({...manualForm, mealType: e.target.value as any})}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 focus:outline-none focus:border-secondary text-sm appearance-none"
                    >
                      <option value="breakfast">早餐</option>
                      <option value="lunch">午餐</option>
                      <option value="dinner">晚餐</option>
                      <option value="snack">點心</option>
                      <option value="lateNight">宵夜</option>
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                  <label className="text-xs font-bold text-slate-500 ml-1">份量/單位</label>
                  <input
                    required
                    type="text"
                    value={manualForm.unit}
                    onChange={e => setManualForm({...manualForm, unit: e.target.value})}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-secondary"
                    placeholder="例如: 1碗"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 ml-1">熱量 (kcal)</label>
                  <input
                    required
                    type="number"
                    value={manualForm.calories}
                    onChange={e => setManualForm({...manualForm, calories: e.target.value})}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-secondary font-mono"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 ml-1">蛋白質(g)</label>
                  <input
                    type="number"
                    value={manualForm.protein}
                    onChange={e => setManualForm({...manualForm, protein: e.target.value})}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary text-center"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 ml-1">碳水(g)</label>
                  <input
                    type="number"
                    value={manualForm.carbs}
                    onChange={e => setManualForm({...manualForm, carbs: e.target.value})}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary text-center"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 ml-1">脂肪(g)</label>
                  <input
                    type="number"
                    value={manualForm.fat}
                    onChange={e => setManualForm({...manualForm, fat: e.target.value})}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary text-center"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                 <input
                   type="checkbox"
                   id="saveToDb"
                   checked={saveToDb}
                   onChange={e => setSaveToDb(e.target.checked)}
                   className="w-4 h-4 rounded text-secondary focus:ring-secondary border-gray-300"
                 />
                 <label htmlFor="saveToDb" className="text-sm text-slate-600 cursor-pointer select-none">
                   同時儲存到「我的食物庫」
                 </label>
              </div>

              <button
                type="submit"
                className="w-full bg-secondary hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                加入記錄
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};