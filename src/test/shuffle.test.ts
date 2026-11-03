import { describe, expect, it } from 'vitest';
import { shuffle, weightedSample } from '../services/shuffle';

/** Gerador determinístico para testar o embaralhamento sem flakiness. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe('shuffle (Fisher-Yates)', () => {
  it('produz uma permutação determinística com um gerador fixo', () => {
    expect(shuffle([1, 2, 3, 4, 5], () => 0)).toEqual([2, 3, 4, 5, 1]);
  });

  it('não modifica a lista original', () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffle(original, seededRandom(42));

    expect(original).toEqual([1, 2, 3, 4, 5]);
    expect(result).not.toBe(original);
  });

  it('mantém todos os itens exatamente uma vez', () => {
    const original = Array.from({ length: 100 }, (_, index) => index);
    const result = shuffle(original, seededRandom(2026));

    expect(result).toHaveLength(original.length);
    expect([...result].sort((a, b) => a - b)).toEqual(original);
  });

  it('embaralha de fato a ordem com um gerador não trivial', () => {
    const original = Array.from({ length: 50 }, (_, index) => index);
    const result = shuffle(original, seededRandom(7));

    expect(result).not.toEqual(original);
  });

  it('lida com listas vazias ou de um elemento', () => {
    expect(shuffle([], seededRandom(1))).toEqual([]);
    expect(shuffle(['único'], seededRandom(1))).toEqual(['único']);
  });

  it('não estoura o índice se o gerador retornar 1', () => {
    expect(shuffle([1, 2, 3], () => 1)).toEqual([1, 2, 3]);
  });
});

describe('weightedSample', () => {
  it('favorece itens com peso maior', () => {
    const items = [
      { id: 'leve', weight: 1 },
      { id: 'oficial', weight: 3 },
    ];

    // Com a mesma aleatoriedade, a chave do item de peso 3 é maior.
    expect(weightedSample(items, 1, (item) => item.weight, () => 0.5)).toEqual([
      { id: 'oficial', weight: 3 },
    ]);
  });

  it('mantém quantidade e unicidade no sorteio', () => {
    const items = Array.from({ length: 20 }, (_, index) => ({
      id: index,
      weight: index < 10 ? 3 : 1,
    }));

    const result = weightedSample(items, 7, (item) => item.weight, seededRandom(2026));

    expect(result).toHaveLength(7);
    expect(new Set(result.map((item) => item.id)).size).toBe(7);
  });

  it('sorteia mais itens do grupo com peso maior', () => {
    const items = Array.from({ length: 20 }, (_, index) => ({
      id: index,
      weight: index < 10 ? 3 : 1,
    }));

    const result = weightedSample(items, 10, (item) => item.weight, seededRandom(7));
    const weightedCount = result.filter((item) => item.id < 10).length;

    expect(weightedCount).toBeGreaterThan(5);
  });

  it('ignora itens com peso zero', () => {
    const result = weightedSample(
      [
        { id: 'zero', weight: 0 },
        { id: 'um', weight: 1 },
      ],
      2,
      (item) => item.weight,
      seededRandom(1),
    );

    expect(result).toEqual([{ id: 'um', weight: 1 }]);
  });

  it('devolve todos os itens quando o pedido excede a lista', () => {
    const items = [
      { id: 'a', weight: 1 },
      { id: 'b', weight: 2 },
    ];

    const result = weightedSample(items, 10, (item) => item.weight, seededRandom(3));

    expect(result).toHaveLength(2);
    expect(new Set(result.map((item) => item.id))).toEqual(new Set(['a', 'b']));
  });

  it('não modifica a lista original', () => {
    const items = [
      { id: 'a', weight: 1 },
      { id: 'b', weight: 2 },
      { id: 'c', weight: 3 },
    ];
    const original = items.map((item) => ({ ...item }));

    weightedSample(items, 2, (item) => item.weight, seededRandom(5));

    expect(items).toEqual(original);
  });
});
