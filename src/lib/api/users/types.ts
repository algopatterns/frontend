// Re-export User type for convenience
export type { User } from "../auth/types";

// Usage statistics
export interface DailyUsage {
  date: string; // Format: "2006-01-02"
  count: number;
}

export interface UsageResponse {
  tier: "free" | "payg" | "byok";
  today: number;
  limit: number; // -1 for unlimited
  remaining: number; // -1 for unlimited
  history: DailyUsage[];
}

// User settings requests
export interface TrainingConsentRequest {
  training_consent: boolean;
}

export interface AIFeaturesEnabledRequest {
  ai_features_enabled: boolean;
}
