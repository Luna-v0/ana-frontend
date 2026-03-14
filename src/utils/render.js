/**
 * Shared rendering utilities — used by chat and transcription drawer.
 */

const PREVIEW = 320; // chars shown before "Ver artigo completo"
export { PREVIEW };

// Session-scoped map: msgKey → full article text
export const fullTextMap = {};

export function escHtml(s) {
  return (s || '').replace(/[&<>"']/g,
    m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

export function renderMd(md) {
  const esc = (s) => (s || '').replace(/[&<>"']/g,
    m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);

  const inlineFormat = (s) => s
    .replace(/&amp;nbsp;/g, '&nbsp;')
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-200 dark:bg-zinc-700 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<em>$1</em>');

  return md.split('\n').map(raw => {
    if (raw.startsWith('# ')) {
      return `<h1 class="font-bold text-base mt-5 mb-2">${inlineFormat(esc(raw.slice(2)))}</h1>`;
    }
    if (raw.startsWith('## ')) {
      return `<h2 class="font-semibold text-sm mt-4 mb-1.5 text-slate-700 dark:text-zinc-300">${inlineFormat(esc(raw.slice(3)))}</h2>`;
    }
    if (raw.startsWith('### ')) {
      return `<h3 class="font-semibold text-sm mt-4 mb-1">${inlineFormat(esc(raw.slice(4)))}</h3>`;
    }
    if (raw.startsWith('- ') || raw.startsWith('* ')) {
      return `<p class="mb-0.5 leading-relaxed pl-3 before:content-['•'] before:mr-2 before:text-slate-400 dark:before:text-zinc-500">${inlineFormat(esc(raw.slice(2)))}</p>`;
    }
    if (raw === '---') return '<hr class="border-slate-200 dark:border-zinc-800 my-3">';
    if (!raw.trim()) return '<div class="h-1"></div>';

    // Expandable article block
    if (raw.startsWith('__EXPAND:') && raw.endsWith('__')) {
      const key = raw.slice(9, -2);
      const fullText = fullTextMap[key];
      if (!fullText) {
        return '<p class="text-xs text-slate-400 dark:text-zinc-500 italic">[realize nova busca para ver o texto completo]</p>';
      }
      const preview = esc(fullText.slice(0, PREVIEW));
      return `<div class="expandable-wrap"><p class="leading-relaxed mb-1.5">${preview}…</p>` +
        `<button class="expand-btn text-xs text-indigo-500 dark:text-indigo-400 hover:underline font-medium" data-key="${esc(key)}">Ver artigo completo</button></div>`;
    }

    // Section hierarchy breadcrumb
    if (raw.startsWith('__HIER:') && raw.endsWith('__')) {
      const text = esc(raw.slice(7, -2));
      return `<p class="text-xs text-slate-500 dark:text-zinc-400 mb-2 leading-snug">${text}</p>`;
    }

    return `<p class="mb-0.5 leading-relaxed">${inlineFormat(esc(raw))}</p>`;
  }).join('');
}
