/**
 * ANA Frontend — entry point
 * Assembles the full app shell exactly as old_index.html did,
 * split across focused modules.
 */

import './styles/main.css';

import {
  buildSidebar,
  buildSidebarOverlay,
  initSidebar,
  loadTheme,
  applyTheme,
} from './components/sidebar.js';

import {
  buildTransDrawer,
  initTransDrawer,
} from './components/transcription-drawer.js';

import { buildMain, initChat } from './views/chat.js';
import { renderMd, escHtml }   from './utils/render.js';

// ── Apply theme immediately (before paint) ───────────────────────────────────
applyTheme(loadTheme());

// ── Build app shell ───────────────────────────────────────────────────────────
const appShell = document.createElement('div');
appShell.className = 'h-full flex relative';

// 1. Mobile sidebar overlay
const overlay = buildSidebarOverlay();
appShell.appendChild(overlay);

// 2. Transcription drawer (right slide-over)
const transDrawer = buildTransDrawer();
appShell.appendChild(transDrawer);

// 3. Sidebar (left nav)
const sidebar = buildSidebar();
appShell.appendChild(sidebar);

// 4. Main content area (chat)
const main = buildMain();
appShell.appendChild(main);

document.body.appendChild(appShell);

// ── Wire sidebar (mobile overlay + theme) ─────────────────────────────────────
const { closeSidebar } = initSidebar();

// ── Wire chat (all chat logic, pass closeSidebar so newChat can close it) ─────
initChat(closeSidebar);

// ── Wire transcription drawer ─────────────────────────────────────────────────
initTransDrawer(transDrawer, renderMd, escHtml);
