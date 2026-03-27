import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { AiMessage, AiGenerateResult } from './ai.types.js';

const MODEL_NAME = 'gemini-2.0-flash';

// Instância singleton do cliente Gemini
let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return geminiClient;
}

/**
 * Gera uma resposta humanizada usando o Google Gemini Flash.
 *
 * O system prompt define a persona e o tom da conta.
 * O histórico das últimas 20 mensagens é injetado para manter contexto.
 *
 * @param systemPrompt - Persona e instruções específicas da conta Instagram
 * @param history - Histórico da conversa (máx. 20 mensagens)
 * @param userMessage - Mensagem recebida do cliente
 * @returns Texto da resposta gerada
 */
export async function generateResponse(
  systemPrompt: string,
  history: AiMessage[],
  userMessage: string,
): Promise<AiGenerateResult> {
  const client = getGeminiClient();

  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemPrompt,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
    generationConfig: {
      temperature: 0.9, // Alta criatividade para respostas mais naturais
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 512, // Respostas curtas — comportamento de DM
    },
  });

  const chat = model.startChat({
    history: history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
  });

  try {
    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      logger.warn({ userMessage }, 'Gemini retornou resposta vazia');
      throw new AppError(
        502,
        'A IA não conseguiu gerar uma resposta adequada',
        'AI_EMPTY_RESPONSE',
      );
    }

    const tokensUsed = response.usageMetadata?.totalTokenCount;

    logger.debug(
      { tokensUsed, responseLength: text.length },
      'Resposta gerada pelo Gemini',
    );

    return { response: text.trim(), tokensUsed };
  } catch (err) {
    if (err instanceof AppError) throw err;

    const error = err as Error;

    // Erros específicos da API do Gemini
    if (error.message?.includes('API key not valid')) {
      logger.error('GEMINI_API_KEY inválida — verifique a variável de ambiente');
      throw new AppError(500, 'Chave da API de IA inválida', 'AI_INVALID_KEY');
    }

    if (error.message?.includes('overloaded') || error.message?.includes('503')) {
      logger.warn({ err: error }, 'API Gemini sobrecarregada');
      throw new AppError(503, 'Serviço de IA temporariamente indisponível', 'AI_OVERLOADED');
    }

    if (error.message?.includes('SAFETY')) {
      logger.warn({ userMessage }, 'Conteúdo bloqueado por filtro de segurança do Gemini');
      throw new AppError(422, 'Mensagem não pôde ser processada por questões de segurança', 'AI_CONTENT_FILTERED');
    }

    logger.error({ err: error }, 'Erro inesperado ao chamar API do Gemini');
    throw new AppError(502, 'Erro ao gerar resposta da IA', 'AI_UNKNOWN_ERROR');
  }
}
