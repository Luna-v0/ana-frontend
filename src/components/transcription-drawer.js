/**
 * Transcription Drawer — right-side slide-over panel.
 * Builds the DOM and wires all transcription logic.
 */

import { BASE } from '../api/client.js';
import { renderMd, escHtml } from '../utils/render.js';

export function buildTransDrawer() {
  const drawer = document.createElement('div');
  drawer.id = 'transDrawer';
  drawer.className =
    'fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white dark:bg-zinc-900 ' +
    'border-l border-slate-200 dark:border-zinc-800 shadow-2xl ' +
    'transform translate-x-full transition-transform duration-300 z-50 flex flex-col';

  drawer.innerHTML = `
    <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800 shrink-0">
      <h2 class="font-semibold text-sm">Transcrição de Audiência</h2>
      <button id="closeDrawerBtn"
        class="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-100 text-lg leading-none px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800">✕</button>
    </div>

    <div class="flex-1 overflow-y-auto pretty-scroll p-4 space-y-4">
      <div>
        <label class="block text-xs font-medium mb-1.5 text-slate-600 dark:text-zinc-400">Arquivo de áudio ou vídeo</label>
        <input type="file" id="audioFile" accept="audio/*,video/*"
          class="block w-full text-sm text-slate-500 dark:text-zinc-400
                 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg
                 file:border file:border-slate-200 dark:file:border-zinc-700
                 file:text-xs file:font-medium
                 file:bg-slate-50 dark:file:bg-zinc-800
                 hover:file:bg-slate-100 dark:hover:file:bg-zinc-700
                 file:transition-colors cursor-pointer">
      </div>

      <details class="group border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <summary class="flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-500 dark:text-zinc-400 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-zinc-800/50">
          <span class="arrow inline-block transition-transform text-[10px] opacity-60">▶</span>
          Metadados da audiência (opcional)
        </summary>
        <div class="px-3 pb-3 pt-2 space-y-2 border-t border-slate-200 dark:border-zinc-800">
          <input id="metaProcesso" type="text" placeholder="Número do processo CNJ — 0001234-56.2024.8.26.0100"
            class="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-3 py-2 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600">
          <input id="metaData" type="text" placeholder="Data da audiência — 15/01/2025"
            class="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-3 py-2 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600">
          <input id="metaTipo" type="text" value="Instrução e Julgamento" placeholder="Tipo da audiência"
            class="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-3 py-2 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600">
          <input id="metaVara" type="text" placeholder="Vara / Tribunal — 3ª Vara Cível, Foro Central"
            class="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-3 py-2 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600">
          <input id="metaCidade" type="text" placeholder="Cidade / UF — São Paulo/SP"
            class="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-3 py-2 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600">
          <!-- Participantes esperados -->
          <p class="text-xs text-slate-500 dark:text-zinc-400 pt-1">Participantes (opcional — melhora identificação)</p>
          <input id="metaJuiz" type="text" placeholder="Nome do(a) juiz(a)"
            class="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-3 py-2 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600">
          <input id="metaAdvAutor" type="text" placeholder="Advogado(a) do autor"
            class="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-3 py-2 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600">
          <input id="metaAdvReu" type="text" placeholder="Advogado(a) do réu"
            class="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-3 py-2 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600">
          <input id="metaTestemunha1" type="text" placeholder="Testemunha 1"
            class="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-3 py-2 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600">
          <input id="metaTestemunha2" type="text" placeholder="Testemunha 2"
            class="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-3 py-2 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600">
          <input id="metaPerito" type="text" placeholder="Perito(a)"
            class="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-3 py-2 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600">
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="block text-xs text-slate-500 dark:text-zinc-500 mb-1">Mín. falantes</label>
              <input id="metaMinSpk" type="number" min="1" max="4" value="2"
                class="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-3 py-2 focus:outline-none">
            </div>
            <div class="flex-1">
              <label class="block text-xs text-slate-500 dark:text-zinc-500 mb-1">Máx. falantes</label>
              <input id="metaMaxSpk" type="number" min="2" max="10" value="6"
                class="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-3 py-2 focus:outline-none">
            </div>
          </div>
        </div>
      </details>

      <button id="transcreverBtn"
        class="w-full rounded-xl py-2.5 text-sm font-medium bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-slate-700 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        Iniciar Transcrição
      </button>

      <div id="transStatus" class="hidden text-xs text-slate-500 dark:text-zinc-400 text-center py-2"></div>

      <div id="transResult"
        class="hidden pretty-scroll max-h-[50vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-zinc-800 p-3 text-xs leading-relaxed">
      </div>

      <div id="transCorrections" class="hidden space-y-2">
        <p class="text-xs font-medium text-slate-600 dark:text-zinc-400">Revisão de participantes (Camada 4)</p>
        <div id="correctionsList" class="space-y-1.5"></div>
        <button id="applyCorrectionsBtn"
          class="w-full rounded-xl py-2 text-xs font-medium border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
          Aplicar correções
        </button>
      </div>

      <div id="transAttachWrap" class="hidden pt-1">
        <button id="attachToChatBtn"
          class="w-full rounded-xl py-2.5 text-sm font-medium border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors">
          Usar no chat ↗
        </button>
        <p class="mt-1.5 text-center text-[11px] text-slate-400 dark:text-zinc-500">
          Anexa a transcrição ao próximo prompt do chat
        </p>
      </div>
    </div>
  `;

  return drawer;
}

