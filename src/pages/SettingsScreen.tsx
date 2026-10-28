import React, { useState } from 'react';
import { useExamStore } from '../store/useExamStore';
import { ArrowLeft, CheckSquare, Clock, Trash2 } from 'lucide-react';
import { clearAllData } from '../services/storage';

const DURATION_OPTIONS = [60, 120, 180, 240, 300];

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, setView } = useExamStore();
  const [isClearing, setIsClearing] = useState(false);

  const handleResetData = async () => {
    if (
      !window.confirm(
        'Deseja realmente limpar todo o histórico, preferências e dados salvos localmente?',
      )
    ) {
      return;
    }

    setIsClearing(true);
    await clearAllData();
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-left">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>
        <h2 className="text-xl font-bold text-white">Configurações e Preferências</h2>
      </div>

      <div className="bg-[#1c2541]/60 border border-[#3a506b]/50 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <p className="text-xs text-slate-400">
          Suas preferências são salvas automaticamente neste dispositivo.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-4 bg-[#0b132b]/60 rounded-xl border border-[#3a506b]/30">
            <div className="space-y-0.5">
              <label
                htmlFor="default-immediate-correction"
                className="text-sm font-medium text-white flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                <span>Correção Imediata Padrão</span>
              </label>
              <p className="text-xs text-slate-400">
                Ativar por padrão a revelação do gabarito ao responder cada questão nos
                novos simulados.
              </p>
            </div>
            <input
              id="default-immediate-correction"
              type="checkbox"
              checked={settings.defaultImmediateCorrection}
              onChange={(event) =>
                updateSettings({ defaultImmediateCorrection: event.target.checked })
              }
              className="w-5 h-5 accent-cyan-500 rounded cursor-pointer shrink-0"
            />
          </div>

          <div className="p-4 bg-[#0b132b]/60 rounded-xl border border-[#3a506b]/30 space-y-2">
            <label
              htmlFor="default-duration"
              className="text-sm font-medium text-white flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Tempo Padrão de Prova (Minutos)</span>
            </label>
            <select
              id="default-duration"
              value={settings.defaultDurationMinutes}
              onChange={(event) =>
                updateSettings({ defaultDurationMinutes: Number(event.target.value) })
              }
              className="w-full bg-[#1c2541] border border-[#3a506b] rounded-lg p-3 text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              {!DURATION_OPTIONS.includes(settings.defaultDurationMinutes) && (
                <option value={settings.defaultDurationMinutes}>
                  {settings.defaultDurationMinutes} minutos
                </option>
              )}
              <option value={60}>60 minutos (1 hora)</option>
              <option value={120}>120 minutos (2 horas)</option>
              <option value={180}>180 minutos (3 horas)</option>
              <option value={240}>240 minutos (4 horas - Padrão Edital)</option>
              <option value={300}>300 minutos (5 horas)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-[#3a506b]/40 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-rose-400">
                Limpar Dados Locais
              </span>
              <p className="text-xs text-slate-400">
                Apaga todo o histórico de simulados e preferências salvos no navegador.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleResetData()}
              disabled={isClearing}
              className="flex items-center gap-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isClearing ? 'Limpando...' : 'Limpar Dados'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
