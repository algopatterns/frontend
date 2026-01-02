"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TrainingConsentRequest) =>
      usersApi.updateTrainingConsent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useUpdateAIFeaturesEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AIFeaturesEnabledRequest) =>
      usersApi.updateAIFeaturesEnabled(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
