"use client";

import { useSyncExternalStore } from "react";
import { useAuth } from "./use-auth";

const AI_DISABLED_KEY = "algorave_ai_disabled";

function getAnonAIDisabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AI_DISABLED_KEY) === "true";
}

function subscribeToAIFeatures(callback: () => void) {
  window.addEventListener("ai-features-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("ai-features-changed", callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * hook to check if AI features are enabled.
 * - for authenticated users: uses user.ai_features_enabled from DB
 * - for anonymous users: uses localStorage preference
 */
export function useAIFeaturesEnabled() {
  const { user, isAuthenticated } = useAuth();

  // Use useSyncExternalStore for localStorage to avoid lint issues
  const anonAIDisabled = useSyncExternalStore(
    subscribeToAIFeatures,
    getAnonAIDisabled,
    () => false // server snapshot
  );

  if (isAuthenticated && user) {
    return user.ai_features_enabled;
  }

  return !anonAIDisabled;
}
