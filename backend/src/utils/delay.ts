/**
 * Aplica um delay aleatório para simular o comportamento humano de digitação
 * antes de enviar uma resposta.
 *
 * Aceita delayMin e delayMax em segundos (valores da conta no banco).
 * Fallback para 3-12s conforme CLAUDE.md quando não especificado.
 */
const DEFAULT_MIN_DELAY_S = 3;
const DEFAULT_MAX_DELAY_S = 12;

export function humanDelay(
  delayMinSeconds: number = DEFAULT_MIN_DELAY_S,
  delayMaxSeconds: number = DEFAULT_MAX_DELAY_S,
): Promise<void> {
  const minMs = delayMinSeconds * 1_000;
  const maxMs = delayMaxSeconds * 1_000;
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retorna o número de milissegundos do delay sem executá-lo.
 * Útil para testes ou para logar o delay antes de aplicá-lo.
 */
export function getHumanDelayMs(
  delayMinSeconds: number = DEFAULT_MIN_DELAY_S,
  delayMaxSeconds: number = DEFAULT_MAX_DELAY_S,
): number {
  const minMs = delayMinSeconds * 1_000;
  const maxMs = delayMaxSeconds * 1_000;
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}
