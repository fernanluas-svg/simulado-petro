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

/**
 * Sorteia `count` itens sem reposição, com probabilidade proporcional ao peso.
 *
 * Usa o método de Efraimidis-Spirakis: cada item recebe a chave
 * `random()^(1/peso)` e os maiores valores são escolhidos. Itens com peso maior
 * tendem a ficar com chaves mais altas. O resultado é embaralhado novamente
 * para que a ordem final não dependa das chaves.
 *
 * O gerador aleatório é injetável para permitir testes determinísticos.
 */
export function weightedSample<T>(
  items: readonly T[],
  count: number,
  weightOf: (item: T) => number,
  random: () => number = Math.random,
): T[] {
  if (count <= 0) return [];

  const eligible = items
    .map((item) => ({ item, weight: Math.max(0, weightOf(item)) }))
    .filter((entry) => entry.weight > 0);

  if (eligible.length === 0) return [];

  const keyed = eligible.map((entry) => ({
    item: entry.item,
    key: Math.pow(random(), 1 / entry.weight),
  }));

  keyed.sort((a, b) => b.key - a.key);

  const selected = keyed
    .slice(0, Math.min(count, keyed.length))
    .map((entry) => entry.item);

  return shuffle(selected, random);
}
