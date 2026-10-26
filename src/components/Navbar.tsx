import React from 'react';
import { useExamStore } from '../store/useExamStore';
import { BookOpen, Home, History, Settings, Award, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { view, setView, currentAttempt } = useExamStore();

  return (
    <header className="bg-[#0b132b]/90 backdrop-blur-md border-b border-[#1c2541] sticky top-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
          <div className="bg-gradient-to-tr from-cyan-600 to-blue-600 p-2 rounded-xl text-white shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-100 m-0">Transpetro Simulados 2026</h1>
            <p className="text-xs text-cyan-400 font-medium">Administração e Controle • Edital nº 03/2026.3</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <button
            onClick={() => setView('home')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'home'
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-300 hover:bg-[#1c2541] hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Início</span>
          </button>

          <button
            onClick={() => setView('bank')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'bank'
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-300 hover:bg-[#1c2541] hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Questões</span>
          </button>

          <button
            onClick={() => setView('history')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'history'
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-300 hover:bg-[#1c2541] hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico</span>
          </button>

          {currentAttempt && currentAttempt.isCompleted && (
            <button
              onClick={() => setView('result')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'result' || view === 'review'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-emerald-300 hover:bg-[#1c2541] hover:text-emerald-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Último Resultado</span>
            </button>
          )}

          <button
            onClick={() => setView('settings')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'settings'
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-300 hover:bg-[#1c2541] hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Ajustes</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
