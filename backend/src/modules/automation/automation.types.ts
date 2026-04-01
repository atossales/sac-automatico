import type { AutomationType } from '@prisma/client';

/**
 * Evento recebido do webhook do Instagram, usado para avaliar
 * se alguma automacao deve disparar.
 */
export interface AutomationEvent {
  /** Texto da mensagem recebida (pode ser vazio para story mentions) */
  messageText: string;
  /** Tipo de conteudo: text, story_mention, image, etc. */
  messageType: string;
  /** Indica se e a primeira mensagem do participante na conversa */
  isFirstMessage: boolean;
}

/**
 * Resultado da verificacao de automacao.
 * Se `triggered` for true, a mensagem da automacao deve ser enviada.
 */
export interface AutomationCheckResult {
  triggered: boolean;
  automationId: string | null;
  message: string | null;
  type: AutomationType | null;
}

/**
 * Dados para atualizar uma automacao existente.
 * Todas as propriedades sao opcionais.
 */
export interface UpdateAutomationData {
  type?: AutomationType | undefined;
  triggerValue?: string | null | undefined;
  message?: string | undefined;
  isActive?: boolean | undefined;
}

/**
 * Dados para criar uma automacao.
 */
export interface UpsertAutomationData {
  accountId: string;
  type: AutomationType;
  triggerValue?: string | null | undefined;
  message: string;
  isActive?: boolean | undefined;
}
