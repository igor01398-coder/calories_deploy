
import React, { useState, useEffect, useMemo } from 'react';
import { FoodEntry, NutrientData, FoodItem, WaterLog, UserProfile } from './types';
import { FoodEntryForm } from './components/FoodEntryForm';
import { HistoryList } from './components/HistoryList';
import { NutrientChart } from './components/NutrientChart';
import { BMRCalculator } from './components/BMRCalculator';
import { RewardCard } from './components/RewardCard';
import { WaterTracker } from './components/WaterTracker';
import { UserSwitcher } from './components/UserSwitcher';
import { Activity, ChevronRight, Calculator, User as UserIcon, Users } from 'lucide-react';
import { PRELOADED_FOODS } from './data/foodData';

// Legacy keys for migration
const LEGACY_LOGS_KEY = 'calorie_snap_logs';
const LEGACY_CUSTOM_FOODS_KEY = 'calorie_snap_custom_foods';
const LEGACY_GOAL_KEY = 'calorie_snap_daily_goal';
const LEGACY_WATER_KEY = 'calorie_snap_water_logs';

const USERS_STORAGE_KEY = 'calorie_snap_users';
const CURRENT_USER_ID_KEY = 'calorie_snap_current_user_id';

export default function App() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Data State
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [dailyGoal, setDailyGoal] = useState<number>(2000);
  
  // UI State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isBmrModalOpen, setIsBmrModalOpen] = useState(false);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const DAILY_WATER_GOAL = 2500; 

  // --- Initialization & Migration ---
  useEffect(() => {
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    
    if (savedUsers) {
      // Normal Load
      const parsedUsers = JSON.parse(savedUsers);
      setUsers(parsedUsers);
      const savedCurrentId = localStorage.getItem(CURRENT_USER_ID_KEY);
      const initialId = savedCurrentId && parsedUsers.find((u: UserProfile) => u.id === savedCurrentId) 
        ? savedCurrentId 
        : parsedUsers[0]?.id;
      
      setCurrentUserId(initialId || '');
    } else {
      // First Time or Migration
      const legacyGoal = localStorage.getItem(LEGACY_GOAL_KEY);
      const defaultUser: UserProfile = {
        id: 'user_default',
        name: '預設使用者',
        dailyGoal: legacyGoal ? parseInt(legacyGoal) : 2000,
        bmr: undefined
      };
      
      const initialUsers = [defaultUser];
      setUsers(initialUsers);
      setCurrentUserId(defaultUser.id);
      
      // Migrate Data if exists
      const legacyLogs = localStorage.getItem(LEGACY_LOGS_KEY);
      if (legacyLogs) {
        localStorage.setItem(`user_${defaultUser.id}_logs`, legacyLogs);
      }
      const legacyFoods = localStorage.getItem(LEGACY_CUSTOM_FOODS_KEY);
      if (legacyFoods) {
        localStorage.setItem(`user_${defaultUser.id}_custom_foods`, legacyFoods);
      }
      const legacyWater = localStorage.getItem(LEGACY_WATER_KEY);
      if (legacyWater) {
        localStorage.setItem(`user_${defaultUser.id}_water_logs`, legacyWater);
      }
      
      // Save Users
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
      localStorage.setItem(CURRENT_USER_ID_KEY, defaultUser.id);
    }
    
    setIsLoaded(true);
  }, []);

  // --- Helpers for Dynamic Keys ---
  const getStorageKey = (suffix: string) => {
    return currentUserId ? `user_${currentUserId}_${suffix}` : `temp_${suffix}`;
  };

  // --- Load User Data when ID changes ---
  useEffect(() => {
    if (!isLoaded || !currentUserId) return;

    // Load Logs
    const logsKey = getStorageKey('logs');
    const savedLogs = localStorage.getItem(logsKey);
    setEntries(savedLogs ? JSON.parse(savedLogs) : []);

    // Load Foods
    const foodsKey = getStorageKey('custom_foods');
    const savedFoods = localStorage.getItem(foodsKey);
    setCustomFoods(savedFoods ? JSON.parse(savedFoods) : []);

    // Load Water
    const waterKey = getStorageKey('water_logs');
    const savedWater = localStorage.getItem(waterKey);
    setWaterLogs(savedWater ? JSON.parse(savedWater) : []);

    // Load Goal from Profile
    const currentUser = users.find(u => u.id === currentUserId);
    if (currentUser) {
      setDailyGoal(currentUser.dailyGoal);
    }

    // Save current ID preference
    localStorage.setItem(CURRENT_USER_ID_KEY, currentUserId);
    
    // Reset view to today
    setSelectedDate(new Date());

  }, [currentUserId, isLoaded]);

  // --- Robust Save Function ---
  const saveToLocalStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        if (key.includes('_logs')) {
          console.warn("Storage full. Removing images.");
          const textOnlyEntries = (data as FoodEntry[]).map(entry => {
            const { imageUrl, ...rest } = entry;
            return rest;
          });
          try {
            localStorage.setItem(key, JSON.stringify(textOnlyEntries));
            alert("⚠️ 儲存空間已滿，系統已自動移除照片以保留記錄。");
          } catch (retryError) {
             alert("❌ 無法儲存記錄：空間嚴重不足。");
          }
        } else {
           alert("❌ 無法儲存資料：空間已滿。");
        }
      }
    }
  };

  // --- Save Effects ---
  useEffect(() => {
    if (isLoaded && currentUserId) {
      saveToLocalStorage(getStorageKey('logs'), entries);
    }
  }, [entries, isLoaded]); 

  useEffect(() => {
    if (isLoaded && currentUserId) {
      saveToLocalStorage(getStorageKey('custom_foods'), customFoods);
    }
  }, [customFoods, isLoaded]);

  useEffect(() => {
    if (isLoaded && currentUserId) {
      saveToLocalStorage(getStorageKey('water_logs'), waterLogs);
    }
  }, [waterLogs, isLoaded]);
  
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users, isLoaded]);

  // --- Actions ---

  const handleAddUser = (name: string) => {
    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      name: name,
      dailyGoal: 2000
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setIsUserSwitcherOpen(false);
    setTimeout(() => setIsBmrModalOpen(true), 300);
  };

  const handleDeleteUser = (userIdToDelete: string) => {
    const userToDelete = users.find(u => u.id === userIdToDelete);
    if (!userToDelete) return;

    if (!window.confirm(`確定要刪除帳號「${userToDelete.name}」嗎？\n\n注意：此動作無法復原！\n該帳號的所有飲食記錄、自訂食物與飲水資料將會被永久刪除。`)) {
      return;
    }

    localStorage.removeItem(`user_${userIdToDelete}_logs`);
    localStorage.removeItem(`user_${userIdToDelete}_custom_foods`);
    localStorage.removeItem(`user_${userIdToDelete}_water_logs`);

    const remainingUsers = users.filter(u => u.id !== userIdToDelete);

    if (remainingUsers.length === 0) {
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        name: '預設使用者',
        dailyGoal: 2000
      };
      setUsers([newUser]);
      setCurrentUserId(newUser.id);
    } else {
      setUsers(remainingUsers);
      if (currentUserId === userIdToDelete) {
        setCurrentUserId(remainingUsers[0].id);
      }
    }
  };

  const handleUpdateUserName = (userId: string, newName: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, name: newName };
      }
      return u;
    }));
  };

  const handleUpdateUserProfile = (data: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUserId) {
        return { ...u, ...data };
      }
      return u;
    }));
    
    if (data.dailyGoal) {
      setDailyGoal(data.dailyGoal);
    }
  };

  const addEntry = (entryData: Omit<FoodEntry, 'id'>) => {
    const newEntry: FoodEntry = {
      ...entryData,
      id: crypto.randomUUID(),
    };
    setEntries(prev => [newEntry, ...prev]);
    setSelectedDate(new Date());
  };

  const updateEntry = (updatedEntry: FoodEntry) => {
    setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  };

  const deleteEntry = (id: string) => {
    if (confirm('確定要刪除這筆記錄嗎？')) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleSaveCustomFood = (item: FoodItem) => {
    setCustomFoods(prev => [...prev, item]);
  };

  const handleAddWater = (amount: number) => {
    const newLog: WaterLog = {
      id: crypto.randomUUID(),
      amount,
      timestamp: Date.now()
    };
    setWaterLogs(prev => [...prev, newLog]);
  };

  const handleRemoveWater = (amount: number) => {
     // Log a negative amount to offset
     const newLog: WaterLog = {
      id: crypto.randomUUID(),
      amount: -amount,
      timestamp: Date.now()
    };
    setWaterLogs(prev => [...prev, newLog]);
  };

  // --- Computed Data ---
  
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return (
        entryDate.getFullYear() === selectedDate.getFullYear() &&
        entryDate.getMonth() === selectedDate.getMonth() &&
        entryDate.getDate() === selectedDate.getDate()
      );
    });
  }, [entries, selectedDate]);

  const selectedDateTotals = useMemo(() => {
    return filteredEntries.reduce((acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fat: acc.fat + entry.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [filteredEntries]);

  // Combine custom foods with preloaded
  const foodDatabase = useMemo(() => {
    return [...customFoods, ...PRELOADED_FOODS];
  }, [customFoods]);

  // Water Calculation
  const waterAmount = useMemo(() => {
    return waterLogs
      .filter(log => {
         const logDate = new Date(log.timestamp);
         const today = new Date(); // Water is usually tracked for "Today"
         // If we want water history, we should use selectedDate. 
         // But usually water is "Today's hydration". Let's use selectedDate to allow history viewing.
         return (
            logDate.getFullYear() === selectedDate.getFullYear() &&
            logDate.getMonth() === selectedDate.getMonth() &&
            logDate.getDate() === selectedDate.getDate()
         );
      })
      .reduce((sum, log) => sum + log.amount, 0);
  }, [waterLogs, selectedDate]);

  // Reward Calculation (Weekly)
  const weeklyRewardData = useMemo(() => {
    if (!currentUserId) return { deficit: 0, isWeekend: false };

    const today = new Date();
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    
    // Calculate start of week (Monday)
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0,0,0,0);

    // Sum calories since Monday
    const thisWeekEntries = entries.filter(e => e.timestamp >= monday.getTime());
    const totalConsumed = thisWeekEntries.reduce((sum, e) => sum + e.calories, 0);
    
    // Calculate total Goal since Monday
    // Days passed including today (partial)
    // Roughly: number of days * dailyGoal. 
    // To be precise: match days with entries? 
    // Let's simplify: (Days passed * dailyGoal) - Consumed.
    const now = new Date();
    const daysPassed = Math.max(1, Math.floor((now.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const totalGoal = daysPassed * dailyGoal;
    
    const deficit = totalGoal - totalConsumed;
    return { deficit, isWeekend };
  }, [entries, dailyGoal, currentUserId]);

  const currentUserProfile = users.find(u => u.id === currentUserId);

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white sticky top-0 z-30 shadow-sm border-b border-slate-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-xl text-white">
              <Activity className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Calorie<span className="text-primary">Snap</span>
            </h1>
          </div>
          
          <button 
            onClick={() => setIsUserSwitcherOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-xs font-bold">
              {currentUserProfile?.name.charAt(0)}
            </div>
            <span className="text-sm font-bold text-slate-700 max-w-[80px] truncate">
              {currentUserProfile?.name}
            </span>
            <Users className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* Summary Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <h2 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">今日攝取</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-800">{Math.round(selectedDateTotals.calories)}</span>
                <span className="text-sm font-bold text-slate-400">/ {dailyGoal} kcal</span>
              </div>
            </div>
            <NutrientChart data={selectedDateTotals} />
          </div>

          <div className="grid grid-cols-3 gap-4 relative z-10">
            <div className="bg-red-50 p-3 rounded-2xl border border-red-100">
              <div className="text-xs font-bold text-red-400 mb-1">蛋白質</div>
              <div className="text-lg font-black text-red-600">{Math.round(selectedDateTotals.protein)}g</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
              <div className="text-xs font-bold text-blue-400 mb-1">碳水</div>
              <div className="text-lg font-black text-blue-600">{Math.round(selectedDateTotals.carbs)}g</div>
            </div>
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
              <div className="text-xs font-bold text-amber-400 mb-1">脂肪</div>
              <div className="text-lg font-black text-amber-600">{Math.round(selectedDateTotals.fat)}g</div>
            </div>
          </div>
        </div>
        
        {/* Water Tracker */}
        <WaterTracker 
          currentAmount={waterAmount} 
          goal={DAILY_WATER_GOAL}
          onAddWater={handleAddWater}
          onRemoveWater={handleRemoveWater}
        />

        {/* Input Form */}
        <FoodEntryForm 
          onAddEntry={addEntry} 
          onSaveCustomFood={handleSaveCustomFood}
          foodDatabase={foodDatabase}
        />

        {/* History List */}
        <HistoryList 
          entries={filteredEntries} 
          onDelete={deleteEntry}
          onUpdate={updateEntry}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* Reward Card */}
        <RewardCard 
           weeklyDeficit={weeklyRewardData.deficit} 
           isWeekend={weeklyRewardData.isWeekend} 
        />
      </main>

      {/* Modals */}
      <BMRCalculator 
        isOpen={isBmrModalOpen} 
        onClose={() => setIsBmrModalOpen(false)} 
        currentUserProfile={currentUserProfile}
        onSaveProfile={handleUpdateUserProfile}
      />

      <UserSwitcher
        isOpen={isUserSwitcherOpen}
        onClose={() => setIsUserSwitcherOpen(false)}
        users={users}
        currentUserId={currentUserId}
        onSwitchUser={setCurrentUserId}
        onAddUser={handleAddUser}
        onDeleteUser={handleDeleteUser}
        onUpdateUserName={handleUpdateUserName}
        onOpenBmrSettings={() => {
          setIsUserSwitcherOpen(false);
          setIsBmrModalOpen(true);
        }}
      />
    </div>
  );
}
