import type { Question, QuestionPool, QuestionPoolSelection } from '../types';
import { weightedSample } from './shuffle';

/** Prefixo dos IDs das questões da prova oficial Transpetro 2018. */
const OFFICIAL_2018_PREFIX = 'transpetro-2018-';

/**
 * Peso do sorteio para questões da prova oficial de 2018. As demais questões
 * entram com peso 1, então as oficiais têm 3x mais chance de serem escolhidas.
 */
export const OFFICIAL_2018_WEIGHT = 3;

export function isOfficial2018Question(question: Question): boolean {
  return question.id.startsWith(OFFICIAL_2018_PREFIX);
}

/**
 * Origem efetiva da questão. O campo `pool` é a fonte principal; quando ele
 * não existe (bancos antigos ou cache), a prova oficial de 2018 é reconhecida
 * pelo prefixo do ID.
 */
export function getQuestionPool(question: Question): QuestionPool {
  if (question.pool) return question.pool;
  return isOfficial2018Question(question) ? 'official2018' : 'classic';
}

/** Modos que usam todas as questões da origem, sem o recorte do edital. */
export function usesFullPool(pool: QuestionPoolSelection): boolean {
  return pool === 'new' || pool === 'official2018';
}

/**
 * Filtra o banco conforme a origem escolhida:
 * - `classic`: banco original, sem a prova de 2018;
 * - `official2018`: apenas a prova oficial de 2018;
 * - `new`: apenas o módulo extra de 60;
 * - `mixed`: todas as origens juntas.
 */
export function filterQuestionsByPool(
  questions: readonly Question[],
  pool: QuestionPoolSelection = 'classic',
): Question[] {
  if (pool === 'mixed') return [...questions];
  return questions.filter((question) => getQuestionPool(question) === pool);
}

/**
 * Sorteia as questões de uma matéria, priorizando as questões oficiais de 2018
 * sem deixar de lado o restante do banco. A ordem final já sai embaralhada.
 */
export function selectQuestionsForSubject(
  available: readonly Question[],
  count: number,
  random: () => number = Math.random,
): Question[] {
  return weightedSample(
    available,
    count,
    (question) => (isOfficial2018Question(question) ? OFFICIAL_2018_WEIGHT : 1),
    random,
  );
}
