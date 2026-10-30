/**
 * Embaralha uma lista com o algoritmo de Fisher-Yates.
 *
 * O gerador aleatório é injetável para permitir testes determinísticos.
 * A lista original nunca é modificada.
 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    // `Math.min` protege contra geradores que retornam 1 (fora do contrato
    // de Math.random, mas comuns em mocks de teste).
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
