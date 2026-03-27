/**
 * Aplica um delay aleatório entre 3 e 12 segundos para simular
 * o comportamento humano de digitação antes de enviar uma resposta.
 *
 * Conforme documentado no CLAUDE.md:
 * "Delay de resposta: mínimo 3s, máximo 12s aleatório para simular humanidade"
 */
const MIN_DELAY_MS = 3_000;
const MAX_DELAY_MS = 12_000;

export function humanDelay(): Promise<void> {
  const ms = Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retorna o número de milissegundos do delay sem executá-lo.
 * Útil para testes ou para logar o delay antes de aplicá-lo.
 */
export function getHumanDelayMs(): number {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}
