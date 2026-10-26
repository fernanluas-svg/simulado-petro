import type { ExamConfig, SubjectConfig, Question, ExamAttempt } from '../types';

const DB_NAME = 'TranspetroSimuladosDB';
const DB_VERSION = 1;
const STORE_ATTEMPTS = 'attempts';
const STORE_SETTINGS = 'settings';

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ATTEMPTS)) {
        db.createObjectStore(STORE_ATTEMPTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS);
      }
    };
  });
}

export async function saveAttempt(attempt: ExamAttempt): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_ATTEMPTS, 'readwrite');
      const store = transaction.objectStore(STORE_ATTEMPTS);
      const request = store.put(attempt);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('IndexedDB save failed, falling back to localStorage', err);
    try {
      const history = getLocalAttempts();
      const index = history.findIndex((a: ExamAttempt) => a.id === attempt.id);
      if (index >= 0) {
        history[index] = attempt;
      } else {
        history.push(attempt);
      }
      localStorage.setItem('transpetro_attempts', JSON.stringify(history));
    } catch (e) {
      console.error('LocalStorage save also failed', e);
    }
  }
}

export async function getAttempts(): Promise<ExamAttempt[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_ATTEMPTS, 'readonly');
      const store = transaction.objectStore(STORE_ATTEMPTS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('IndexedDB get failed, falling back to localStorage', err);
    return getLocalAttempts();
  }
}

function getLocalAttempts(): ExamAttempt[] {
  try {
    const data = localStorage.getItem('transpetro_attempts');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function loadExamConfig(): Promise<ExamConfig> {
  const res = await fetch('/data/exam_configs.json');
  if (!res.ok) throw new Error('Falha ao carregar configuração do edital.');
  return await res.json();
}

export async function loadSubjects(): Promise<SubjectConfig[]> {
  const res = await fetch('/data/subjects.json');
  if (!res.ok) throw new Error('Falha ao carregar matérias.');
  return await res.json();
}

export async function loadQuestions(subjectId: string): Promise<Question[]> {
  const res = await fetch(`/data/questions/${subjectId}.json`);
  if (!res.ok) throw new Error(`Falha ao carregar questões de ${subjectId}.`);
  return await res.json();
}

export async function loadAllQuestions(): Promise<Question[]> {
  const subjectIds = ['portugues', 'matematica', 'conhecimentos_especificos'];
  const allQuestions: Question[] = [];
  for (const sId of subjectIds) {
    try {
      const qs = await loadQuestions(sId);
      allQuestions.push(...qs);
    } catch (e) {
      console.error(`Erro ao carregar ${sId}:`, e);
    }
  }
  return allQuestions;
}
