export type User = {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_premium: boolean;
  is_admin: boolean;
  subscription_plan: string;
  avatar_url?: string | null;
  created_at: string;
};

export type DailySummary = {
  date: string;
  symptoms: SymptomLog[];
  medications: MedicationLog[];
  sleep: SleepLog[];
  nutrition: NutritionLog[];
};

export type SymptomLog = {
  id: number;
  date: string;
  symptom_name: string;
  severity: number;
  notes?: string | null;
};

export type MedicationLog = {
  id: number;
  date: string;
  name: string;
  dosage: string;
  time_taken?: string | null;
  reminder_enabled: boolean;
  reminder_time?: string | null;
  notes?: string | null;
  is_taken: boolean;
};

export type SleepLog = {
  id: number;
  date: string;
  hours_slept: number;
  quality: 'bad' | 'fair' | 'good' | 'excellent';
  notes?: string | null;
};

export type NutritionLog = {
  id: number;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes: string;
  water_ml: number;
};

export type DocumentItem = {
  id: number;
  original_filename: string;
  file_type: string;
  file_size: number;
  category: string;
  notes?: string | null;
  created_at: string;
};

export type VoiceParseResult = {
  transcript: string;
  intent: 'symptom' | 'medication' | 'sleep' | 'nutrition' | 'unknown';
  confidence: number;
  extracted_data: Record<string, any>;
  suggested_action: string;
  warnings: string[];
  usage: {
    limit: number;
    used_today: number;
    remaining?: number | null;
    is_premium: boolean;
  };
};

export type ChatSession = {
  id: number;
  title: string;
  created_at: string;
  updated_at?: string;
};

export type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};
