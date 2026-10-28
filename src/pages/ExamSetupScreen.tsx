import React, { useState } from 'react';
import { useExamStore } from '../store/useExamStore';
import { Clock, CheckSquare, Square, ArrowLeft, Play, AlertCircle } from 'lucide-react';

export const ExamSetupScreen: React.FC = () => {
  const { config, startExam, setView, settings, allQuestionsBank } = useExamStore();
  
  const allSubjectIds = config?.subjects.map(s => s.id) || [];
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(allSubjectIds);
  const [immediateCorrection, setImmediateCorrection] = useState(settings.defaultImmediateCorrection);
  const [durationMinutes, setDurationMinutes] = useState(settings.defaultDurationMinutes);

  const isAllSelected = allSubjectIds.length > 0 && selectedSubjects.length === allSubjectIds.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(allSubjectIds);
    }
  };

  const handleToggleSubject = (subId: string) => {
    if (selectedSubjects.includes(subId)) {
      setSelectedSubjects(selectedSubjects.filter(id => id !== subId));
    } else {
      setSelectedSubjects([...selectedSubjects, subId]);
    }
  };

  // Calculate total questions available for selected subjects
  const totalSelectedQuestions = config?.subjects
    .filter(sub => selectedSubjects.includes(sub.id))
    .reduce((acc, sub) => {
      const available = allQuestionsBank.filter(q => q.subjectId === sub.id).length;
      return acc + Math.min(sub.questionCount, available);
    }, 0) || 0;

  const handleStart = () => {
    if (selectedSubjects.length === 0) return;
    startExam({
      immediateCorrection,
      durationMinutes,
      selectedSubjectIds: selectedSubjects,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-left">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>
        <h2 className="text-xl font-bold text-white">Configuração do Simulado</h2>
      </div>

      <div className="bg-[#1c2541]/60 border border-[#3a506b]/50 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Seleção de Matérias</h3>
          <p className="text-sm text-slate-300">
            Escolha o simulado completo (todas as matérias) ou selecione disciplinas específicas para focar seus estudos.
          </p>
        </div>

        {/* Select All & Subject Checkboxes */}
        <div className="space-y-3 bg-[#0b132b]/60 p-4 rounded-xl border border-[#3a506b]/40">
          <div className="flex items-center justify-between pb-3 border-b border-[#3a506b]/40">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {isAllSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              <span>Selecionar / Desmarcar Todas</span>
            </button>
            <span className="text-xs text-slate-400">
              Total Selecionado: <strong className="text-white">{totalSelectedQuestions} questões</strong>
            </span>
          </div>

          <div className="space-y-2 pt-2">
            {config?.subjects.map((sub) => {
              const isChecked = selectedSubjects.includes(sub.id);
              const availableCount = allQuestionsBank.filter(q => q.subjectId === sub.id).length;

              return (
                <div
                  key={sub.id}
                  onClick={() => handleToggleSubject(sub.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-cyan-600/10 border-cyan-500/40 text-white'
                      : 'bg-[#1c2541]/40 border-[#3a506b]/30 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isChecked ? <CheckSquare className="w-5 h-5 text-cyan-400" /> : <Square className="w-5 h-5 text-slate-500" />}
                    <div>
                      <p className="text-sm font-medium text-slate-100">{sub.name}</p>
                      <p className="text-xs text-slate-400">Peso: {sub.weight} • Padrão: {sub.questionCount} questões</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                    {availableCount} disp.
                  </span>
                </div>
              );
            })}
          </div>

          {selectedSubjects.length === 0 && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5 pt-1">
              <AlertCircle className="w-4 h-4" /> Selecione pelo menos uma matéria para iniciar o simulado.
            </p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between p-4 bg-[#0b132b]/60 rounded-xl border border-[#3a506b]/30">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                <span>Correção Imediata durante a Prova</span>
              </label>
              <p className="text-xs text-slate-400">
                Revela se a alternativa escolhida está correta imediatamente após responder (somente para questões já respondidas).
              </p>
            </div>
            <input
              type="checkbox"
              checked={immediateCorrection}
              onChange={(e) => setImmediateCorrection(e.target.checked)}
              className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
            />
          </div>

          <div className="p-4 bg-[#0b132b]/60 rounded-xl border border-[#3a506b]/30 space-y-2">
            <label className="text-sm font-medium text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Tempo Limite (Minutos)</span>
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-[#1c2541] border border-[#3a506b] rounded-lg p-3 text-white text-sm focus:outline-none focus:border-cyan-500"
            >
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
            onClick={handleStart}
            disabled={selectedSubjects.length === 0}
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
