/**
 * Chat view — main content area with message list + composer.
 * Includes all chat logic: send, stop, new chat, delete chat,
 * vigência toggle, top-k counter, char count, suggest buttons,
 * expand article, streaming summary.
 */

import { BASE } from '../api/client.js';
import { renderMd, escHtml, fullTextMap, PREVIEW } from '../utils/render.js';
import { toggleTheme } from '../components/sidebar.js';

const STORAGE_KEY = 'ana_chat_v1';

let vigenciaAtiva = true;
let topK = 5;
let isBusy = false;
let abortCtrl = null;
let msgCounter = 0;

// ── State ─────────────────────────────────────────────────────────────────────

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { chats: [], activeChatId: '' };
    const p = JSON.parse(raw);
    return { chats: p.chats || [], activeChatId: p.activeChatId || '' };
  } catch { return { chats: [], activeChatId: '' }; }
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);
const createChat = () => ({ id: uid(), title: 'Nova consulta', createdAt: Date.now(), messages: [] });
const getActiveChat = () => state.chats.find(c => c.id === state.activeChatId);

export let state = loadState();
if (!state.activeChatId || !state.chats.find(c => c.id === state.activeChatId)) {
  const c = createChat();
  state.chats.unshift(c);
  state.activeChatId = c.id;
  saveState();
}

// ── DOM builders ──────────────────────────────────────────────────────────────

export function buildMain() {
  const main = document.createElement('main');
  main.className = 'flex-1 flex flex-col min-w-0';

  // Shared composer card — lives here first, moved to footer when chat starts
  const composerShell = document.createElement('div');
  composerShell.id = 'composerShell';
  composerShell.className = 'transition-all duration-200';
  composerShell.innerHTML = `
    <!-- Composer card -->
    <div class="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm">

      <!-- Toolbar -->
      <div class="flex items-center justify-between px-3 pt-2.5">
        <div class="flex items-center gap-1.5">

          <button id="vigenciaBtn" data-active="true"
            class="rounded-lg px-2.5 py-1 text-xs border transition-colors duration-150 font-medium
                   border-emerald-400 text-emerald-600 bg-emerald-50
                   dark:border-emerald-500 dark:text-emerald-400 dark:bg-emerald-950/40"
            title="Clique para alternar entre leis vigentes / todas as leis">
            Vigentes
          </button>

          <div class="flex items-center rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden" title="Número de resultados">
            <button id="kMinusBtn"
              class="px-2 py-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors border-r border-slate-200 dark:border-zinc-800">−</button>
            <span id="kValue" class="px-2 py-1 text-xs tabular-nums select-none text-slate-600 dark:text-zinc-300 min-w-[1.75rem] text-center">5</span>
            <button id="kPlusBtn"
              class="px-2 py-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors border-l border-slate-200 dark:border-zinc-800">+</button>
          </div>

          <button id="clearBtn"
            class="rounded-lg px-2 py-1 text-xs border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors text-slate-500 dark:text-zinc-400"
            title="Limpar">Limpar</button>

        </div>
        <div class="flex items-center gap-2">
          <span id="charCount" class="text-[11px] text-slate-400 dark:text-zinc-500 tabular-nums">0</span>
          <button id="stopBtn"
            class="hidden rounded-lg px-2 py-1 text-xs border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400"
            title="Cancelar busca">Parar</button>
        </div>
      </div>

      <!-- Textarea + send -->
      <div class="flex items-end gap-2 p-3 pt-2">
        <textarea id="composer" rows="1"
          class="pretty-scroll flex-1 resize-none bg-transparent outline-none text-sm leading-6 max-h-44 px-2 py-2 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
          placeholder="Ex: prazo para contestação no processo civil..."></textarea>
        <button id="sendBtn"
          class="shrink-0 rounded-xl px-4 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors">
          Enviar
        </button>
      </div>
    </div>
    <p class="mt-2 text-center text-xs text-slate-400 dark:text-zinc-500">
      ANA — dados processados localmente (LGPD)
    </p>
  `;

  main.innerHTML = `
    <!-- Mobile header -->
    <header class="md:hidden flex items-center justify-between px-3 py-3 border-b border-slate-200 dark:border-zinc-800 shrink-0">
      <button id="hamburgerBtn"
        class="text-sm rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
        ☰
      </button>
      <span class="font-semibold text-sm">ANA</span>
      <div class="flex items-center gap-1.5">
        <button id="openTransBtnMobile" class="text-xs rounded-md px-2 py-1 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800">Trans.</button>
        <button id="toggleThemeBtnMobile" class="text-xs rounded-md px-2 py-1 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800">Tema</button>
        <button id="newChatBtnMobile" class="text-xs rounded-md px-2 py-1 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800">+</button>
      </div>
    </header>

    <!-- Empty state: composer centered in the area -->
    <div id="emptyView"
      class="flex-1 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 px-4 py-8">
      <p class="mb-6 text-xl md:text-2xl font-semibold tracking-tight text-slate-700 dark:text-zinc-200 text-center">
        ANA — Assistente de Normativas para Advogados
      </p>
      <div id="composerWrap" class="w-full max-w-2xl"></div>
    </div>

    <!-- Messages (hidden while empty) -->
    <section id="messages" class="pretty-scroll flex-1 overflow-y-auto bg-white dark:bg-zinc-950 hidden">
      <div id="messageInner" class="mx-auto w-full max-w-5xl px-4 md:px-6 py-6 space-y-5"></div>
    </section>

    <!-- Bottom footer (hidden while empty, shown once chat starts) -->
    <footer id="composerFooter"
      class="hidden shrink-0 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div id="footerInner" class="mx-auto w-full max-w-4xl px-4 md:px-6 py-4"></div>
    </footer>
  `;

  // Place composerShell in the centered empty view to start
  main.querySelector('#composerWrap').appendChild(composerShell);

  return main;
}