export function initTransDrawer(drawer, renderMdFn, escHtmlFn, onAttachToChat) {
  const $ = (id) => document.getElementById(id);

  const transcreverBtn    = $('transcreverBtn');
  const transStatus       = $('transStatus');
  const transResult       = $('transResult');
  const transCorrections  = $('transCorrections');
  const correctionsList   = $('correctionsList');
  const applyCorrectionsBtn = $('applyCorrectionsBtn');
  const attachToChatBtn   = $('attachToChatBtn');
  const transAttachWrap   = $('transAttachWrap');
  const audioFile         = $('audioFile');
  const closeDrawerBtn    = $('closeDrawerBtn');

  let originalMarkdown = '';
  let currentMarkdown  = '';

  // Open / close
  function openDrawer()  { drawer.classList.remove('translate-x-full'); }
  function closeDrawer() { drawer.classList.add('translate-x-full'); }

  closeDrawerBtn.addEventListener('click', closeDrawer);

  // Wire toggle buttons (sidebar desktop + mobile header)
  function toggleDrawer() {
    drawer.classList.toggle('translate-x-full');
  }
  document.getElementById('openTransBtn')?.addEventListener('click', toggleDrawer);
  document.getElementById('openTransBtnMobile')?.addEventListener('click', toggleDrawer);

  // Transcribe
  transcreverBtn.addEventListener('click', async () => {
    const file = audioFile.files[0];
    if (!file) {
      transStatus.textContent = 'Selecione um arquivo de áudio primeiro.';
      transStatus.classList.remove('hidden');
      return;
    }

    transcreverBtn.disabled = true;
    transResult.classList.add('hidden');
    transCorrections.classList.add('hidden');
    transStatus.textContent = 'Transcrevendo... pode levar alguns minutos.';
    transStatus.classList.remove('hidden');

    const form = new FormData();
    form.append('audio',               file);
    form.append('numero_processo',     $('metaProcesso').value);
    form.append('data_audiencia',      $('metaData').value);
    form.append('tipo_audiencia',      $('metaTipo').value || 'Instrução e Julgamento');
    form.append('vara',                $('metaVara').value);
    form.append('cidade_uf',           $('metaCidade').value);
    form.append('min_speakers',        $('metaMinSpk').value);
    form.append('max_speakers',        $('metaMaxSpk').value);
    form.append('identificar_por_llm', 'true');
    form.append('juiz',                $('metaJuiz').value);
    form.append('advogado_autor',      $('metaAdvAutor').value);
    form.append('advogado_reu',        $('metaAdvReu').value);
    form.append('testemunha_1',        $('metaTestemunha1').value);
    form.append('testemunha_2',        $('metaTestemunha2').value);
    form.append('perito',              $('metaPerito').value);

    try {
      const resp = await fetch(`${BASE}/transcricao/transcrever`, { method: 'POST', body: form });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: resp.statusText }));
        throw new Error(err.detail || `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      const num  = data.num_participantes || 0;
      const dur  = data.duracao_total || 0;
      const mins = Math.floor(dur / 60);
      const segs = Math.floor(dur % 60);
      transStatus.textContent = `Concluído · ${num} falante(s) · ${mins}min ${segs}s`;
      originalMarkdown = data.markdown || '(sem conteúdo)';
      currentMarkdown  = originalMarkdown;
      transResult.innerHTML = renderMdFn(originalMarkdown);
      transResult.classList.remove('hidden');
      transAttachWrap.classList.remove('hidden');

      // Camada 4: preenche tabela de revisão de participantes
      const mapeamento = data.mapeamento_speakers || {};
      correctionsList.innerHTML = '';
      if (Object.keys(mapeamento).length > 0) {
        Object.entries(mapeamento).forEach(([speakerId, nomeFormatado]) => {
          const row = document.createElement('div');
          row.className = 'flex items-center gap-2';
          row.innerHTML =
            `<span class="shrink-0 text-xs font-mono text-slate-400 dark:text-zinc-500 w-24">${escHtmlFn(speakerId)}</span>` +
            `<input type="text" value="${escHtmlFn(nomeFormatado)}"
              data-original="${escHtmlFn(nomeFormatado)}"
              class="flex-1 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-2 py-1.5
                     focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500">`;
          correctionsList.appendChild(row);
        });
        transCorrections.classList.remove('hidden');
      }
    } catch (err) {
      transStatus.textContent = `Erro: ${err.message}`;
    } finally {
      transcreverBtn.disabled = false;
    }
  });

  applyCorrectionsBtn.addEventListener('click', () => {
    let corrigido = originalMarkdown;
    correctionsList.querySelectorAll('input[data-original]').forEach(input => {
      const original = input.dataset.original;
      const novo = input.value.trim();
      if (original && novo && original !== novo) {
        corrigido = corrigido.split(original).join(novo);
      }
    });
    currentMarkdown = corrigido;
    transResult.innerHTML = renderMdFn(corrigido);
  });

  attachToChatBtn?.addEventListener('click', () => {
    if (onAttachToChat && currentMarkdown) {
      onAttachToChat(currentMarkdown);
      closeDrawer();
    }
  });

  return { openDrawer, closeDrawer };
}
