import React from 'react';
import { NavLink } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import {
  Award,
  BookOpen,
  History,
  Home,
  Settings,
  ShieldCheck,
} from 'lucide-react';

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center justify-center gap-1.5 min-h-11 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
    isActive
      ? 'bg-cyan-600/20 text-accent border-cyan-500/30 shadow-sm'
      : 'text-ink-soft hover:bg-surface hover:text-ink border-transparent'
  }`;

const resultItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center justify-center gap-1.5 min-h-11 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
    isActive
      ? 'bg-emerald-600/20 text-success border-emerald-500/30 shadow-sm'
      : 'text-success hover:bg-surface hover:text-success border-transparent'
  }`;

export const Navbar: React.FC = () => {
  const { currentAttempt } = useExamStore();

  return (
    <header className="bg-base/90 backdrop-blur-md border-b border-line sticky top-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <NavLink
          to="/"
          end
          className="flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          aria-label="Ir para a página inicial"
        >
          <div className="bg-gradient-to-tr from-cyan-600 to-blue-600 p-2 rounded-xl text-white shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-ink m-0">
              Transpetro Simulados 2026
            </h1>
            <p className="text-xs text-accent font-medium">
              Administração e Controle • Edital nº 03/2026.3
            </p>
          </div>
        </NavLink>

        <nav
          aria-label="Navegação principal"
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0"
        >
          <NavLink to="/" end className={navItemClass}>
            <Home className="w-4 h-4" />
            <span>Início</span>
          </NavLink>

          <NavLink to="/bank" className={navItemClass}>
            <BookOpen className="w-4 h-4" />
            <span>Questões</span>
          </NavLink>

          <NavLink to="/history" className={navItemClass}>
            <History className="w-4 h-4" />
            <span>Histórico</span>
          </NavLink>

          {currentAttempt?.isCompleted && (
            <NavLink to="/result" className={resultItemClass}>
              <Award className="w-4 h-4" />
              <span>Resultado</span>
            </NavLink>
          )}

          <NavLink to="/settings" className={navItemClass}>
            <Settings className="w-4 h-4" />
            <span>Ajustes</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
};
