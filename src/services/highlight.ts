/** Marcador usado no banco de questões para indicar termo destacado. */
export const HIGHLIGHT_MARKER = '**';

/** Remove os marcadores de destaque para buscas e comparações de texto. */
export function stripHighlightMarkers(text: string): string {
  return text.replaceAll(HIGHLIGHT_MARKER, '');
}
