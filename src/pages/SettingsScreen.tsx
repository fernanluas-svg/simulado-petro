import React, { useState } from 'react';
import { useExamStore } from '../store/useExamStore';
import { ArrowLeft, Check, CheckSquare, Clock, Palette, Trash2 } from 'lucide-react';
import { clearAllData } from '../services/storage';
import { THEME_OPTIONS } from '../services/theme';

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
          className="flex items-center gap-1.5 min-h-11 py-1 text-ink-muted hover:text-ink text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>
        <h2 className="text-xl font-bold text-ink">Configurações e Preferências</h2>
      </div>

      <div className="bg-surface/60 border border-line/50 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <p className="text-xs text-ink-muted">
          Suas preferências são salvas automaticamente neste dispositivo.
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-base/60 rounded-xl border border-line/30 space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-accent" />
              <span id="theme-label" className="text-sm font-medium text-ink">
                Tema do Aplicativo
              </span>
            </div>
            <div
              role="radiogroup"
              aria-labelledby="theme-label"
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {THEME_OPTIONS.map((option) => {
                const isSelected = settings.theme === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => updateSettings({ theme: option.id })}
                    className={`min-h-11 text-left rounded-xl border p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-line/50 bg-surface hover:bg-surface-hover'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1" aria-hidden="true">
                        <span
                          className="w-5 h-5 rounded-full border"
                          style={{
                            backgroundColor: option.preview.background,
                            borderColor: option.preview.border,
                          }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border"
                          style={{
                            backgroundColor: option.preview.surface,
                            borderColor: option.preview.border,
                          }}
                        />
                        <span
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: option.preview.accent }}
                        />
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-accent shrink-0" />}
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-ink">
                      {option.label}
                    </span>
                    <span className="block text-[11px] text-ink-muted leading-snug">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-ink-muted">
              A mudança é aplicada na hora e fica salva neste dispositivo.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 bg-base/60 rounded-xl border border-line/30">
            <div className="space-y-0.5">
              <label
                htmlFor="default-immediate-correction"
                className="text-sm font-medium text-ink flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4 text-accent" />
                <span>Correção Imediata Padrão</span>
              </label>
              <p className="text-xs text-ink-muted">
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
              className="w-6 h-6 accent-cyan-500 rounded cursor-pointer shrink-0"
            />
          </div>

          <div className="p-4 bg-base/60 rounded-xl border border-line/30 space-y-2">
            <label
              htmlFor="default-duration"
              className="text-sm font-medium text-ink flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-accent" />
              <span>Tempo Padrão de Prova (Minutos)</span>
            </label>
            <select
              id="default-duration"
              value={settings.defaultDurationMinutes}
              onChange={(event) =>
                updateSettings({ defaultDurationMinutes: Number(event.target.value) })
              }
              className="w-full bg-surface border border-line rounded-lg p-3 text-ink text-base sm:text-sm focus:outline-none focus:border-cyan-500"
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

          <div className="pt-4 border-t border-line/40 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-danger">
                Limpar Dados Locais
              </span>
              <p className="text-xs text-ink-muted">
                Apaga todo o histórico de simulados e preferências salvos no navegador.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleResetData()}
              disabled={isClearing}
              className="flex items-center gap-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-danger border border-rose-500/30 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
