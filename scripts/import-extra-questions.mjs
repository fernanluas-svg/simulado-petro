import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Converte um arquivo de questões extras (formato "materia/enunciado/
 * alternativas/respostaCorreta") para o schema nativo do app e grava em
 * public/data/questions/novas.json.
 *
 * Uso:
 *   node scripts/import-extra-questions.mjs <arquivo-de-origem.json>
 */

const source = process.argv[2];
if (!source) {
  console.error('Uso: node scripts/import-extra-questions.mjs <arquivo-de-origem.json>');
  process.exit(1);
}

const SUBJECT_BY_MATERIA = {
  'Lingua Portuguesa': 'portugues',
  'Língua Portuguesa': 'portugues',
  'Matematica e Raciocinio Logico': 'matematica',
  'Matemática e Raciocínio Lógico': 'matematica',
  'Conhecimentos Especificos': 'conhecimentos_especificos',
  'Conhecimentos Específicos': 'conhecimentos_especificos',
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Separa "Texto Base: '...'" do enunciado da questão. */
function parseStatement(enunciado) {
  const match = enunciado.match(
    /^Texto Base(?: para Interpretação)?:\s*\n?['"]([\s\S]*?)['"]\s*\n+([\s\S]*)$/,
  );
  if (match) {
    return { supportText: match[1].trim(), statement: match[2].trim() };
  }
  return { supportText: undefined, statement: enunciado.trim() };
}

const raw = JSON.parse(readFileSync(resolve(source), 'utf8'));
if (!Array.isArray(raw)) {
  throw new Error('O arquivo de origem precisa conter uma lista de questões.');
}

const converted = raw.map((item) => {
  const subjectId = SUBJECT_BY_MATERIA[item.materia];
  if (!subjectId) {
    throw new Error(`Matéria desconhecida em ${item.id}: ${item.materia}`);
  }
  if (!Array.isArray(item.alternativas) || item.alternativas.length !== 5) {
    throw new Error(`${item.id} precisa ter exatamente 5 alternativas.`);
  }
  if (
    typeof item.respostaCorreta !== 'number' ||
    item.respostaCorreta < 0 ||
    item.respostaCorreta >= item.alternativas.length
  ) {
    throw new Error(`${item.id} tem respostaCorreta inválida.`);
  }

  const { supportText, statement } = parseStatement(item.enunciado);

  return {
    id: item.id,
    subjectId,
    topic: 'Módulo Extra 60',
    statement,
    ...(supportText ? { supportText } : {}),
    alternatives: item.alternativas.map((text, index) => ({
      id: LETTERS[index],
      text,
    })),
    correctAnswer: LETTERS[item.respostaCorreta],
    explanation: item.explicacao,
    source: `${item.banca ?? 'Banca'} — Módulo Extra 60`,
    reference: `Módulo Extra 60 — ${item.materia}`,
    verified: false,
    difficulty: 'médio',
    pool: 'new',
  };
});

// A questão 02 depende do texto da questão 01. Como as questões são
// embaralhadas, o texto-base precisa acompanhar a questão dependente.
const q1 = converted.find((question) => question.id === 'transpetro_01');
const q2 = converted.find((question) => question.id === 'transpetro_02');
if (q1?.supportText && q2) {
  q2.supportText = q1.supportText;
  q2.statement = q2.statement.replace(
    /^Ainda com base no texto da Questão 01,\s*/,
    'Com base no texto, ',
  );
}

const output = resolve('public/data/questions/novas.json');
writeFileSync(output, `${JSON.stringify(converted, null, 2)}\n`, 'utf8');

const bySubject = converted.reduce((total, question) => {
  total[question.subjectId] = (total[question.subjectId] ?? 0) + 1;
  return total;
}, {});

console.log(`Gravadas ${converted.length} questões em ${output}`);
console.log(bySubject);
