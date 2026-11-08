import React, { useState } from 'react';
import { useExamStore } from '../store/useExamStore';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckSquare,
  Clock,
  Layers,
  Play,
  Shuffle,
  Sparkles,
  Square,
} from 'lucide-react';
import type { QuestionPoolSelection } from '../types';
import { getQuestionPool, usesFullPool } from '../services/questionSelection';

const DURATION_OPTIONS = [60, 120, 180, 240, 300];

export const ExamSetupScreen: React.FC = () => {
  const {
    config,
    startExam,
    setView,
    settings,
    allQuestionsBank,
    currentAttempt,
    discardAttempt,
    startError,
    clearStartError,
  } = useExamStore();

  const allSubjectIds = config?.subjects.map((subject) => subject.id) || [];
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(allSubjectIds);
  const [questionPool, setQuestionPool] =
    useState<QuestionPoolSelection>('classic');
  const [immediateCorrection, setImmediateCorrection] = useState(
    settings.defaultImmediateCorrection,
  );
  const [durationMinutes, setDurationMinutes] = useState(
    settings.defaultDurationMinutes,
  );

  const classicCount = allQuestionsBank.filter(
    (question) => getQuestionPool(question) === 'classic',
  ).length;
  const official2018Count = allQuestionsBank.filter(
    (question) => getQuestionPool(question) === 'official2018',
  ).length;
  const newCount = allQuestionsBank.filter(
    (question) => getQuestionPool(question) === 'new',
  ).length;
  const mixedCount = allQuestionsBank.length;

  const poolQuestions = allQuestionsBank.filter((question) =>
    questionPool === 'mixed'
      ? true
      : getQuestionPool(question) === questionPool,
  );

  const poolOptions: Array<{
    id: QuestionPoolSelection;
    label: string;
    description: string;
    count: number;
    icon: typeof Layers;
    disabled: boolean;
  }> = [
    {
      id: 'classic',
      label: 'Clássicas',
      description: 'Banco original, sem a prova de 2018',
      count: classicCount,
      icon: Layers,
      disabled: classicCount === 0,
    },
    {
      id: 'official2018',
      label: 'Prova Oficial de 2018',
      description: '60 questões da Cesgranrio',
      count: official2018Count,
      icon: Award,
      disabled: official2018Count === 0,
    },
    {
      id: 'new',
      label: 'Novas 60',
      description: 'Somente o módulo extra',
      count: newCount,
      icon: Sparkles,
      disabled: newCount === 0,
    },
    {
      id: 'mixed',
      label: 'Misturar',
      description: 'Todas as origens juntas',
      count: mixedCount,
      icon: Shuffle,
      disabled: mixedCount === 0,
    },
  ];

  const isAllSelected =
    allSubjectIds.length > 0 && selectedSubjects.length === allSubjectIds.length;

  const handleToggleSelectAll = () => {
    setSelectedSubjects(isAllSelected ? [] : allSubjectIds);
  };

  const handleToggleSubject = (subjectId: string) => {
    setSelectedSubjects((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId],
    );
  };

  const totalSelectedQuestions =
    config?.subjects
      .filter((subject) => selectedSubjects.includes(subject.id))
      .reduce((total, subject) => {
        const available = poolQuestions.filter(
          (question) => question.subjectId === subject.id,
        ).length;
        return (
          total +
          (usesFullPool(questionPool)
            ? available
            : Math.min(subject.questionCount, available))
        );
      }, 0) || 0;

  const handleStart = async () => {
    if (selectedSubjects.length === 0) return;

    if (currentAttempt && !currentAttempt.isCompleted) {
      const confirmed = window.confirm(
        'Existe um simulado em andamento. Deseja descartá-lo e iniciar um novo?',
      );
      if (!confirmed) return;
      await discardAttempt(currentAttempt.id);
    }

    startExam({
      immediateCorrection,
      durationMinutes,
      selectedSubjectIds: selectedSubjects,
      questionPool,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-left">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 min-h-11 py-1 text-ink-muted hover:text-ink text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>
        <h2 className="text-xl font-bold text-ink">Configuração do Simulado</h2>
      </div>

      {startError && (
        <div
          role="alert"
          className="bg-rose-500/10 border border-rose-500/30 text-danger rounded-xl p-4 flex items-start justify-between gap-4 text-sm"
        >
          <span className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            {startError}
          </span>
          <button
            type="button"
            onClick={clearStartError}
            className="text-danger hover:text-ink font-bold"
            aria-label="Fechar aviso"
          >
            ×
          </button>
        </div>
      )}

      <div className="bg-surface/60 border border-line/50 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="space-y-3">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-ink">Banco de Questões</h3>
            <p className="text-sm text-ink-soft">
              Escolha a origem das questões: banco clássico, prova oficial de
              2018, módulo das 60 novas ou uma mistura embaralhada de todas.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {poolOptions.map((option) => {
              const isActive = questionPool === option.id;
              const Icon = option.icon;

              return (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => !option.disabled && setQuestionPool(option.id)}
                  disabled={option.disabled}
                  aria-pressed={isActive}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                    isActive
                      ? 'bg-cyan-600/15 border-cyan-500/60 text-ink shadow-lg shadow-cyan-500/10'
                      : option.disabled
                        ? 'bg-surface/30 border-line/20 text-ink-muted opacity-50 cursor-not-allowed'
                        : 'bg-base/60 border-line/40 text-ink-soft hover:border-cyan-500/40 hover:text-ink'
                  }`}
                >
                  <span className="flex w-full items-center justify-between">
                    <Icon
                      className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-ink-muted'}`}
                    />
                    <span className="text-xs font-bold text-accent bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                      {option.count}
                    </span>
                  </span>
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="text-xs text-ink-muted">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          {official2018Count === 0 && (
            <p className="text-xs text-ink-muted flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> A prova oficial de 2018 ainda
              não foi carregada.
            </p>
          )}

          {newCount === 0 && (
            <p className="text-xs text-ink-muted flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> O módulo de 60 novas questões
              ainda não foi carregado.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-ink">Seleção de Matérias</h3>
          <p className="text-sm text-ink-soft">
            Escolha o simulado completo (todas as matérias) ou selecione disciplinas
            específicas para focar seus estudos.
          </p>
        </div>

        {/* Select All & Subject Checkboxes */}
        <div className="space-y-3 bg-base/60 p-4 rounded-xl border border-line/40">
          <div className="flex items-center justify-between pb-3 border-b border-line/40">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 min-h-11 text-sm font-bold text-accent hover:text-accent transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span>Selecionar / Desmarcar Todas</span>
            </button>
            <span className="text-xs text-ink-muted">
              Total Selecionado:{' '}
              <strong className="text-ink">{totalSelectedQuestions} questões</strong>
            </span>
          </div>

          <div className="space-y-2 pt-2">
            {config?.subjects.map((subject) => {
              const isChecked = selectedSubjects.includes(subject.id);
              const availableCount = poolQuestions.filter(
                (question) => question.subjectId === subject.id,
              ).length;

              return (
                <button
                  type="button"
                  key={subject.id}
                  onClick={() => handleToggleSubject(subject.id)}
                  aria-pressed={isChecked}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all text-left ${
                    isChecked
                      ? 'bg-cyan-600/10 border-cyan-500/40 text-ink'
                      : 'bg-surface/40 border-line/30 text-ink-muted hover:text-ink-soft'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-accent" />
                    ) : (
                      <Square className="w-5 h-5 text-ink-muted" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {subject.name}
                      </p>
                      <p className="text-xs text-ink-muted">
                        Peso: {subject.weight} •{' '}
                        {usesFullPool(questionPool)
                          ? `Todas as ${availableCount} da origem`
                          : `Padrão: ${subject.questionCount} questões`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-accent bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                    {availableCount} disp.
                  </span>
                </button>
              );
            })}
          </div>

          {selectedSubjects.length === 0 && (
            <p className="text-xs text-danger flex items-center gap-1.5 pt-1">
              <AlertCircle className="w-4 h-4" /> Selecione pelo menos uma matéria para
              iniciar o simulado.
            </p>
          )}
        </div>

        <p className="text-xs text-ink-muted bg-cyan-500/5 border border-cyan-500/15 rounded-xl px-4 py-3">
          O sorteio dá <strong className="text-ink">3x mais chance</strong> às questões da
          prova oficial de 2018, mantendo a ordem das matérias e o embaralhamento
          dentro de cada uma. Nos modos{' '}
          <strong className="text-ink">Prova Oficial de 2018</strong> e{' '}
          <strong className="text-ink">Novas 60</strong>, todas as questões da origem são
          usadas. No modo <strong className="text-ink">Misturar</strong>, as três origens
          entram no mesmo sorteio. As{' '}
          <strong className="text-ink">alternativas também são embaralhadas</strong> a cada
          simulado, então o gabarito não fica preso a uma letra fixa.
        </p>

        {/* Options */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-4 p-4 bg-base/60 rounded-xl border border-line/30">
            <div className="space-y-0.5">
              <label
                htmlFor="immediate-correction"
                className="text-sm font-medium text-ink flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4 text-accent" />
                <span>Correção Imediata durante a Prova</span>
              </label>
              <p className="text-xs text-ink-muted">
                Revela se a alternativa escolhida está correta imediatamente após
                responder (somente para questões já respondidas).
              </p>
            </div>
            <input
              id="immediate-correction"
              type="checkbox"
              checked={immediateCorrection}
              onChange={(event) => setImmediateCorrection(event.target.checked)}
              className="w-6 h-6 accent-cyan-500 rounded cursor-pointer shrink-0"
            />
          </div>

          <div className="p-4 bg-base/60 rounded-xl border border-line/30 space-y-2">
            <label
              htmlFor="exam-duration"
              className="text-sm font-medium text-ink flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-accent" />
              <span>Tempo Limite (Minutos)</span>
            </label>
            <select
              id="exam-duration"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
              className="w-full bg-surface border border-line rounded-lg p-3 text-ink text-base sm:text-sm focus:outline-none focus:border-cyan-500"
            >
              {!DURATION_OPTIONS.includes(durationMinutes) && (
                <option value={durationMinutes}>{durationMinutes} minutos</option>
              )}
              <option value={60}>60 minutos (1 hora)</option>
              <option value={120}>120 minutos (2 horas)</option>
              <option value={180}>180 minutos (3 horas)</option>
              <option value={240}>240 minutos (4 horas - Padrão Edital)</option>
              <option value={300}>300 minutos (5 horas)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void handleStart()}
            disabled={selectedSubjects.length === 0 || totalSelectedQuestions === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-8 py-4 rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Iniciar Simulado ({totalSelectedQuestions} Questões)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
