import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HighlightedText } from '../components/HighlightedText';
import { stripHighlightMarkers } from '../services/highlight';

describe('HighlightedText', () => {
  it('renderiza termos entre ** como destaque, sem exibir os marcadores', () => {
    const { container } = render(
      <HighlightedText text="Analise **cujo** e **pelo gerente**." />,
    );

    const highlights = container.querySelectorAll('strong');
    expect(highlights).toHaveLength(2);
    expect(highlights[0].textContent).toBe('cujo');
    expect(highlights[1].textContent).toBe('pelo gerente');
    expect(container.textContent).toBe('Analise cujo e pelo gerente.');
  });

  it('mantém marcadores sem par como texto literal', () => {
    const { container } = render(
      <HighlightedText text="Texto **sem marcador de fechamento" />,
    );

    expect(container.querySelector('strong')).toBeNull();
    expect(container.textContent).toBe('Texto **sem marcador de fechamento');
  });

  it('remove os marcadores para buscas', () => {
    expect(stripHighlightMarkers('A **palavra** destacada')).toBe(
      'A palavra destacada',
    );
  });
});
