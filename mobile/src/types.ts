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

export type Notification = {
  id: number | string;
  type: string;
  title: string;
  body: string;
  route?: string | null;
  priority: 'normal' | 'important';
  read: boolean;
  created_at: string;
};

export type RiskAlert = {
  id: number;
  type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  dismissed: boolean;
  created_at: string;
};

export type UserSettings = {
  notifications_enabled: boolean;
  voice_notifications_enabled: boolean;
  medication_reminders_enabled: boolean;
  family_invite_notifications_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  ai_use_health_records: boolean;
  ai_use_documents: boolean;
  ai_use_doctor_reports: boolean;
  ai_use_profile: boolean;
  birth_year: number | null;
  biological_sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  blood_type: string | null;
  chronic_conditions: string | null;
  allergies: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
};

export type TimelineItem = {
  kind: string;
  kind_label: string;
  title: string;
  description: string;
  created_at: string;
};

export type TimelineGroup = {
  date: string;
  items: TimelineItem[];
};

export type SearchResult = {
  kind: string;
  title: string;
  description: string;
  is_risky: boolean;
  created_at: string;
};

export type CrossAnalysis = {
  summary: string;
  linked_findings: string[];
  recommendations: string[];
  has_critical_alert: boolean;
  critical_findings?: string | null;
  risk_flags?: string[];
  doctor_questions?: string[];
  full_analysis?: string;
};

export type HealthReport = {
  summary: string;
  date_range: { start: string; end: string };
  trends: string[];
  recommendations: string[];
  doctor_questions: string[];
  full_report?: string;
};

export type DoctorPrepReport = {
  summary: string;
  key_findings: string[];
  risk_flags: string[];
  doctor_questions: string[];
  preparation_checklist: string[];
  medication_summary?: string;
  document_summary?: string;
  full_report?: string;
  date_range?: { start: string; end: string };
  patient?: { full_name: string; email: string };
  source_counts?: Record<string, number>;
  saved_report_id?: number;
  saved_title?: string;
  share_text?: string;
};

export type SavedDoctorReport = {
  id: number;
  title: string;
  summary: string;
  period_start: string;
  period_end: string;
  created_at: string;
};

// Billing
export type PlanInfo = {
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
};

export type SubscriptionStatus = {
  is_premium: boolean;
  subscription_plan: string;
  premium_until: string | null;
  days_remaining: number;
  ad_free: boolean;
};

export type SubscriptionEvent = {
  id: number;
  event_type: string;
  plan: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  completed_at: string | null;
};

// Family
export type FamilyMember = {
  id: number;
  full_name: string;
  relation: string;
  birth_year: number | null;
  phone: string | null;
  emergency_contact: string | null;
  notes: string | null;
  is_active: boolean;
  linked_user_id: number | null;
  created_at: string;
};

export type FamilyHealthEntry = {
  id: number;
  entry_date: string;
  category: string;
  title: string;
  severity: number | null;
  status: string;
  details: string | null;
  created_at: string;
};

export type FamilyInvitation = {
  id: number;
  inviter_user_id?: number;
  inviter_name?: string | null;
  invitee_email: string;
  relation: string;
  token?: string;
  can_view_documents: boolean;
  can_add_records: boolean;
  can_edit_records: boolean;
  can_generate_reports: boolean;
  message: string | null;
  status: string;
  created_at: string;
};

export type FamilyAccess = {
  id: number;
  inviter: { id: number; full_name: string; email: string };
  relation: string;
  can_view_documents: boolean;
  can_add_records: boolean;
  can_edit_records: boolean;
  can_generate_reports: boolean;
  created_at: string;
};
