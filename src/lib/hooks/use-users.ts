"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
import { useAuthStore } from "@/lib/stores/auth";
import type {
  TrainingConsentRequest,
  AIFeaturesEnabledRequest,
} from "@/lib/api/users/types";

export const userKeys = {
  all: ["users"] as const,
  usage: () => [...userKeys.all, "usage"] as const,
};

export function useUsage() {
  return useQuery({
    queryKey: userKeys.usage(),
    queryFn: () => usersApi.getUsage(),
  });
}

export function useUpdateTrainingConsent() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (data: TrainingConsentRequest) =>
      usersApi.updateTrainingConsent(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
    },
  });
}

export function useUpdateAIFeaturesEnabled() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (data: AIFeaturesEnabledRequest) =>
      usersApi.updateAIFeaturesEnabled(data),
    onSuccess: (updatedUser) => {
      // update the auth store directly with the returned user
      setUser(updatedUser);
    },
  });
}
