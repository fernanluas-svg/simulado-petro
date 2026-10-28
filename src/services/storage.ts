import type { ExamConfig, SubjectConfig, Question, ExamAttempt, UserSettings } from '../types';

const DB_NAME = 'TranspetroSimuladosDB';
const DB_VERSION = 1;
const STORE_ATTEMPTS = 'attempts';
const STORE_SETTINGS = 'settings';

const LOCAL_ATTEMPTS_KEY = 'transpetro_attempts';
const LOCAL_SETTINGS_KEY = 'transpetro_settings';
const SETTINGS_RECORD_KEY = 'user';

const QUESTION_SUBJECT_IDS = ['portugues', 'matematica', 'conhecimentos_especificos'] as const;

function closeDB(db: IDBDatabase): void {
  try {
    db.close();
  } catch {
    /* ignora */
  }
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha na operação do IndexedDB.'));
  });
}

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Falha ao abrir o IndexedDB.'));
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

function getLocalAttempts(): ExamAttempt[] {
  try {
    const data = localStorage.getItem(LOCAL_ATTEMPTS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalAttempt(attempt: ExamAttempt): void {
  try {
    const history = getLocalAttempts();
    const index = history.findIndex((item) => item.id === attempt.id);
    if (index >= 0) history[index] = attempt;
    else history.push(attempt);
    localStorage.setItem(LOCAL_ATTEMPTS_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Não foi possível salvar a tentativa no localStorage.', error);
  }
}

function removeLocalAttempt(id: string): void {
  try {
    const history = getLocalAttempts().filter((item) => item.id !== id);
    localStorage.setItem(LOCAL_ATTEMPTS_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Não foi possível remover a tentativa do localStorage.', error);
  }
}

export async function saveAttempt(attempt: ExamAttempt): Promise<void> {
  try {
    const db = await openDB();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_ATTEMPTS, 'readwrite');
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(transaction.error ?? new Error('Falha ao salvar a tentativa.'));
        transaction.onabort = () =>
          reject(transaction.error ?? new Error('Transação de gravação abortada.'));
        transaction.objectStore(STORE_ATTEMPTS).put(attempt);
      });
    } finally {
      closeDB(db);
    }
  } catch (error) {
    console.error('IndexedDB indisponível; usando localStorage como fallback.', error);
    saveLocalAttempt(attempt);
  }
}

export async function getAttempts(): Promise<ExamAttempt[]> {
  try {
    const db = await openDB();
    try {
      const transaction = db.transaction(STORE_ATTEMPTS, 'readonly');
      const result = await requestToPromise(transaction.objectStore(STORE_ATTEMPTS).getAll());
      return Array.isArray(result) ? (result as ExamAttempt[]) : [];
    } finally {
      closeDB(db);
    }
  } catch (error) {
    console.error('IndexedDB indisponível; lendo tentativas do localStorage.', error);
    return getLocalAttempts();
  }
}

export async function deleteAttempt(id: string): Promise<void> {
  try {
    const db = await openDB();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_ATTEMPTS, 'readwrite');
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(transaction.error ?? new Error('Falha ao excluir a tentativa.'));
        transaction.onabort = () =>
          reject(transaction.error ?? new Error('Transação de exclusão abortada.'));
        transaction.objectStore(STORE_ATTEMPTS).delete(id);
      });
    } finally {
      closeDB(db);
    }
  } catch (error) {
    console.error('IndexedDB indisponível; removendo tentativa do localStorage.', error);
    removeLocalAttempt(id);
  }
}

export async function loadUserSettings(): Promise<Partial<UserSettings> | null> {
  try {
    const db = await openDB();
    try {
      const transaction = db.transaction(STORE_SETTINGS, 'readonly');
      const result = await requestToPromise(
        transaction.objectStore(STORE_SETTINGS).get(SETTINGS_RECORD_KEY),
      );
      return (result as Partial<UserSettings> | undefined) ?? null;
    } finally {
      closeDB(db);
    }
  } catch (error) {
    console.error('IndexedDB indisponível; lendo preferências do localStorage.', error);
    try {
      const data = localStorage.getItem(LOCAL_SETTINGS_KEY);
      return data ? (JSON.parse(data) as Partial<UserSettings>) : null;
    } catch {
      return null;
    }
  }
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  try {
    const db = await openDB();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_SETTINGS, 'readwrite');
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(transaction.error ?? new Error('Falha ao salvar as preferências.'));
        transaction.onabort = () =>
          reject(transaction.error ?? new Error('Transação de preferências abortada.'));
        transaction.objectStore(STORE_SETTINGS).put(settings, SETTINGS_RECORD_KEY);
      });
    } finally {
      closeDB(db);
    }
  } catch (error) {
    console.error('IndexedDB indisponível; salvando preferências no localStorage.', error);
    try {
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
    } catch (localError) {
      console.error('Não foi possível salvar as preferências.', localError);
    }
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('Falha ao apagar o banco.'));
      request.onblocked = () => resolve();
    });
  } catch (error) {
    console.error('Não foi possível apagar o IndexedDB.', error);
  }

  try {
    localStorage.removeItem(LOCAL_ATTEMPTS_KEY);
    localStorage.removeItem(LOCAL_SETTINGS_KEY);
  } catch (error) {
    console.error('Não foi possível limpar o localStorage.', error);
  }
}

export async function loadExamConfig(): Promise<ExamConfig> {
  const res = await fetch('/data/exam_configs.json');
  if (!res.ok) throw new Error('Falha ao carregar configuração do edital.');
  return (await res.json()) as ExamConfig;
}

export async function loadSubjects(): Promise<SubjectConfig[]> {
  const res = await fetch('/data/subjects.json');
  if (!res.ok) throw new Error('Falha ao carregar matérias.');
  return (await res.json()) as SubjectConfig[];
}

export async function loadQuestions(subjectId: string): Promise<Question[]> {
  const res = await fetch(`/data/questions/${subjectId}.json`);
  if (!res.ok) throw new Error(`Falha ao carregar questões de ${subjectId}.`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error(`O banco de ${subjectId} não contém uma lista de questões válida.`);
  }
  return data as Question[];
}

export async function loadAllQuestions(): Promise<Question[]> {
  const banks = await Promise.all(
    QUESTION_SUBJECT_IDS.map(async (subjectId) => {
      try {
        return await loadQuestions(subjectId);
      } catch (error) {
        const detail = error instanceof Error ? ` ${error.message}` : '';
        throw new Error(`Não foi possível carregar o banco de ${subjectId}.${detail}`);
      }
    }),
  );

  return banks.flat();
}
