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

// reference to a strudel used as AI context
export interface StrudelReference {
  id: string;
  title: string;
  author_name: string;
  url: string;
}

// reference to documentation used as AI context
export interface DocReference {
  page_name: string;
  section_title?: string;
  url: string;
}

// agent message for conversation history (full metadata from strudel_messages)
export interface AgentMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  is_actionable?: boolean;
  is_code_response?: boolean;
  clarifying_questions?: string[];
  strudel_references?: StrudelReference[];
  doc_references?: DocReference[];
  created_at?: string;
}

// cc signals types
export type CCSignal = 'cc-cr' | 'cc-dc' | 'cc-ec' | 'cc-op' | 'no-ai';

// signal metadata for UI
export const CC_SIGNALS = [
  { id: 'cc-cr' as const, label: 'Credit', desc: 'Allow AI use with attribution' },
  { id: 'cc-dc' as const, label: 'Credit + Support', desc: 'Attribution + support creator' },
  { id: 'cc-ec' as const, label: 'Credit + Commons', desc: 'Attribution + contribute to open ecosystem' },
  { id: 'cc-op' as const, label: 'Credit + Open', desc: 'Attribution + keep AI/model open' },
  { id: 'no-ai' as const, label: 'No AI', desc: 'Do not use for AI training' },
] as const;

// signal restrictiveness order (higher = more restrictive)
export const SIGNAL_RESTRICTIVENESS: Record<CCSignal | '', number> = {
  '': 0,
  'cc-cr': 1,
  'cc-dc': 2,
  'cc-ec': 3,
  'cc-op': 4,
  'no-ai': 5,
};

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
  cc_signal?: CCSignal | null;
  ai_assist_count: number;
  forked_from?: string;
  parent_cc_signal?: CCSignal | null;
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
  cc_signal?: CCSignal | null;
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
  cc_signal?: CCSignal | null;
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
