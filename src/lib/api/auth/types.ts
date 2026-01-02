// User type from swagger spec
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: string;
  ai_features_enabled: boolean;
  training_consent: boolean;
  created_at: string;
  updated_at: string;
}

// Auth responses
export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserResponse {
  user: User;
}

// Profile update
export interface UpdateProfileRequest {
  name: string;
  avatar_url?: string;
}
