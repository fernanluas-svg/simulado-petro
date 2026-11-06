import { describe, expect, it } from 'vitest';
import type { Question } from '../types';
import {
  applyAlternativeOrder,
  shuffleQuestionAlternatives,
} from '../services/alternatives';

/** Gerador determinístico para testar o embaralhamento sem flakiness. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function makeQuestion(id = 'q1', correctAnswer = 'A'): Question {
  return {
    id,
    subjectId: 'portugues',
    topic: 'Tópico',
    statement: `Enunciado ${id}`,
    alternatives: ['A', 'B', 'C', 'D', 'E'].map((letter) => ({
      id: letter,
      text: `Alternativa ${letter}`,
    })),
    correctAnswer,
    explanation: 'Explicação',
    source: 'Fonte',
    reference: 'Referência',
    verified: false,
    difficulty: 'médio',
  };
}

describe('embaralhamento das alternativas', () => {
  it('reatribui os rótulos na nova ordem e mantém os textos', () => {
    const question = makeQuestion();
    const { question: presented, order } = shuffleQuestionAlternatives(
      question,
      seededRandom(42),
    );

    expect(order).toHaveLength(5);
    expect(new Set(order)).toEqual(new Set(['A', 'B', 'C', 'D', 'E']));
    expect(presented.alternatives.map((alternative) => alternative.id)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
    ]);
    expect(new Set(presented.alternatives.map((alternative) => alternative.text))).toEqual(
      new Set(question.alternatives.map((alternative) => alternative.text)),
    );
  });

  it('mantém o gabarito apontando para o mesmo texto da resposta certa', () => {
    const question = makeQuestion('q1', 'C');
    const { question: presented } = shuffleQuestionAlternatives(
      question,
      seededRandom(7),
    );

    const presentedCorrect = presented.alternatives.find(
      (alternative) => alternative.id === presented.correctAnswer,
    );
    const originalCorrect = question.alternatives.find(
      (alternative) => alternative.id === question.correctAnswer,
    );

    expect(presentedCorrect?.text).toBe(originalCorrect?.text);
  });

  it('não modifica a questão original', () => {
    const question = makeQuestion();
    const snapshot = JSON.parse(JSON.stringify(question));

    shuffleQuestionAlternatives(question, seededRandom(3));

    expect(question).toEqual(snapshot);
  });

  it('faz a letra do gabarito variar entre questões', () => {
    const letters = new Set<string>();

    for (let index = 0; index < 40; index += 1) {
      const { question } = shuffleQuestionAlternatives(
        makeQuestion(`q${index}`),
        seededRandom(index + 1),
      );
      letters.add(question.correctAnswer);
    }

    expect(letters.size).toBeGreaterThan(1);
  });

  it('reconstrói a apresentação a partir da ordem salva', () => {
    const question = makeQuestion('q1', 'A');
    const restored = applyAlternativeOrder(question, ['C', 'A', 'E', 'B', 'D']);

    expect(restored.alternatives).toEqual([
      { id: 'A', text: 'Alternativa C' },
      { id: 'B', text: 'Alternativa A' },
      { id: 'C', text: 'Alternativa E' },
      { id: 'D', text: 'Alternativa B' },
      { id: 'E', text: 'Alternativa D' },
    ]);
    expect(restored.correctAnswer).toBe('B');
  });

  it('remapeia as respostas aceitas junto com os rótulos', () => {
    const question = { ...makeQuestion('q1', 'A'), acceptedAnswers: ['A', 'C'] };
    const restored = applyAlternativeOrder(question, ['C', 'A', 'E', 'B', 'D']);

    expect(restored.correctAnswer).toBe('B');
    expect(restored.acceptedAnswers).toEqual(['B', 'A']);
    expect(
      restored.alternatives
        .filter((alternative) => restored.acceptedAnswers?.includes(alternative.id))
        .map((alternative) => alternative.text)
        .sort(),
    ).toEqual(['Alternativa A', 'Alternativa C']);
  });

  it('mantém as respostas aceitas apontando para os mesmos textos após embaralhar', () => {
    const question = { ...makeQuestion('q1', 'A'), acceptedAnswers: ['A', 'D'] };
    const { question: presented } = shuffleQuestionAlternatives(
      question,
      seededRandom(11),
    );

    const presentedAccepted = presented.alternatives
      .filter((alternative) => presented.acceptedAnswers?.includes(alternative.id))
      .map((alternative) => alternative.text)
      .sort();
    const originalAccepted = question.alternatives
      .filter((alternative) => question.acceptedAnswers?.includes(alternative.id))
      .map((alternative) => alternative.text)
      .sort();

    expect(presentedAccepted).toEqual(originalAccepted);
  });

  it('mantém a questão original quando não há ordem salva', () => {
    const question = makeQuestion();

    expect(applyAlternativeOrder(question, undefined)).toBe(question);
    expect(applyAlternativeOrder(question, [])).toBe(question);
  });

  it('ignora uma ordem incompatível com o banco', () => {
    const question = makeQuestion();

    expect(applyAlternativeOrder(question, ['A', 'B', 'C'])).toBe(question);
  });
});
