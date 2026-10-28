export type PaletteStatus = 'blank' | 'answered' | 'correct' | 'incorrect';

/**
 * Define a cor de cada número na grade de questões.
 * O acerto/erro só é revelado quando a correção imediata está ativa; caso
 * contrário a questão apenas aparece como "respondida".
 */
export function getPaletteStatus(
  answer: string | undefined,
  correctAnswer: string,
  immediateCorrection: boolean,
): PaletteStatus {
  if (!answer) return 'blank';
  if (!immediateCorrection) return 'answered';
  return answer === correctAnswer ? 'correct' : 'incorrect';
}
