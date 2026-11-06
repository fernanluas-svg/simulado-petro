import type { Question } from '../types';

/**
 * Lista de alternativas aceitas como corretas.
 *
 * A maioria das questões tem apenas `correctAnswer`. Algumas admitem mais de
 * um exemplo igualmente válido (por exemplo, dois casos de inexigibilidade de
 * licitação); nesse caso `acceptedAnswers` lista todos eles.
 */
export function getAcceptedAnswers(question: Question): string[] {
  const accepted = question.acceptedAnswers?.filter(Boolean);
  if (accepted && accepted.length > 0) return accepted;
  return [question.correctAnswer];
}

export function isAcceptedAnswer(question: Question, answer?: string): boolean {
  return Boolean(answer) && getAcceptedAnswers(question).includes(answer as string);
}
