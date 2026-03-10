/**
 * View: Busca jurídica híbrida (RAG)
 * Campos: query, validar toggle, top_k
 * Resultado: lista de chunks + resumo streaming
 */

import { rag } from '../api/client.js'

export function renderBusca() {
  const el = document.createElement('div')
  el.className = 'flex flex-col gap-6 max-w-3xl mx-auto p-8 view-enter'
  el.innerHTML = `
    <h1 class="text-2xl font-bold text-gray-900">Busca na Legislação</h1>

    <form id="busca-form" class="flex flex-col gap-3">
      <div class="flex gap-2">
        <input
          id="busca-query"
          type="text"
          placeholder="Ex: consentimento para tratamento de dados pessoais LGPD"
          class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                 focus:outline-none focus:ring-2 focus:ring-juridico-500"
          autocomplete="off"
        />
        <button
          type="submit"
          class="px-5 py-2.5 bg-juridico-500 text-white text-sm font-medium
                 rounded-lg hover:bg-juridico-600 transition-colors"
        >
          Buscar
        </button>
      </div>

      <div class="flex items-center gap-6 text-sm text-gray-600">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input id="busca-validar" type="checkbox" class="accent-juridico-500" />
          Validar citações
        </label>
        <label class="flex items-center gap-2">
          Resultados:
          <select id="busca-topk"
            class="rounded border border-gray-300 px-2 py-1 text-sm
                   focus:outline-none focus:ring-1 focus:ring-juridico-500">
            <option value="5">5</option>
            <option value="10" selected>10</option>
            <option value="20">20</option>
          </select>
        </label>
      </div>
    </form>

    <div id="busca-status" class="hidden text-sm text-gray-500 animate-pulse">
      Buscando…
    </div>

    <div id="busca-resultados" class="flex flex-col gap-3"></div>

    <div id="busca-resumo-wrap" class="hidden flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-gray-800">Resumo</h2>
        <button id="busca-resumir-btn"
          class="text-xs px-3 py-1 rounded-full border border-juridico-500
                 text-juridico-500 hover:bg-juridico-50 transition-colors">
          Gerar resumo
        </button>
      </div>
      <div id="busca-resumo"
        class="prose prose-sm max-w-none rounded-lg bg-gray-50 p-4
               text-gray-700 whitespace-pre-wrap min-h-12">
      </div>
    </div>
  `

  let _chunks = []

  const form      = el.querySelector('#busca-form')
  const queryInput = el.querySelector('#busca-query')
  const validarCb = el.querySelector('#busca-validar')
  const topkSel   = el.querySelector('#busca-topk')
  const statusEl  = el.querySelector('#busca-status')
  const resultadosEl = el.querySelector('#busca-resultados')
  const resumoWrap = el.querySelector('#busca-resumo-wrap')
  const resumoEl  = el.querySelector('#busca-resumo')
  const resumirBtn = el.querySelector('#busca-resumir-btn')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const query = queryInput.value.trim()
    if (!query) return

    resultadosEl.innerHTML = ''
    resumoWrap.classList.add('hidden')
    resumoEl.textContent = ''
    statusEl.classList.remove('hidden')

    try {
      const data = await rag.buscar(query, {
        topK: Number(topkSel.value),
        validar: validarCb.checked,
      })
      _chunks = data.resultados || []
      statusEl.classList.add('hidden')
      renderResultados(resultadosEl, _chunks, data.validacao)
      if (_chunks.length) resumoWrap.classList.remove('hidden')
    } catch (err) {
      statusEl.textContent = `Erro: ${err.message}`
    }
  })

  resumirBtn.addEventListener('click', async () => {
    const query = queryInput.value.trim()
    if (!_chunks.length) return
    resumirBtn.disabled = true
    resumoEl.textContent = ''
    try {
      const res = await rag.resumir(query, _chunks)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        resumoEl.textContent += decoder.decode(value)
      }
    } catch (err) {
      resumoEl.textContent = `Erro ao gerar resumo: ${err.message}`
    } finally {
      resumirBtn.disabled = false
    }
  })

  return el
}

function renderResultados(container, chunks, validacao) {
  if (!chunks.length) {
    container.innerHTML = '<p class="text-sm text-gray-500">Nenhum resultado encontrado.</p>'
    return
  }

  // Mapa de validação por citação (se disponível)
  const mapVal = {}
  if (validacao) {
    for (const v of validacao) mapVal[v.lei] = v
  }

  for (const chunk of chunks) {
    const card = document.createElement('article')
    card.className = [
      'rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
      'hover:border-juridico-200 transition-colors',
    ].join(' ')

    const score = (chunk.score * 100).toFixed(0)
    const hier = [chunk.titulo, chunk.capitulo, chunk.secao]
      .filter(Boolean).join(' › ')

    card.innerHTML = `
      <div class="flex items-start justify-between gap-4 mb-2">
        <div>
          <span class="text-xs font-semibold text-juridico-600 uppercase tracking-wide">
            ${chunk.fonte}
          </span>
          ${chunk.artigo ? `<span class="ml-2 text-xs text-gray-500">${chunk.artigo}</span>` : ''}
          ${hier ? `<p class="text-xs text-gray-400 mt-0.5">${hier}</p>` : ''}
        </div>
        <span class="shrink-0 text-xs font-mono bg-juridico-50 text-juridico-700
                     px-2 py-0.5 rounded-full">${score}%</span>
      </div>
      <p class="text-sm text-gray-700 leading-relaxed">${chunk.texto}</p>
      ${renderValidacaoBadge(chunk, mapVal)}
    `
    container.appendChild(card)
  }
}

function renderValidacaoBadge(chunk, mapVal) {
  const v = mapVal[chunk.fonte]
  if (!v) return ''
  const cor = {
    EXISTE_E_VIGENTE:      'bg-green-50 text-green-700 border-green-200',
    LEI_REVOGADA:          'bg-red-50 text-red-700 border-red-200',
    LEI_NAO_ENCONTRADA:    'bg-yellow-50 text-yellow-700 border-yellow-200',
    ARTIGO_NAO_EXISTE:     'bg-orange-50 text-orange-700 border-orange-200',
  }[v.status] || 'bg-gray-50 text-gray-600 border-gray-200'

  return `
    <div class="mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${cor}">
      <span>${v.status.replace(/_/g, ' ')}</span>
    </div>
  `
}
