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
  forked_from_id?: string;
  session_id?: string;
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

export interface GenerateResponse {
  code?: string;
  is_actionable: boolean;
  is_code_response: boolean;
  clarifying_questions?: string[];
  docs_retrieved: number;
  examples_retrieved: number;
  strudel_references?: StrudelReference[];
  doc_references?: DocReference[];
  model: string;
  _streamed?: boolean; // internal flag to indicate response was streamed
}

// streaming response event from SSE endpoint
export interface StreamEvent {
  type: 'chunk' | 'refs' | 'done' | 'error';
  content?: string;
  error?: string;
  strudel_references?: StrudelReference[];
  doc_references?: DocReference[];
  model?: string;
  is_code_response?: boolean;
  input_tokens?: number;
  output_tokens?: number;
}