// ── Init (wire all events) ────────────────────────────────────────────────────

export function initChat(closeSidebarFn) {
  const els = {
    chatList:             document.getElementById('chatList'),
    messageInner:         document.getElementById('messageInner'),
    messagesWrap:         document.getElementById('messages'),
    composer:             document.getElementById('composer'),
    sendBtn:              document.getElementById('sendBtn'),
    newChatBtn:           document.getElementById('newChatBtn'),
    newChatBtnMobile:     document.getElementById('newChatBtnMobile'),
    toggleThemeBtn:       document.getElementById('toggleThemeBtn'),
    toggleThemeBtnMobile: document.getElementById('toggleThemeBtnMobile'),
    clearBtn:             document.getElementById('clearBtn'),
    stopBtn:              document.getElementById('stopBtn'),
    charCount:            document.getElementById('charCount'),
    vigenciaBtn:          document.getElementById('vigenciaBtn'),
    kMinusBtn:            document.getElementById('kMinusBtn'),
    kPlusBtn:             document.getElementById('kPlusBtn'),
    kValue:               document.getElementById('kValue'),
  };

  // ── Rendering ────────────────────────────────────────────────────────────────

  function renderAll() {
    renderChatList();
    renderMessages();
    updateSendBtn();
    autosizeTextarea();
    updateComposerLayout();
    updateCharCount();
  }

  function renderChatList() {
    els.chatList.innerHTML = '';
    [...state.chats]
      .sort((a, b) => b.createdAt - a.createdAt)
      .forEach(chat => {
        const btn = document.createElement('button');
        const active = chat.id === state.activeChatId;
        btn.className =
          'w-full text-left px-3 py-2 rounded-lg text-sm border ' +
          (active
            ? 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
            : 'bg-transparent border-transparent hover:bg-white/70 dark:hover:bg-zinc-800/50');
        btn.innerHTML = `
          <div class="flex items-center justify-between gap-2">
            <div class="truncate text-xs">${escHtml(chat.title)}</div>
            <button class="deleteChatBtn shrink-0 text-xs px-1.5 py-0.5 rounded opacity-50 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
              title="Apagar" data-id="${chat.id}">✕</button>
          </div>`;
        btn.addEventListener('click', (e) => {
          if (e.target.classList.contains('deleteChatBtn')) return;
          state.activeChatId = chat.id; saveState(); renderAll(); scrollToBottom();
          closeSidebarFn();
        });
        btn.querySelector('.deleteChatBtn').addEventListener('click', (e) => {
          e.stopPropagation(); deleteChat(chat.id);
        });
        els.chatList.appendChild(btn);
      });
  }

  function renderMessages() {
    const chat = getActiveChat();
    els.messageInner.innerHTML = '';
    if (!chat || chat.messages.length === 0) return;
    chat.messages.forEach(m => els.messageInner.appendChild(buildBubble(m.role, m.content)));
  }

  function buildBubble(role, content) {
    const row = document.createElement('div');
    row.className = 'w-full fade-in';

    const bubble = document.createElement('div');

    if (role === 'user') {
      bubble.className =
        'max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-6 ml-auto ' +
        'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900';
      bubble.innerText = content;

    } else if (content === '__thinking__') {
      bubble.className =
        'w-full rounded-2xl px-4 py-3 text-sm leading-6 ' +
        'bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800';
      bubble.innerHTML = `
        <div class="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 py-0.5 select-none">
          <span class="text-sm">Buscando</span>
          <span class="dot-1 text-lg font-bold leading-none">.</span>
          <span class="dot-2 text-lg font-bold leading-none">.</span>
          <span class="dot-3 text-lg font-bold leading-none">.</span>
        </div>`;

    } else if (content === '__thinking_summary__') {
      bubble.className =
        'w-full rounded-2xl px-4 py-3 text-sm leading-6 ' +
        'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800';
      bubble.innerHTML = `
        <div class="flex items-center gap-1.5 text-indigo-400 dark:text-indigo-500 py-0.5 select-none">
          <span class="text-sm">Analisando artigos</span>
          <span class="dot-1 text-lg font-bold leading-none">.</span>
          <span class="dot-2 text-lg font-bold leading-none">.</span>
          <span class="dot-3 text-lg font-bold leading-none">.</span>
        </div>`;

    } else if (content.startsWith('__ANALISE__')) {
      bubble.className =
        'w-full rounded-2xl px-4 py-3 text-sm leading-6 ' +
        'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800';
      const text = content.slice(11); // strip "__ANALISE__"
      bubble.innerHTML =
        `<p class="text-xs font-semibold text-indigo-500 dark:text-indigo-400 mb-2 uppercase tracking-wide">Análise dos artigos encontrados</p>` +
        renderMd(text);

    } else {
      bubble.className =
        'w-full rounded-2xl px-4 py-3 text-sm leading-6 ' +
        'bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800';
      bubble.innerHTML = renderMd(content);
    }

    row.appendChild(bubble);
    return row;
  }

  function scrollToBottom(smooth = true) {
    els.messagesWrap.scrollTo({ top: els.messagesWrap.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  }

  function updateSendBtn() {
    els.sendBtn.disabled = els.composer.value.trim().length === 0 || isBusy;
  }

  function updateCharCount() {
    els.charCount.textContent = String(els.composer.value.length);
  }

  const emptyView      = document.getElementById('emptyView');
  const composerWrap   = document.getElementById('composerWrap');
  const composerFooter = document.getElementById('composerFooter');
  const footerInner    = document.getElementById('footerInner');
  const composerShell  = document.getElementById('composerShell');

  function updateComposerLayout() {
    const chat = getActiveChat();
    const empty = !chat || chat.messages.length === 0;
    if (empty) {
      // Move composer back to the centered empty view
      if (!composerWrap.contains(composerShell)) {
        composerWrap.appendChild(composerShell);
      }
      emptyView.classList.remove('hidden');
      els.messagesWrap.classList.add('hidden');
      composerFooter.classList.add('hidden');
    } else {
      // Move composer to the bottom footer
      if (!footerInner.contains(composerShell)) {
        footerInner.appendChild(composerShell);
      }
      emptyView.classList.add('hidden');
      els.messagesWrap.classList.remove('hidden');
      composerFooter.classList.remove('hidden');
    }
  }

  // ── Vigência + Top-K ──────────────────────────────────────────────────────

  function updateVigenciaBtn() {
    if (vigenciaAtiva) {
      els.vigenciaBtn.className =
        'rounded-lg px-2.5 py-1 text-xs border font-medium transition-colors duration-150 ' +
        'border-emerald-400 text-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:bg-emerald-950/40';
      els.vigenciaBtn.textContent = 'Vigentes';
    } else {
      els.vigenciaBtn.className =
        'rounded-lg px-2.5 py-1 text-xs border font-medium transition-colors duration-150 ' +
        'border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 bg-transparent';
      els.vigenciaBtn.textContent = 'Todas';
    }
  }

  els.vigenciaBtn.addEventListener('click', () => { vigenciaAtiva = !vigenciaAtiva; updateVigenciaBtn(); });
  els.kMinusBtn.addEventListener('click', () => { if (topK > 1)  { topK--; els.kValue.textContent = topK; } });
  els.kPlusBtn.addEventListener('click',  () => { if (topK < 20) { topK++; els.kValue.textContent = topK; } });

  // ── Chat / API ────────────────────────────────────────────────────────────

  async function sendMessage() {
    const chat = getActiveChat();
    const text = els.composer.value.trim();
    if (!chat || !text || isBusy) return;

    chat.messages.push({ role: 'user', content: text });
    updateChatTitle(chat);
    els.composer.value = '';
    autosizeTextarea();
    updateCharCount();
    saveState();
    renderAll();
    scrollToBottom();

    // Thinking placeholder
    const assistantMsg = { role: 'assistant', content: '__thinking__' };
    chat.messages.push(assistantMsg);
    renderMessages();
    scrollToBottom(false);

    isBusy = true;
    abortCtrl = new AbortController();
    els.stopBtn.classList.remove('hidden');
    updateSendBtn();

    try {
      // ── 1. Busca de artigos ─────────────────────────────────
      const filtros = vigenciaAtiva ? { vigencia: 'ativa' } : {};
      const resp = await fetch(`${BASE}/rag/buscar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, filtros, top_k: topK, usar_reranker: true, usar_mmr: true }),
        signal: abortCtrl.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: resp.statusText }));
        throw new Error(err.detail || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      assistantMsg.content = formatResultados(data);
      renderMessages();
      scrollToBottom(false);

      // ── 2. Resumo via SLM (streaming) ──────────────────────
      if (data.resultados && data.resultados.length > 0) {
        const summaryMsg = { role: 'assistant', content: '__thinking_summary__' };
        chat.messages.push(summaryMsg);
        renderMessages();
        scrollToBottom(false);

        const summaryBubble = els.messageInner.lastChild?.firstChild;
        const INDIGO_CLASS =
          'w-full rounded-2xl px-4 py-3 text-sm leading-6 ' +
          'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800';
        const LABEL_HTML =
          `<p class="text-xs font-semibold text-indigo-500 dark:text-indigo-400 mb-2 uppercase tracking-wide">Análise dos artigos encontrados</p>`;
        const CURSOR_HTML =
          `<span class="inline-block w-0.5 h-3.5 bg-indigo-400 dark:bg-indigo-500 ml-0.5 align-middle animate-pulse"></span>`;

        let summaryText = '';
        try {
          const summaryResp = await fetch(`${BASE}/rag/resumir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: text, chunks: data.resultados }),
            signal: abortCtrl.signal,
          });

          if (summaryResp.ok) {
            const reader = summaryResp.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              summaryText += decoder.decode(value, { stream: true });
              if (summaryBubble) {
                summaryBubble.className = INDIGO_CLASS;
                summaryBubble.innerHTML = LABEL_HTML + renderMd(summaryText.trim()) + CURSOR_HTML;
                scrollToBottom(false);
              }
            }
          } else {
            summaryText = '_Resumo indisponível (erro no servidor)._';
          }
        } catch (summaryErr) {
          if (summaryErr.name === 'AbortError') {
            summaryText = '_Análise cancelada._';
          } else {
            summaryText = `_Erro ao gerar resumo: ${summaryErr.message}_`;
          }
        }

        summaryMsg.content = '__ANALISE__' + (summaryText.trim() || '_O modelo não retornou resposta._');
        if (summaryBubble) {
          summaryBubble.className = INDIGO_CLASS;
          summaryBubble.innerHTML = LABEL_HTML + renderMd(summaryMsg.content.slice(11));
        }
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        assistantMsg.content = '_Busca cancelada._';
      } else {
        assistantMsg.content = `**Erro:** ${err.message}\n\nVerifique se o backend está rodando em \`${BASE}\`.`;
      }
    } finally {
      isBusy = false;
      abortCtrl = null;
      els.stopBtn.classList.add('hidden');
      saveState();
      renderAll();
      scrollToBottom();
    }
  }

  function formatResultados(data) {
    const resultados = data.resultados || [];
    const total = data.total || resultados.length;

    if (resultados.length === 0) {
      return '### Nenhum resultado encontrado\n\n_Verifique se há legislação indexada ou refine a busca._';
    }

    const msgKey = ++msgCounter;
    const header =
      `_${total} resultado${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}_ · ` +
      `vigência: \`${vigenciaAtiva ? 'somente vigentes' : 'todas'}\` · top-k: \`${topK}\`\n\n---\n`;

    const blocos = resultados.map((r, i) => {
      const fonte  = r.fonte    || 'Fonte desconhecida';
      const artigo = r.artigo   ? ` — ${r.artigo}` : '';
      const area   = r.area     ? `\`${r.area}\`` : '';
      const vig    = r.vigencia ? `\`${r.vigencia}\`` : '';
      const pct    = typeof r.score === 'number'
        ? `relevância: \`${(r.score * 100).toFixed(1)}%\`` : '';
      const badges = [area, vig, pct].filter(Boolean).join(' &nbsp; ');

      const hier = [r.titulo, r.capitulo, r.secao].filter(Boolean);
      const hierLine = hier.length ? `__HIER:${hier.join(' › ')}__\n` : '';

      const texto = r.texto || '';
      let textoMd;
      if (texto.length > PREVIEW) {
        const key = `${msgKey}-${i}`;
        fullTextMap[key] = texto;
        textoMd = `__EXPAND:${key}__`;
      } else {
        textoMd = texto;
      }

      return `### ${i + 1}. ${fonte}${artigo}\n${badges}\n${hierLine}\n${textoMd}\n\n---`;
    });

    return header + blocos.join('\n');
  }

  function stopSearch() {
    if (abortCtrl) abortCtrl.abort();
  }

  // ── Chat helpers ─────────────────────────────────────────────────────────

  function updateChatTitle(chat) {
    const first = chat.messages.find(m => m.role === 'user');
    if (!first) return;
    const t = first.content.trim().replace(/\s+/g, ' ');
    chat.title = t.length > 32 ? t.slice(0, 32) + '…' : (t || 'Nova consulta');
  }

  function newChat() {
    const c = createChat();
    state.chats.unshift(c);
    state.activeChatId = c.id;
    saveState();
    renderAll();
    els.composer.focus();
    closeSidebarFn();
  }

  function deleteChat(id) {
    const idx = state.chats.findIndex(c => c.id === id);
    if (idx === -1) return;
    state.chats.splice(idx, 1);
    if (state.chats.length === 0) {
      const c = createChat();
      state.chats.unshift(c);
      state.activeChatId = c.id;
    } else if (state.activeChatId === id) {
      state.activeChatId = state.chats[0].id;
    }
    saveState();
    renderAll();
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  function autosizeTextarea() {
    const ta = els.composer;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 176) + 'px';
  }

  function setComposerText(t) {
    els.composer.value = t || '';
    autosizeTextarea();
    updateCharCount();
    updateSendBtn();
    els.composer.focus();
    els.composer.setSelectionRange(t.length, t.length);
  }

  // ── Event wiring ─────────────────────────────────────────────────────────

  els.sendBtn.addEventListener('click', sendMessage);
  els.composer.addEventListener('input', () => { autosizeTextarea(); updateSendBtn(); updateCharCount(); });
  els.composer.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  els.newChatBtn?.addEventListener('click', newChat);
  els.newChatBtnMobile?.addEventListener('click', newChat);
  els.toggleThemeBtn?.addEventListener('click', toggleTheme);
  els.toggleThemeBtnMobile?.addEventListener('click', toggleTheme);
  els.clearBtn?.addEventListener('click', () => setComposerText(''));
  els.stopBtn?.addEventListener('click', stopSearch);

  // Expand article — replace the whole .expandable-wrap
  els.messageInner.addEventListener('click', (e) => {
    const btn = e.target.closest('.expand-btn');
    if (!btn) return;
    const key = btn.dataset.key;
    const fullText = fullTextMap[key];
    if (!fullText) return;
    const wrap = btn.closest('.expandable-wrap');
    const p = document.createElement('p');
    p.className = 'leading-relaxed';
    p.textContent = fullText;
    (wrap || btn).replaceWith(p);
  });

  // Init
  autosizeTextarea();
  updateSendBtn();
  updateCharCount();
  updateComposerLayout();
  els.composer.focus();

  // Expose renderAll so main.js can call it after state changes
  return { renderAll, renderChatList };
}
