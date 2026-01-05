export interface Message {
  role: string;
  content: string;
}

export interface GenerateRequest {
  user_query: string;
  editor_state: string;
  conversation_history?: Message[];
  provider?: 'anthropic' | 'openai';
  provider_api_key?: string;
  strudel_id?: string;
}

export interface GenerateResponse {
  code?: string;
  is_actionable: boolean;
  is_code_response: boolean;
  clarifying_questions?: string[];
  docs_retrieved: number;
  examples_retrieved: number;
  model: string;
}
