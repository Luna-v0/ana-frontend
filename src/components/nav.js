/**
 * Barra de navegação lateral.
 * Renderiza os links de rota e marca o item ativo.
 */

export const ROTAS = [
  { id: 'busca',       label: 'Busca',        icone: '🔍' },
  { id: 'sessoes',     label: 'Processos',    icone: '📁' },
  { id: 'transcricao', label: 'Transcrição',  icone: '🎙️' },
]

/**
 * @param {string} rotaAtiva
 * @param {(id: string) => void} onNavegar
 * @returns {HTMLElement}
 */
export function renderNav(rotaAtiva, onNavegar) {
  const nav = document.createElement('nav')
  nav.className = [
    'flex flex-col gap-1 p-4 w-56 shrink-0',
    'bg-juridico-900 text-white min-h-screen',
  ].join(' ')

  // Logo
  const logo = document.createElement('div')
  logo.className = 'mb-8 px-2'
  logo.innerHTML = `
    <div class="text-xl font-bold tracking-tight">ANA</div>
    <div class="text-xs text-juridico-100/60 mt-0.5">Assistente Jurídico</div>
  `
  nav.appendChild(logo)

  // Links
  for (const rota of ROTAS) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.dataset.rota = rota.id
    btn.className = [
      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
      'transition-colors duration-100 text-left w-full',
      rotaAtiva === rota.id
        ? 'bg-juridico-500 text-white'
        : 'text-juridico-100/80 hover:bg-white/10',
    ].join(' ')
    btn.innerHTML = `<span>${rota.icone}</span><span>${rota.label}</span>`
    btn.addEventListener('click', () => onNavegar(rota.id))
    nav.appendChild(btn)
  }

  // Status badge (preenchido pelo main.js)
  const status = document.createElement('div')
  status.id = 'nav-status'
  status.className = 'mt-auto px-2 py-2 text-xs text-juridico-100/50'
  status.textContent = '...'
  nav.appendChild(status)

  return nav
}
