import type { Question } from '../types';
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
