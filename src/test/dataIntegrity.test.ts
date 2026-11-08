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
const extraBank = readJson<Question[]>('questions/novas.json');

function assertValidQuestion(question: Question, expectedSubjectId?: string): void {
  expect(question.id, 'id obrigatório').toBeTruthy();
  if (expectedSubjectId) {
    expect(question.subjectId, `matéria de ${question.id}`).toBe(expectedSubjectId);
  } else {
    expect(subjectIds, `matéria de ${question.id}`).toContain(question.subjectId);
  }
  expect(question.statement.trim().length, `enunciado de ${question.id}`).toBeGreaterThan(0);
  expect(question.explanation.trim().length, `explicação de ${question.id}`).toBeGreaterThan(0);
  expect(question.alternatives, `alternativas de ${question.id}`).toHaveLength(5);

  const letters = question.alternatives.map((alternative) => alternative.id);
  expect(letters, `alternativas de ${question.id}`).toEqual(['A', 'B', 'C', 'D', 'E']);
  expect(letters, `gabarito de ${question.id}`).toContain(question.correctAnswer);

  if (question.acceptedAnswers) {
    expect(
      question.acceptedAnswers.length,
      `respostas aceitas de ${question.id}`,
    ).toBeGreaterThan(0);
    expect(
      new Set(question.acceptedAnswers).size,
      `respostas aceitas duplicadas em ${question.id}`,
    ).toBe(question.acceptedAnswers.length);
    for (const answer of question.acceptedAnswers) {
      expect(letters, `resposta aceita ${question.id}/${answer}`).toContain(answer);
    }
    expect(
      question.acceptedAnswers,
      `respostas aceitas de ${question.id} devem incluir o gabarito`,
    ).toContain(question.correctAnswer);
  }

  for (const alternative of question.alternatives) {
    expect(
      alternative.text.trim().length,
      `texto da alternativa ${question.id}/${alternative.id}`,
    ).toBeGreaterThan(0);

    // O embaralhamento reatribui as letras A-E. Alternativas que citam
    // letras ou "alternativas acima/abaixo" deixariam de fazer sentido.
    expect(
      alternative.text,
      `alternativa ${question.id}/${alternative.id} não pode referenciar letras`,
    ).not.toMatch(
      /\b(alternativas?|opç(?:ão|ões))\s+(A|B|C|D|E)\b|\b[A-E]\s+e\s+[A-E]\b|\b(alternativas?|opç(?:ão|ões))\s+(acima|abaixo)\b/i,
    );
  }
}

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

  it('possui 200 questões clássicas e 60 no módulo extra', () => {
    const classic = Object.values(banks).flat();
    expect(classic).toHaveLength(200);
    expect(extraBank).toHaveLength(60);

    const extraBySubject = extraBank.reduce<Record<string, number>>(
      (total, question) => {
        total[question.subjectId] = (total[question.subjectId] ?? 0) + 1;
        return total;
      },
      {},
    );
    expect(extraBySubject).toEqual({
      portugues: 20,
      matematica: 15,
      conhecimentos_especificos: 25,
    });
  });

  it('não possui IDs de questão duplicados entre as matérias', () => {
    const allIds = [...Object.values(banks).flat(), ...extraBank].map(
      (question) => question.id,
    );
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it.each(subjectIds)('valida todas as questões de %s', (subjectId) => {
    const bank = banks[subjectId];
    expect(bank.length).toBeGreaterThan(0);

    for (const question of bank) {
      assertValidQuestion(question, subjectId);
    }
  });

  it('valida todas as questões do módulo extra', () => {
    for (const question of extraBank) {
      assertValidQuestion(question);
      expect(question.pool, `pool de ${question.id}`).toBe('new');
    }
  });

  it('separa a prova oficial de 2018 do restante do banco', () => {
    const allQuestions = [...Object.values(banks).flat(), ...extraBank];
    const official = allQuestions.filter((question) =>
      question.id.startsWith('transpetro-2018-'),
    );
    const classic = allQuestions.filter(
      (question) => !question.pool || question.pool === 'classic',
    );

    expect(allQuestions).toHaveLength(260);
    expect(official).toHaveLength(60);
    expect(official.every((question) => question.pool === 'official2018')).toBe(true);
    expect(official.filter((question) => question.subjectId === 'portugues')).toHaveLength(
      10,
    );
    expect(official.filter((question) => question.subjectId === 'matematica')).toHaveLength(
      10,
    );
    expect(
      official.filter(
        (question) => question.subjectId === 'conhecimentos_especificos',
      ),
    ).toHaveLength(40);

    expect(classic).toHaveLength(140);
    expect(classic.some((question) => question.id.startsWith('transpetro-2018-'))).toBe(
      false,
    );
  });

  it('mantém texto de apoio nas questões extras que dependem dele', () => {
    const dependent = extraBank.filter((question) =>
      /com base no texto|de acordo com o texto|texto acima|texto a seguir|texto-base/i.test(
        question.statement,
      ),
    );

    expect(dependent.length).toBeGreaterThan(0);
    for (const question of dependent) {
      expect(
        question.supportText?.trim().length ?? 0,
        `texto de apoio de ${question.id}`,
      ).toBeGreaterThan(0);
    }
  });
});
