import { describe, expect, it } from 'vitest';
import type { Question } from '../types';
import {
  OFFICIAL_2018_WEIGHT,
  isOfficial2018Question,
  selectQuestionsForSubject,
} from '../services/questionSelection';

function makeQuestion(id: string): Question {
  return {
    id,
    subjectId: 'portugues',
    topic: 'Tópico',
    statement: `Enunciado ${id}`,
    alternatives: ['A', 'B', 'C', 'D', 'E'].map((letter) => ({
      id: letter,
      text: `Alternativa ${letter}`,
    })),
    correctAnswer: 'A',
    explanation: 'Explicação',
    source: 'Fonte',
    reference: 'Referência',
    verified: false,
    difficulty: 'médio',
  };
}

const officialQuestions = Array.from({ length: 10 }, (_, index) =>
  makeQuestion(`transpetro-2018-q${String(index + 1).padStart(2, '0')}`),
);
const authorialQuestions = Array.from({ length: 10 }, (_, index) =>
  makeQuestion(`pt-${String(index + 1).padStart(2, '0')}`),
);
const bank = [...officialQuestions, ...authorialQuestions];

describe('seleção de questões do simulado', () => {
  it('reconhece apenas as questões da prova oficial de 2018', () => {
    expect(officialQuestions.every(isOfficial2018Question)).toBe(true);
    expect(authorialQuestions.some(isOfficial2018Question)).toBe(false);
  });

  it('usa peso 3 para as questões de 2018', () => {
    expect(OFFICIAL_2018_WEIGHT).toBe(3);
  });

  it('preenche as vagas com as questões de 2018 antes das demais', () => {
    // Com a mesma aleatoriedade, as chaves das questões de 2018 são maiores.
    const selected = selectQuestionsForSubject(bank, 10, () => 0.5);

    expect(selected).toHaveLength(10);
    expect(selected.every(isOfficial2018Question)).toBe(true);
  });

  it('completa as vagas restantes com o banco autoral', () => {
    const selected = selectQuestionsForSubject(bank, 15, () => 0.5);
    const officialCount = selected.filter(isOfficial2018Question).length;

    expect(selected).toHaveLength(15);
    expect(officialCount).toBe(10);
    expect(new Set(selected.map((question) => question.id)).size).toBe(15);
  });

  it('embaralha a ordem final das questões sorteadas', () => {
    const selected = selectQuestionsForSubject(bank, 10, () => 0.5);

    expect(selected.map((question) => question.id)).not.toEqual(
      officialQuestions.map((question) => question.id),
    );
  });
});
