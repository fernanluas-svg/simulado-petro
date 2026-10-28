import React, { useState } from 'react';
import { getSubjectName, useExamStore } from '../store/useExamStore';
import { Search, ShieldCheck, ArrowLeft } from 'lucide-react';

export const QuestionBankScreen: React.FC = () => {
  const { allQuestionsBank, setView, config } = useExamStore();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  const filteredQuestions = allQuestionsBank.filter((q) => {
    if (selectedSubject !== 'all' && q.subjectId !== selectedSubject) return false;
    if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchStmt = q.statement.toLowerCase().includes(term);
      const matchTopic = q.topic.toLowerCase().includes(term);
      if (!matchStmt && !matchTopic) return false;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 text-left">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 min-h-11 py-1 text-ink-muted hover:text-ink text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>
        <h2 className="text-xl font-bold text-ink">Banco de Questões Transpetro</h2>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface/60 border border-line/50 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-ink-muted" />
            <input
              type="text"
              placeholder="Buscar no enunciado ou assunto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-base/80 border border-line rounded-xl pl-10 pr-4 py-3 text-ink text-base sm:text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-base/80 border border-line rounded-xl px-4 py-3 text-ink text-base sm:text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Todas as Matérias</option>
            {config?.subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-base/80 border border-line rounded-xl px-4 py-3 text-ink text-base sm:text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Todas as Dificuldades</option>
            <option value="fácil">Fácil</option>
            <option value="médio">Médio</option>
            <option value="difícil">Difícil</option>
          </select>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-6">
        <p className="text-sm text-ink-muted">
          Mostrando <strong className="text-accent">{filteredQuestions.length}</strong> de <strong className="text-ink">{allQuestionsBank.length}</strong> questões cadastradas.
        </p>

        {filteredQuestions.length === 0 && (
          <p className="text-sm text-ink-muted bg-surface/40 border border-line/40 rounded-xl p-6 text-center">
            Nenhuma questão encontrada com os filtros atuais.
          </p>
        )}

        {filteredQuestions.map((q) => (
          <div key={q.id} className="bg-surface/60 border border-line/50 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/10 text-accent border border-cyan-500/20 uppercase">
                {getSubjectName(config, q.subjectId)} • {q.topic}
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase ${
                  q.difficulty === 'fácil' ? 'bg-emerald-500/20 text-success' : q.difficulty === 'médio' ? 'bg-amber-500/20 text-warning' : 'bg-rose-500/20 text-danger'
                }`}>
                  {q.difficulty}
                </span>
                {q.verified && (
                  <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-500/20 text-accent flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Oficial Verificada
                  </span>
                )}
              </div>
            </div>

            <div className="text-ink text-base leading-relaxed font-medium">
              {q.statement}
            </div>

            <div className="space-y-2 pt-2">
              {q.alternatives.map((alt) => {
                const isCorrect = alt.id === q.correctAnswer;
                return (
                  <div
                    key={alt.id}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                      isCorrect ? 'bg-emerald-500/20 border-emerald-500/50 text-success font-semibold' : 'bg-base/60 border-line/40 text-ink-soft'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 ${
                      isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-surface text-ink-soft'
                    }`}>
                      {alt.id}
                    </span>
                    <span className="text-sm leading-relaxed">{alt.text}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-5 rounded-xl bg-base/90 border border-line/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-accent">
                <span>Gabarito: ({q.correctAnswer})</span>
                <span>{q.source}</span>
              </div>
              <p className="text-sm text-ink-soft leading-relaxed pt-1">
                <strong>Explicação:</strong> {q.explanation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
