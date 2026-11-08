import { describe, expect, it } from 'vitest';
import type { Question, QuestionPool } from '../types';
import {
  OFFICIAL_2018_WEIGHT,
  filterQuestionsByPool,
  getQuestionPool,
  isOfficial2018Question,
  selectQuestionsForSubject,
  usesFullPool,
} from '../services/questionSelection';

function makeQuestion(id: string, pool?: QuestionPool): Question {
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
    ...(pool ? { pool } : {}),
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

const poolBank = [
  makeQuestion('classic_1', 'classic'),
  makeQuestion('classic_sem_pool'),
  makeQuestion('new_1', 'new'),
  makeQuestion('new_2', 'new'),
];

describe('filtro por origem das questões', () => {
  it('mantém apenas as clássicas (e as sem pool) no modo classic', () => {
    const result = filterQuestionsByPool(poolBank, 'classic');

    expect(result.map((question) => question.id)).toEqual([
      'classic_1',
      'classic_sem_pool',
    ]);
  });

  it('mantém apenas as novas no modo new', () => {
    const result = filterQuestionsByPool(poolBank, 'new');

    expect(result.map((question) => question.id)).toEqual(['new_1', 'new_2']);
  });

  it('mantém as duas origens no modo mixed', () => {
    const result = filterQuestionsByPool(poolBank, 'mixed');

    expect(result.map((question) => question.id)).toEqual([
      'classic_1',
      'classic_sem_pool',
      'new_1',
      'new_2',
    ]);
  });

  it('usa classic como padrão', () => {
    expect(filterQuestionsByPool(poolBank).map((question) => question.id)).toEqual([
      'classic_1',
      'classic_sem_pool',
    ]);
  });
});

describe('origem da prova oficial de 2018', () => {
  const bankWithOfficial = [
    makeQuestion('classic_1', 'classic'),
    makeQuestion('classic_sem_pool'),
    // Sem `pool`: o prefixo do ID ainda identifica a prova de 2018.
    makeQuestion('transpetro-2018-q01'),
    makeQuestion('transpetro-2018-q11', 'official2018'),
    makeQuestion('new_1', 'new'),
  ];

  it('identifica a origem efetiva de cada questão', () => {
    expect(getQuestionPool(makeQuestion('transpetro-2018-q01'))).toBe('official2018');
    expect(getQuestionPool(makeQuestion('transpetro-2018-q01', 'classic'))).toBe(
      'classic',
    );
    expect(getQuestionPool(makeQuestion('classic_1'))).toBe('classic');
    expect(getQuestionPool(makeQuestion('new_1', 'new'))).toBe('new');
  });

  it('separa as questões de 2018 mesmo sem o campo pool', () => {
    const result = filterQuestionsByPool(bankWithOfficial, 'official2018');

    expect(result.map((question) => question.id)).toEqual([
      'transpetro-2018-q01',
      'transpetro-2018-q11',
    ]);
  });

  it('não inclui as questões de 2018 no modo classic', () => {
    const result = filterQuestionsByPool(bankWithOfficial, 'classic');

    expect(result.map((question) => question.id)).toEqual([
      'classic_1',
      'classic_sem_pool',
    ]);
  });

  it('mantém todas as origens no modo mixed', () => {
    const result = filterQuestionsByPool(bankWithOfficial, 'mixed');

    expect(result).toHaveLength(5);
  });

  it('usa todas as questões nos modos 2018 e novas', () => {
    expect(usesFullPool('official2018')).toBe(true);
    expect(usesFullPool('new')).toBe(true);
    expect(usesFullPool('classic')).toBe(false);
    expect(usesFullPool('mixed')).toBe(false);
  });
});
