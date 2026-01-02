import { apiClient } from "../client";
import type { User } from "../auth/types";
import type {
  UsageResponse,
  TrainingConsentRequest,
  AIFeaturesEnabledRequest,
} from "./types";

export const usersApi = {
  getUsage: () =>
    apiClient.get<UsageResponse>("/api/v1/users/usage", { requireAuth: true }),

  updateTrainingConsent: (data: TrainingConsentRequest) =>
    apiClient.put<User>("/api/v1/users/training-consent", data, {
      requireAuth: true,
    }),

  updateAIFeaturesEnabled: (data: AIFeaturesEnabledRequest) =>
    apiClient.put<User>("/api/v1/users/ai-features-enabled", data, {
      requireAuth: true,
    }),
};
