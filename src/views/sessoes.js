/**
 * View: Gerenciamento de Sessões (Processos)
 * Lista, cria, abre sessão, upload de documentos, busca intra/global/cross
 */

import { sessoes } from '../api/client.js'

export function renderSessoes() {
  const el = document.createElement('div')
  el.className = 'flex gap-6 h-full p-8 view-enter'

  el.innerHTML = `
    <!-- Lista de sessões -->
    <aside class="w-72 shrink-0 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-gray-900">Processos</h2>
        <button id="sess-nova-btn"
          class="text-xs px-3 py-1.5 bg-juridico-500 text-white rounded-lg
                 hover:bg-juridico-600 transition-colors">
          + Novo
        </button>
      </div>
      <div id="sess-lista" class="flex flex-col gap-2 overflow-y-auto"></div>
    </aside>

    <!-- Painel de detalhe -->
    <main id="sess-detalhe" class="flex-1 rounded-xl border border-gray-200 bg-white p-6 overflow-y-auto">
      <p class="text-sm text-gray-400">Selecione um processo para ver os detalhes.</p>
    </main>

    <!-- Modal novo processo -->
    <div id="sess-modal" class="hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 class="font-semibold text-gray-900 mb-4">Novo Processo</h3>
        <form id="sess-form" class="flex flex-col gap-3">
          <input name="numero_processo" type="text" placeholder="Número do processo (CNJ)"
            class="input" required />
          <input name="tipo_acao" type="text" placeholder="Tipo de ação"
            class="input" required />
          <select name="area" class="input">
            <option value="civil">Civil</option>
            <option value="penal">Penal</option>
            <option value="trabalhista">Trabalhista</option>
            <option value="tributario">Tributário</option>
            <option value="consumidor">Consumidor</option>
            <option value="dados">Proteção de dados</option>
            <option value="administrativo">Administrativo</option>
          </select>
          <input name="vara" type="text" placeholder="Vara / Câmara" class="input" />
          <input name="cidade_uf" type="text" placeholder="Cidade - UF" class="input" />
          <div class="flex gap-2 justify-end mt-2">
            <button type="button" id="sess-modal-cancelar"
              class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancelar
            </button>
            <button type="submit"
              class="px-5 py-2 bg-juridico-500 text-white text-sm rounded-lg
                     hover:bg-juridico-600 transition-colors">
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  `

  // Estilo de input reutilizável via @apply não disponível em vanilla — inject inline
  el.querySelectorAll('.input').forEach(i => {
    i.className = [
      'rounded-lg border border-gray-300 px-3 py-2 text-sm w-full',
      'focus:outline-none focus:ring-2 focus:ring-juridico-500',
    ].join(' ')
  })

  const lista     = el.querySelector('#sess-lista')
  const detalhe   = el.querySelector('#sess-detalhe')
  const modal     = el.querySelector('#sess-modal')
  const novaBtn   = el.querySelector('#sess-nova-btn')
  const cancelBtn = el.querySelector('#sess-modal-cancelar')
  const form      = el.querySelector('#sess-form')

  let sessaoAtiva = null

  async function carregarLista() {
    lista.innerHTML = '<p class="text-xs text-gray-400 px-1">Carregando…</p>'
    try {
      const data = await sessoes.listar()
      lista.innerHTML = ''
      if (!data.length) {
        lista.innerHTML = '<p class="text-xs text-gray-400 px-1">Nenhum processo.</p>'
        return
      }
      for (const s of data) {
        const item = document.createElement('button')
        item.type = 'button'
        item.className = [
          'text-left rounded-lg px-3 py-2.5 border transition-colors w-full',
          sessaoAtiva?.id === s.id
            ? 'border-juridico-500 bg-juridico-50'
            : 'border-gray-200 hover:border-juridico-300 bg-white',
        ].join(' ')
        item.innerHTML = `
          <div class="text-xs font-semibold text-gray-900 truncate">${s.numero_processo}</div>
          <div class="text-xs text-gray-500 truncate">${s.tipo_acao}</div>
          <div class="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded-full
                      bg-gray-100 text-gray-600">${s.area}</div>
        `
        item.addEventListener('click', () => abrirSessao(s))
        lista.appendChild(item)
      }
    } catch (err) {
      lista.innerHTML = `<p class="text-xs text-red-500">${err.message}</p>`
    }
  }

  async function abrirSessao(s) {
    sessaoAtiva = s
    await carregarLista() // re-render para marcar ativo
    renderDetalhe(s)
  }

  function renderDetalhe(s) {
    detalhe.innerHTML = `
      <div class="flex items-start justify-between mb-6">
        <div>
          <h2 class="text-lg font-bold text-gray-900">${s.numero_processo}</h2>
          <p class="text-sm text-gray-500">${s.tipo_acao} · ${s.area} · ${s.cidade_uf || '—'}</p>
        </div>
        <span class="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700">
          ${s.status.replace('_', ' ')}
        </span>
      </div>

      <!-- Documentos -->
      <section class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-medium text-gray-800 text-sm">Documentos</h3>
          <label class="cursor-pointer text-xs px-3 py-1 rounded-full border border-juridico-500
                        text-juridico-500 hover:bg-juridico-50 transition-colors">
            + Upload
            <input id="doc-upload-input" type="file" class="hidden"
              accept=".pdf,.docx,.txt,.md" />
          </label>
        </div>
        <div id="doc-lista" class="flex flex-col gap-1.5 text-sm"></div>
      </section>

      <!-- Busca na sessão -->
      <section>
        <h3 class="font-medium text-gray-800 text-sm mb-2">Busca</h3>
        <div class="flex gap-2 mb-2">
          <input id="sess-query" type="text" placeholder="Buscar nos documentos…"
            class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-juridico-500" />
          <select id="sess-modo"
            class="rounded-lg border border-gray-300 px-2 py-2 text-xs
                   focus:outline-none focus:ring-1 focus:ring-juridico-500">
            <option value="intra">Esta sessão</option>
            <option value="global">Global</option>
            <option value="cross">Outros processos</option>
          </select>
          <button id="sess-buscar-btn"
            class="px-4 py-2 bg-juridico-500 text-white text-sm rounded-lg
                   hover:bg-juridico-600 transition-colors">
            Buscar
          </button>
        </div>
        <div id="sess-resultados" class="flex flex-col gap-2"></div>
      </section>
    `

    carregarDocumentos(s.id)

    detalhe.querySelector('#doc-upload-input').addEventListener('change', async (e) => {
      const arquivo = e.target.files[0]
      if (!arquivo) return
      try {
        await sessoes.uploadDocumento(s.id, arquivo)
        carregarDocumentos(s.id)
      } catch (err) {
        alert(`Erro no upload: ${err.message}`)
      }
    })

    detalhe.querySelector('#sess-buscar-btn').addEventListener('click', async () => {
      const query = detalhe.querySelector('#sess-query').value.trim()
      const modo  = detalhe.querySelector('#sess-modo').value
      const resEl = detalhe.querySelector('#sess-resultados')
      if (!query) return
      resEl.innerHTML = '<p class="text-xs text-gray-400">Buscando…</p>'
      try {
        const data = await sessoes.buscar(s.id, query, modo)
        renderResultadosSessao(resEl, data.resultados)
      } catch (err) {
        resEl.innerHTML = `<p class="text-xs text-red-500">${err.message}</p>`
      }
    })
  }

  async function carregarDocumentos(sessaoId) {
    const listaEl = detalhe.querySelector('#doc-lista')
    if (!listaEl) return
    try {
      const docs = await sessoes.listarDocumentos(sessaoId)
      listaEl.innerHTML = docs.length ? '' : '<p class="text-xs text-gray-400">Sem documentos.</p>'
      for (const doc of docs) {
        const item = document.createElement('div')
        item.className = 'flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50'
        item.innerHTML = `
          <div>
            <span class="text-sm text-gray-800">${doc.nome}</span>
            <span class="ml-2 text-xs text-gray-400">${doc.chunks_indexados} chunks</span>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
            ${doc.tipo}
          </span>
        `
        listaEl.appendChild(item)
      }
    } catch (_) {}
  }

  function renderResultadosSessao(container, chunks) {
    container.innerHTML = ''
    if (!chunks.length) {
      container.innerHTML = '<p class="text-xs text-gray-400">Sem resultados.</p>'
      return
    }
    for (const c of chunks) {
      const card = document.createElement('div')
      card.className = 'rounded-lg border border-gray-200 bg-white p-3'
      card.innerHTML = `
        <div class="text-xs font-semibold text-juridico-600 mb-1">${c.fonte}${c.artigo ? ' — ' + c.artigo : ''}</div>
        <p class="text-xs text-gray-700 leading-relaxed">${c.texto}</p>
      `
      container.appendChild(card)
    }
  }

  novaBtn.addEventListener('click', () => modal.classList.remove('hidden'))
  cancelBtn.addEventListener('click', () => modal.classList.add('hidden'))
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden') })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const dados = Object.fromEntries(fd)
    try {
      await sessoes.criar(dados)
      modal.classList.add('hidden')
      form.reset()
      carregarLista()
    } catch (err) {
      alert(`Erro: ${err.message}`)
    }
  })

  carregarLista()
  return el
}
