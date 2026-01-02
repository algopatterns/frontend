// Agent message for conversation history
export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

// Strudel entity
export interface Strudel {
  id: string;
  user_id: string;
  title: string;
  code: string;
  description?: string;
  tags: string[];
  categories: string[];
  is_public: boolean;
  conversation_history: AgentMessage[];
  created_at: string;
  updated_at: string;
}

// Request types
export interface CreateStrudelRequest {
  title: string;
  code: string;
  description?: string;
  tags?: string[];
  categories?: string[];
  is_public?: boolean;
  conversation_history?: AgentMessage[];
}

export interface UpdateStrudelRequest {
  title?: string;
  code?: string;
  description?: string;
  tags?: string[];
  categories?: string[];
  is_public?: boolean;
  conversation_history?: AgentMessage[];
}

// Response types
export interface StrudelsListResponse {
  strudels: Strudel[];
}
