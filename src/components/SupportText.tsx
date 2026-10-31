import React from 'react';
import { BookOpen } from 'lucide-react';

interface SupportTextProps {
  text?: string;
}

/**
 * Texto-base de questões de interpretação. Fica em um bloco recolhível para
 * não empurrar o enunciado e as alternativas demais, mas abre por padrão
 * porque a questão depende dele.
 */
export const SupportText: React.FC<SupportTextProps> = ({ text }) => {
  if (!text) return null;

  return (
    <details open className="group rounded-xl border border-line/50 bg-base/40">
      <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink-muted transition-colors hover:text-ink">
        <BookOpen className="w-3.5 h-3.5 shrink-0" />
        <span>Texto de apoio</span>
      </summary>
      <div className="overflow-x-auto px-4 pb-4">
        <pre className="max-h-80 overflow-y-auto whitespace-pre font-sans text-sm leading-relaxed text-ink-soft">
          {text}
        </pre>
      </div>
    </details>
  );
};
