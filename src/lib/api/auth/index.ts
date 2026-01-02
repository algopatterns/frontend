import { apiClient } from "../client";
import { API_BASE_URL } from "@/lib/constants";
import type { UserResponse, UpdateProfileRequest } from "./types";
import type { MessageResponse } from "../sessions/types";

export const authApi = {
  getMe: () =>
    apiClient.get<UserResponse>("/api/v1/auth/me", { requireAuth: true }),

  updateMe: (data: UpdateProfileRequest) =>
    apiClient.put<UserResponse>("/api/v1/auth/me", data, {
      requireAuth: true,
    }),

  getOAuthUrl: (provider: "github" | "google" | "apple") => {
    return `${API_BASE_URL}/api/v1/auth/${provider}`;
  },

  logout: () =>
    apiClient.post<MessageResponse>("/api/v1/auth/logout", undefined),
};
