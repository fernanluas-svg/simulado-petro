import React, { useState } from 'react';
import { useExamStore } from '../store/useExamStore';
import { Clock, CheckSquare, ArrowLeft, Play } from 'lucide-react';

export const ExamSetupScreen: React.FC = () => {
  const { config, startExam, setView, settings } = useExamStore();
  const [immediateCorrection, setImmediateCorrection] = useState(settings.defaultImmediateCorrection);
  const [durationMinutes, setDurationMinutes] = useState(settings.defaultDurationMinutes);

  const handleStart = () => {
    startExam({
      immediateCorrection,
      durationMinutes,
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
          <h3 className="text-lg font-semibold text-white">Estrutura Oficial da Prova</h3>
          <p className="text-sm text-slate-300">
            {config?.title || 'Simulado Oficial Transpetro 2026'} ({config?.noticeNumber || 'Edital nº 03/2026.3'})
          </p>
        </div>

        {/* Breakdown table */}
        <div className="border border-[#3a506b]/40 rounded-xl overflow-hidden bg-[#0b132b]/50">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#1c2541] text-slate-300 border-b border-[#3a506b]">
                <th className="p-3.5 font-semibold">Matéria</th>
                <th className="p-3.5 font-semibold text-center">Questões</th>
                <th className="p-3.5 font-semibold text-center">Peso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3a506b]/30">
              {config?.subjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#1c2541]/30">
                  <td className="p-3.5 text-slate-200 font-medium">{sub.name}</td>
                  <td className="p-3.5 text-center text-cyan-400 font-bold">{sub.questionCount}</td>
                  <td className="p-3.5 text-center text-slate-300">{sub.weight}</td>
                </tr>
              ))}
              <tr className="bg-[#1c2541]/40 font-bold text-white">
                <td className="p-3.5">Total Geral</td>
                <td className="p-3.5 text-center text-cyan-400">{config?.totalQuestions || 60}</td>
                <td className="p-3.5 text-center">-</td>
              </tr>
            </tbody>
          </table>
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
            <p className="text-xs text-slate-400">
              Referência padrão do edital: 240 minutos (4 horas). Você pode ajustar se preferir um treino mais rápido.
            </p>
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
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-8 py-4 rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Iniciar Simulado Agora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
