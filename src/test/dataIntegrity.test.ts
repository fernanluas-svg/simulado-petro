import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ExamConfig, Question } from '../types';

const dataDir = resolve(process.cwd(), 'public/data');
const subjectIds = ['portugues', 'matematica', 'conhecimentos_especificos'] as const;

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(dataDir, relativePath), 'utf8')) as T;
}

const config = readJson<ExamConfig>('exam_configs.json');
const banks = Object.fromEntries(
  subjectIds.map((subjectId) => [
    subjectId,
    readJson<Question[]>(`questions/${subjectId}.json`),
  ]),
) as Record<(typeof subjectIds)[number], Question[]>;

describe('Integridade do banco de questões', () => {
  it('possui questões suficientes para a configuração do edital', () => {
    expect(config.totalQuestions).toBe(60);
    expect(config.durationMinutes).toBe(240);

    const totalConfigured = config.subjects.reduce(
      (total, subject) => total + subject.questionCount,
      0,
    );
    expect(totalConfigured).toBe(60);

    for (const subject of config.subjects) {
      const bank = banks[subject.id as (typeof subjectIds)[number]];
      expect(bank, `banco ausente para ${subject.id}`).toBeDefined();
      expect(bank.length).toBeGreaterThanOrEqual(subject.questionCount);
    }

    const portugues = config.subjects.find((subject) => subject.id === 'portugues');
    const matematica = config.subjects.find((subject) => subject.id === 'matematica');
    const especificos = config.subjects.find(
      (subject) => subject.id === 'conhecimentos_especificos',
    );
    expect(portugues?.questionCount).toBe(10);
    expect(matematica?.questionCount).toBe(12);
    expect(especificos?.questionCount).toBe(38);
    expect(especificos?.minCorrect).toBe(12);
  });

  it('define critérios de aprovação completos no edital', () => {
    expect(config.passingCriteria.minGeneralScorePercent).toBe(50);
    expect(config.passingCriteria.minSpecificScorePercent).toBe(50);
    expect(config.passingCriteria.allowZeroInAnySubject).toBe(false);
  });

  it('mantém o texto de apoio nas questões que dependem dele', () => {
    const dependentQuestions = banks.portugues.filter((question) =>
      /(de acordo com|segundo|conforme|no|do)\s+o\s+texto|texto acima|texto a seguir|texto-base/i.test(
        question.statement,
      ),
    );

    expect(dependentQuestions.length).toBeGreaterThan(0);
    for (const question of dependentQuestions) {
      expect(
        question.supportText?.trim().length ?? 0,
        `texto de apoio de ${question.id}`,
      ).toBeGreaterThan(0);
    }
  });

  it('não possui IDs de questão duplicados entre as matérias', () => {
    const allIds = Object.values(banks).flatMap((bank) => bank.map((question) => question.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it.each(subjectIds)('valida todas as questões de %s', (subjectId) => {
    const bank = banks[subjectId];
    expect(bank.length).toBeGreaterThan(0);

    for (const question of bank) {
      expect(question.id, 'id obrigatório').toBeTruthy();
      expect(question.subjectId, `matéria de ${question.id}`).toBe(subjectId);
      expect(question.statement.trim().length, `enunciado de ${question.id}`).toBeGreaterThan(0);
      expect(question.explanation.trim().length, `explicação de ${question.id}`).toBeGreaterThan(0);
      expect(question.alternatives, `alternativas de ${question.id}`).toHaveLength(5);

      const letters = question.alternatives.map((alternative) => alternative.id);
      expect(letters, `alternativas de ${question.id}`).toEqual(['A', 'B', 'C', 'D', 'E']);
      expect(letters, `gabarito de ${question.id}`).toContain(question.correctAnswer);

      for (const alternative of question.alternatives) {
        expect(
          alternative.text.trim().length,
          `texto da alternativa ${question.id}/${alternative.id}`,
        ).toBeGreaterThan(0);
      }
    }
  });
});
