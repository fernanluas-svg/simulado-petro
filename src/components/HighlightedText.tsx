import React from 'react';

/**
 * Renderiza textos de questões que usam `**termo**` para indicar a palavra,
 * expressão ou oração destacada. A conversão é feita em nós React (sem HTML
 * bruto), preservando quebras de linha e evitando injeção de markup.
 * Marcadores sem par continuam visíveis como texto literal.
 */
export const HighlightedText: React.FC<{ text?: string }> = ({ text }) => {
  if (!text) return null;

  const pattern = /\*\*(.+?)\*\*/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    nodes.push(
      <strong
        key={key++}
        className="font-bold underline decoration-accent/70 decoration-2 underline-offset-2"
      >
        {match[1]}
      </strong>,
    );
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <>{nodes}</>;
};
