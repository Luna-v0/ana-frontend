/**
 * ANA Frontend — entry point
 * Roteamento client-side simples via hash (#busca, #sessoes, #transcricao)
 */

import './styles/main.css'
import { renderNav, ROTAS } from './components/nav.js'
import { renderBusca }       from './views/busca.js'
import { renderSessoes }     from './views/sessoes.js'
import { renderTranscricao } from './views/transcricao.js'
import { rag, health }       from './api/client.js'

const VIEWS = {
  busca:       renderBusca,
  sessoes:     renderSessoes,
  transcricao: renderTranscricao,
}

function rotaAtual() {
  return (location.hash.slice(1) || 'busca')
}

function navegar(id) {
  location.hash = id
}

function montar() {
  const rota = rotaAtual()

  document.body.innerHTML = ''
  document.body.className = 'flex h-screen bg-gray-50 font-sans antialiased overflow-hidden'

  // Sidebar
  const nav = renderNav(rota, navegar)
  document.body.appendChild(nav)

  // Área de conteúdo
  const main = document.createElement('div')
  main.id = 'main-content'
  main.className = 'flex-1 overflow-y-auto'
  document.body.appendChild(main)

  // Renderiza view
  const renderFn = VIEWS[rota] || VIEWS.busca
  main.appendChild(renderFn())

  // Status da API no nav
  atualizarStatus()
}

async function atualizarStatus() {
  const el = document.getElementById('nav-status')
  if (!el) return
  try {
    const s = await rag.status()
    el.textContent = `PostgreSQL ${s.postgres_disponivel ? '✓' : '✗'} · BM25 ${s.indice_bm25_tamanho}`
  } catch (_) {
    el.textContent = 'API indisponível'
  }
}

// Roteamento por hash
window.addEventListener('hashchange', montar)
montar()
