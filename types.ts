
export interface NutrientData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodEntry extends NutrientData {
  id: string;
  name: string;
  timestamp: number;
  imageUrl?: string;
  description?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'lateNight';
}

export interface FoodItem extends NutrientData {
  id: string;
  name: string;
  unit: string; // e.g., "1份", "100g", "1碗"
  isCustom?: boolean;
}

export interface WaterLog {
  id: string;
  amount: number; // in ml
  timestamp: number;
}

export interface DailyGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserProfile {
  id: string;
  name: string;
  dailyGoal: number;
  gender?: 'male' | 'female';
  height?: number; // cm
  weight?: number; // kg
  age?: number;
  activityLevel?: number;
  bmr?: number;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
