// Pagination
export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface StrudelFilterParams extends PaginationParams {
  search?: string;
  tags?: string[];
}

export interface TagsResponse {
  tags: string[];
}

// agent message for conversation history (full metadata from strudel_messages)
export interface AgentMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  is_actionable?: boolean;
  is_code_response?: boolean;
  clarifying_questions?: string[];
  created_at?: string;
}

// strudel entity
export interface Strudel {
  id: string;
  user_id: string;
  title: string;
  code: string;
  description?: string;
  tags: string[];
  categories: string[];
  is_public: boolean;
  allow_training: boolean;
  ai_contribution_score: number;
  forked_from?: string;
  conversation_history: AgentMessage[];
  created_at: string;
  updated_at: string;
}

// request types
export interface CreateStrudelRequest {
  title: string;
  code: string;
  description?: string;
  tags?: string[];
  categories?: string[];
  is_public?: boolean;
  allow_training?: boolean;
  forked_from?: string;
  conversation_history?: AgentMessage[];
}

export interface UpdateStrudelRequest {
  title?: string;
  code?: string;
  description?: string;
  tags?: string[];
  categories?: string[];
  is_public?: boolean;
  allow_training?: boolean;
  conversation_history?: AgentMessage[];
}

// response types
export interface StrudelsListResponse {
  strudels: Strudel[];
  pagination: Pagination;
}

// strudel stats (attribution)
export interface StrudelStats {
  total_uses: number;
  unique_users: number;
  last_used_at?: string;
  fork_count: number;
}

export interface StrudelUse {
  id: string;
  target_strudel_id?: string;
  target_strudel_title?: string;
  requesting_user_id?: string;
  requesting_display_name?: string;
  similarity_score?: number;
  created_at: string;
}

export interface StrudelStatsResponse {
  stats: StrudelStats;
  recent_uses: StrudelUse[];
}
