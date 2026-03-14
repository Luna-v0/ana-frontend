/**
 * Sidebar — left navigation.
 * Builds the DOM and handles: dark mode toggle, mobile overlay.
 * Chat list rendering is driven by main.js (renderChatList).
 */

export function buildSidebar() {
  const aside = document.createElement('aside');
  aside.id = 'sidebar';
  aside.className =
    'w-[260px] hidden md:flex flex-col border-r border-slate-200 dark:border-zinc-800 ' +
    'bg-slate-50 dark:bg-zinc-900/40 shrink-0';

  aside.innerHTML = `
    <div class="p-3 flex items-center gap-2">
      <button id="newChatBtn"
        class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
        + Nova consulta
      </button>
      <!-- Only visible when sidebar is open as overlay on mobile -->
      <button id="sidebarCloseBtn"
        class="md:hidden text-slate-400 hover:text-slate-700 dark:hover:text-zinc-100 text-base px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800">
        ✕
      </button>
    </div>

    <div class="px-3 pb-2 flex items-center justify-between">
      <span class="text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-500">Histórico</span>
      <button id="toggleThemeBtn"
        class="text-xs rounded-md px-2 py-1 border border-slate-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 transition-colors">
        Tema
      </button> 
    </div>

    <nav id="chatList" class="pretty-scroll flex-1 overflow-y-auto px-2 pb-2 space-y-0.5"></nav>

    <div class="p-3 border-t border-slate-200 dark:border-zinc-800">
      <button id="openTransBtn"
        class="w-full inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
        Transcrição de audiência
      </button>
    </div>
  `;

  return aside;
}

export function buildSidebarOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'sidebarOverlay';
  overlay.className = 'hidden fixed inset-0 bg-black/40 z-30 md:hidden';
  return overlay;
}

export function initSidebar() {
  const sidebar        = document.getElementById('sidebar');
  const overlay        = document.getElementById('sidebarOverlay');
  const hamburgerBtn   = document.getElementById('hamburgerBtn');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

  function openSidebar() {
    sidebar.classList.remove('hidden');
    sidebar.classList.add('flex', 'fixed', 'inset-y-0', 'left-0', 'z-40', 'shadow-2xl');
    overlay.classList.remove('hidden');
  }

  function closeSidebar() {
    if (window.innerWidth >= 768) return; // CSS handles desktop
    sidebar.classList.add('hidden');
    sidebar.classList.remove('flex', 'fixed', 'inset-y-0', 'left-0', 'z-40', 'shadow-2xl');
    overlay.classList.add('hidden');
  }

  hamburgerBtn?.addEventListener('click', openSidebar);
  overlay?.addEventListener('click', closeSidebar);
  sidebarCloseBtn?.addEventListener('click', closeSidebar);

  return { openSidebar, closeSidebar };
}

// ── Theme ─────────────────────────────────────────────────────────────────────
const THEME_KEY = 'ana_theme_v1';

export function loadTheme()  { return localStorage.getItem(THEME_KEY) || 'dark'; }
export function saveTheme(t) { localStorage.setItem(THEME_KEY, t); }
export function applyTheme(t) {
  document.documentElement.classList.toggle('dark', t === 'dark');
}
export function toggleTheme() {
  const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(next);
  saveTheme(next);
}
