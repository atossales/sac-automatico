export interface AiMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AiGenerateOptions {
  systemPrompt: string;
  history: AiMessage[];
  userMessage: string;
}

export interface AiGenerateResult {
  response: string;
  tokensUsed?: number;
}

export interface AiError {
  code: 'GEMINI_OVERLOADED' | 'GEMINI_INVALID_KEY' | 'GEMINI_CONTENT_FILTERED' | 'GEMINI_UNKNOWN';
  message: string;
}
