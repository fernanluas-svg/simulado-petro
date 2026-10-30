import { describe, expect, it } from 'vitest';
import { shuffle } from '../services/shuffle';

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
