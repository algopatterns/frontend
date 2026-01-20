"use client";

import { useSyncExternalStore } from "react";
import { useAuth } from "./use-auth";
import { getBYOKApiKey } from "@/components/shared/settings-modal/hooks";

const AI_DISABLED_KEY = "algojams_ai_disabled";
const BYOK_API_KEY = "algojams_byok_api_key";

// NOTE: Free AI tier is currently disabled. Users must provide their own API key (BYOK).
// To re-enable free tier, remove the hasBYOKKey check below.
const FREE_TIER_ENABLED = false;

function getAnonAIDisabled() {
  if (typeof window === "undefined") return true; // default disabled on server
  const stored = localStorage.getItem(AI_DISABLED_KEY);
  if (stored === null) return true; // no preference = default disabled
  return stored === "true";
}

function hasBYOKKey() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(BYOK_API_KEY);
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
 * - requires BYOK API key to be configured (free tier disabled)
 * - for authenticated users: also checks user.ai_features_enabled from DB
 * - for anonymous users: also checks localStorage preference
 */
export function useAIFeaturesEnabled() {
  const { user, isAuthenticated } = useAuth();

  // Use useSyncExternalStore for localStorage to avoid lint issues
  const anonAIDisabled = useSyncExternalStore(
    subscribeToAIFeatures,
    getAnonAIDisabled,
    () => false // server snapshot
  );

  const byokConfigured = useSyncExternalStore(
    subscribeToAIFeatures,
    hasBYOKKey,
    () => false // server snapshot
  );

  // BYOK required when free tier is disabled
  if (!FREE_TIER_ENABLED && !byokConfigured) {
    return false;
  }

  if (isAuthenticated && user) {
    return user.ai_features_enabled;
  }

  return !anonAIDisabled;
}
