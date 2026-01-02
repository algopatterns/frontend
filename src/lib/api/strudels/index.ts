import { apiClient } from "../client";
import type {
  Strudel,
  CreateStrudelRequest,
  UpdateStrudelRequest,
  StrudelsListResponse,
} from "./types";
import type { MessageResponse } from "../sessions/types";

export const strudelsApi = {
  list: () =>
    apiClient.get<StrudelsListResponse>("/api/v1/strudels", {
      requireAuth: true,
    }),

  get: (id: string) =>
    apiClient.get<Strudel>(`/api/v1/strudels/${id}`, {
      requireAuth: true,
    }),

  create: (data: CreateStrudelRequest) =>
    apiClient.post<Strudel>("/api/v1/strudels", data, {
      requireAuth: true,
    }),

  update: (id: string, data: UpdateStrudelRequest) =>
    apiClient.put<Strudel>(`/api/v1/strudels/${id}`, data, {
      requireAuth: true,
    }),

  delete: (id: string) =>
    apiClient.delete<MessageResponse>(`/api/v1/strudels/${id}`, {
      requireAuth: true,
    }),

  listPublic: (params?: { limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    return apiClient.get<StrudelsListResponse>(
      `/api/v1/public/strudels${query ? `?${query}` : ""}`
    );
  },
};
