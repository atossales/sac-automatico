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
  /** Indica que a IA sinalizou não saber responder e o caso precisa de atenção humana */
  escalated?: boolean;
}

export interface AiError {
  code: 'GEMINI_OVERLOADED' | 'GEMINI_INVALID_KEY' | 'GEMINI_CONTENT_FILTERED' | 'GEMINI_UNKNOWN';
  message: string;
}
