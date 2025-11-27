import React, { useState, useEffect } from 'react';
import { Gift, TrendingDown, PartyPopper, UtensilsCrossed, RefreshCw } from 'lucide-react';
import { FoodItem } from '../types';
import { REWARD_FOODS } from '../data/foodData';

interface RewardCardProps {
  weeklyDeficit: number; // Positive means user saved calories
  isWeekend: boolean;
}

export const RewardCard: React.FC<RewardCardProps> = ({ weeklyDeficit, isWeekend }) => {
  const [currentReward, setCurrentReward] = useState<FoodItem | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Filter foods that fit within the deficit
  const getAffordableRewards = () => {
    // Allow a bit of leeway: if I saved 400, I can maybe eat a 500 cal burger
    // If deficit is huge, everything is available.
    return REWARD_FOODS.filter(food => food.calories <= weeklyDeficit + 100);
  };

  // Set initial reward when deficit changes
  useEffect(() => {
    shuffleReward();
  }, [weeklyDeficit]);

  const shuffleReward = () => {
    if (weeklyDeficit <= 0) {
      setCurrentReward(null);
      return;
    }

    const affordableRewards = getAffordableRewards();
    
    if (affordableRewards.length === 0) {
      // If deficit is positive but small (e.g. 50 kcal), show the smallest item
      const smallest = [...REWARD_FOODS].sort((a,b) => a.calories - b.calories)[0];
      setCurrentReward(smallest);
    } else {
      // Pick a random one
      const randomIndex = Math.floor(Math.random() * affordableRewards.length);
      setCurrentReward(affordableRewards[randomIndex]);
    }
  };

  const handleEmojiClick = () => {
    setIsAnimating(true);
    shuffleReward();
    setTimeout(() => setIsAnimating(false), 300);
  };

  // If deficit is negative (Surplus), show encouragement to get back on track
  if (weeklyDeficit < 0) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-3xl p-5 mb-6 shadow-sm relative overflow-hidden">
         <div className="flex items-start gap-4 z-10 relative">
            <div className="bg-orange-100 p-3 rounded-full text-orange-500">
               <TrendingDown className="w-6 h-6" />
            </div>
            <div>
               <h3 className="font-bold text-slate-800 text-lg">本週熱量累積中</h3>
               <p className="text-sm text-slate-600 mt-1">
                 目前超出目標 <span className="font-bold text-orange-500">{Math.abs(weeklyDeficit)}</span> kcal。
                 別擔心，下一餐吃清淡點就能補回來！
               </p>
            </div>
         </div>
      </div>
    );
  }

  // Deficit > 0 (Good job)
  return (
    <div className="bg-gradient-to-br from-indigo-900 to-violet-800 rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden text-white mt-8">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 p-10 opacity-10 transform rotate-12 pointer-events-none">
        <Gift className="w-32 h-32" />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-yellow-400 text-indigo-900 text-xs font-bold px-2 py-0.5 rounded-full">每週獎勵</span>
              {isWeekend && <span className="bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">週末狂歡</span>}
            </div>
            <h3 className="font-bold text-xl">
              {isWeekend ? '週末犒賞時光！' : '正在累積美食基金'}
            </h3>
          </div>
          <div className="text-right">
             <div className="text-xs text-indigo-200">本週已省下</div>
             <div className="text-3xl font-black text-yellow-300">
               {weeklyDeficit} <span className="text-sm font-medium">kcal</span>
             </div>
          </div>
        </div>

        {/* Suggestion Section */}
        {currentReward && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mt-2 border border-white/20 transition-all">
            <p className="text-xs text-indigo-200 mb-2 flex items-center gap-1">
              {isWeekend ? <PartyPopper className="w-3 h-3 text-pink-400" /> : <UtensilsCrossed className="w-3 h-3" />}
              {isWeekend ? '根據您的努力，您可以無罪惡感地享受：' : '再堅持一下，週末可以吃：'}
            </p>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-lg text-white transition-all duration-300">
                  {currentReward.name}
                </div>
                <div className="text-xs text-indigo-200">{currentReward.calories} kcal</div>
              </div>
              
              <button 
                onClick={handleEmojiClick}
                className={`h-10 w-10 rounded-full bg-yellow-400 hover:bg-yellow-300 flex items-center justify-center text-indigo-900 font-bold text-xl shadow-lg cursor-pointer transition-transform hover:scale-110 active:scale-95 ${isAnimating ? 'scale-90' : ''}`}
                title="點擊換一個獎勵"
              >
                 😋
              </button>
            </div>
            <div className="text-[10px] text-center text-indigo-300/60 mt-2">
              點擊表情符號來探索其他選擇
            </div>
          </div>
        )}
        
        {!currentReward && (
          <div className="text-sm text-indigo-200 mt-2">
            繼續保持！累積更多赤字來解鎖週末大餐。
          </div>
        )}
      </div>
    </div>
  );
};