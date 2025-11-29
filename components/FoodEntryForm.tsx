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
  
  // New state for quantity scaling
  const [quantity, setQuantity] = useState<number>(1);
  const [baseNutrients, setBaseNutrients] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
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
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return [];

    // Parse input: extract number and optional unit text (e.g. "100g" -> 100, "g")
    // Regex matches: start with number (float/int), optional spaces, then rest of string
    const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    const inputNumber = match ? parseFloat(match[1]) : NaN;
    const inputUnit = match ? match[2].trim() : ''; // e.g. "g", "ml", "kcal", or empty
    const isNumberValid = !isNaN(inputNumber);

    return foodDatabase.filter(item => {
      // 1. Name Match (Standard substring match)
      if (item.name.toLowerCase().includes(trimmed)) return true;

      // 2. Unit Text Match (e.g. input "碗" matches unit "1碗")
      if (item.unit.toLowerCase().includes(trimmed)) return true;

      // 3. Smart Numeric & Unit Matching
      if (isNumberValid) {
        // 3a. Check if the food's unit string contains the number (e.g. input "160" matches unit "160g")
        if (item.unit.includes(inputNumber.toString())) return true;

        // 3b. Nutrient Tolerance Check
        const calTolerance = 20; // +/- 20 kcal
        const macroTolerance = 5; // +/- 5 g

        // If user typed specific unit, prioritize specific fields
        if (inputUnit.includes('k') || inputUnit.includes('cal')) {
           // User likely meant calories (e.g., "500kcal")
           return Math.abs(item.calories - inputNumber) <= calTolerance;
        }

        // Check macros (standard tolerance)
        const matchesProtein = Math.abs(item.protein - inputNumber) <= macroTolerance;
        const matchesCarbs = Math.abs(item.carbs - inputNumber) <= macroTolerance;
        const matchesFat = Math.abs(item.fat - inputNumber) <= macroTolerance;
        const matchesCals = Math.abs(item.calories - inputNumber) <= calTolerance;

        // If user typed "g", they probably mean weight OR macro grams. 
        // Since we don't have weight field for all items, we assume macro grams here.
        if (inputUnit === 'g') {
           return matchesProtein || matchesCarbs || matchesFat;
        }

        // If just a raw number, check everything
        return matchesCals || matchesProtein || matchesCarbs || matchesFat;
      }

      return false;
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
    // Reset quantity to 1 when selecting a new item
    setQuantity(1);
    
    // Store base nutrients for scaling
    setBaseNutrients({
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
    });

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

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQty = parseFloat(e.target.value);
    setQuantity(newQty);

    if (!isNaN(newQty) && newQty > 0) {
        setManualForm(prev => ({
            ...prev,
            calories: Math.round(baseNutrients.calories * newQty).toString(),
            protein: Math.round(baseNutrients.protein * newQty).toString(),
            carbs: Math.round(baseNutrients.carbs * newQty).toString(),
            fat: Math.round(baseNutrients.fat * newQty).toString(),
        }));
    }
  };

  // If user manually edits a nutrient value, we should update the baseNutrients 
  // so subsequent quantity changes scale correctly from this new baseline.
  const handleNutrientManualChange = (field: 'calories' | 'protein' | 'carbs' | 'fat', value: string) => {
      setManualForm(prev => ({ ...prev, [field]: value }));
      
      const numVal = parseFloat(value);
      if (!isNaN(numVal) && quantity > 0) {
          setBaseNutrients(prev => ({
              ...prev,
              [field]: numVal / quantity // Reverse calculate base value
          }));
      }
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
      description: quantity !== 1 ? `手動輸入: ${quantity} x ${manualForm.unit}` : `手動輸入: ${manualForm.unit}`
    };

    onAddEntry(newEntry);

    // Save to DB if requested
    if (saveToDb) {
      // When saving custom food, we usually save the "Base" (Unit) values, not the scaled total
      // But user expectation might vary. Here we save what is effectively "1 unit" based on current logic if they selected "Save to DB"
      // If they typed 2 burgers and hit save, do they mean "2 burgers" is the custom item? 
      // Usually custom items are single units. Let's save the calculated base values to be safe for re-use.
      const newItem: FoodItem = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: manualForm.name,
        unit: manualForm.unit, // Keeps original unit string (e.g. "1個")
        calories: Math.round(baseNutrients.calories || calories), // Fallback to total if base is 0 (manual typing)
        protein: Math.round(baseNutrients.protein || protein),
        carbs: Math.round(baseNutrients.carbs || carbs),
        fat: Math.round(baseNutrients.fat || fat),
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
    setQuantity(1);
    setBaseNutrients({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    setSaveToDb(false);
    
    alert(`已新增記錄！${saveToDb ? '\n同時已成功加入「我的食物庫」，下次搜尋時會出現。' : ''}`);
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
                        placeholder="搜尋名稱或數值"
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

              {/* Quantity, Unit, Calories Row */}
              <div className="grid grid-cols-4 gap-3">
                 <div className="col-span-1">
                   <label className="text-xs font-bold text-slate-500 ml-1">數量</label>
                   <input
                     type="number"
                     min="0.1"
                     step="0.1"
                     value={quantity}
                     onChange={handleQuantityChange}
                     className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 focus:outline-none focus:border-secondary text-center font-bold text-slate-700"
                   />
                 </div>
                 <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 ml-1">單位</label>
                  <input
                    required
                    type="text"
                    value={manualForm.unit}
                    onChange={e => setManualForm({...manualForm, unit: e.target.value})}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-secondary"
                    placeholder="例如: 1碗"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">熱量</label>
                  <input
                    required
                    type="number"
                    value={manualForm.calories}
                    onChange={e => handleNutrientManualChange('calories', e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 focus:outline-none focus:border-secondary font-mono text-center"
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
                    onChange={e => handleNutrientManualChange('protein', e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary text-center"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 ml-1">碳水(g)</label>
                  <input
                    type="number"
                    value={manualForm.carbs}
                    onChange={e => handleNutrientManualChange('carbs', e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary text-center"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 ml-1">脂肪(g)</label>
                  <input
                    type="number"
                    value={manualForm.fat}
                    onChange={e => handleNutrientManualChange('fat', e.target.value)}
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
                 <label htmlFor="saveToDb" className="text-sm text-slate-600 cursor-pointer select-none font-bold">
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