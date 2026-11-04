import type { Alternative, Question } from '../types';
import { shuffle } from './shuffle';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface ShuffledQuestion {
  question: Question;
  /** IDs originais das alternativas na nova ordem de exibição. */
  order: string[];
}

/**
 * Embaralha as alternativas de uma questão e reatribui os rótulos (A, B, C...)
 * na nova ordem. Assim o gabarito não fica preso a uma letra fixa: a resposta
 * certa pode cair em qualquer alternativa a cada simulado.
 *
 * Retorna também a ordem dos IDs originais para que a mesma apresentação possa
 * ser restaurada depois (reload, resultado e revisão).
 */
export function shuffleQuestionAlternatives(
  question: Question,
  random: () => number = Math.random,
): ShuffledQuestion {
  const order = shuffle(
    question.alternatives.map((alternative) => alternative.id),
    random,
  );

  return {
    question: applyAlternativeOrder(question, order),
    order,
  };
}

/**
 * Reconstrói uma questão na ordem de alternativas salva na tentativa.
 * Tentativas antigas (sem `order`) mantêm a ordem e o gabarito do banco.
 */
export function applyAlternativeOrder(
  question: Question,
  order?: readonly string[],
): Question {
  if (!order?.length) return question;

  const byId = new Map(
    question.alternatives.map((alternative) => [alternative.id, alternative]),
  );
  const alternatives: Alternative[] = [];

  order.forEach((originalId, index) => {
    const alternative = byId.get(originalId);
    if (!alternative) return;
    alternatives.push({
      id: LETTERS[index] ?? String(index + 1),
      text: alternative.text,
    });
  });

  // Se a ordem salva não corresponde mais ao banco, preserva a questão original
  // para não exibir alternativas faltando nem um gabarito inválido.
  if (alternatives.length !== question.alternatives.length) return question;

  const correctIndex = order.indexOf(question.correctAnswer);
  const correctAnswer =
    correctIndex >= 0 ? (LETTERS[correctIndex] ?? question.correctAnswer) : question.correctAnswer;

  return { ...question, alternatives, correctAnswer };
}
