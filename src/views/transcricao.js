/**
 * View: Transcrição de Áudio
 * Upload de arquivo de áudio → exibe transcrição com falantes
 */

import { transcricao } from '../api/client.js'

export function renderTranscricao() {
  const el = document.createElement('div')
  el.className = 'flex flex-col gap-6 max-w-2xl mx-auto p-8 view-enter'

  el.innerHTML = `
    <h1 class="text-2xl font-bold text-gray-900">Transcrição</h1>
    <p class="text-sm text-gray-500">
      Envie um arquivo de áudio (MP3, WAV, M4A) para transcrição automática
      com identificação de falantes.
    </p>

    <div id="trans-dropzone"
      class="flex flex-col items-center justify-center gap-3 rounded-2xl border-2
             border-dashed border-gray-300 bg-gray-50 px-8 py-12 cursor-pointer
             hover:border-juridico-400 hover:bg-juridico-50 transition-colors">
      <div class="text-4xl">🎙️</div>
      <p class="text-sm font-medium text-gray-700">
        Arraste um arquivo ou <label class="text-juridico-500 underline cursor-pointer">
          clique para selecionar
          <input id="trans-input" type="file" accept="audio/*" class="hidden" />
        </label>
      </p>
      <p class="text-xs text-gray-400">MP3, WAV, M4A, FLAC — máx. 500 MB</p>
    </div>

    <div id="trans-progresso" class="hidden flex flex-col gap-2">
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <div class="size-4 rounded-full border-2 border-juridico-500
                    border-t-transparent animate-spin"></div>
        <span id="trans-progresso-msg">Transcrevendo…</span>
      </div>
    </div>

    <div id="trans-resultado" class="hidden flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-gray-800">Transcrição</h2>
        <div class="flex gap-2">
          <button id="trans-copiar"
            class="text-xs px-3 py-1 rounded-full border border-gray-300
                   text-gray-600 hover:bg-gray-50 transition-colors">
            Copiar
          </button>
          <button id="trans-baixar"
            class="text-xs px-3 py-1 rounded-full border border-juridico-500
                   text-juridico-500 hover:bg-juridico-50 transition-colors">
            Baixar .txt
          </button>
        </div>
      </div>

      <div id="trans-segmentos" class="flex flex-col gap-2"></div>

      <div id="trans-texto-completo"
        class="rounded-xl bg-gray-50 border border-gray-200 p-4
               text-sm text-gray-700 leading-relaxed whitespace-pre-wrap hidden">
      </div>
    </div>
  `

  const dropzone   = el.querySelector('#trans-dropzone')
  const input      = el.querySelector('#trans-input')
  const progresso  = el.querySelector('#trans-progresso')
  const progressoMsg = el.querySelector('#trans-progresso-msg')
  const resultado  = el.querySelector('#trans-resultado')
  const segmentos  = el.querySelector('#trans-segmentos')
  const textoEl    = el.querySelector('#trans-texto-completo')

  let _textoCompleto = ''

  async function processar(arquivo) {
    progresso.classList.remove('hidden')
    resultado.classList.add('hidden')
    progressoMsg.textContent = `Transcrevendo "${arquivo.name}"…`

    const fd = new FormData()
    fd.append('arquivo', arquivo)

    try {
      const data = await transcricao.transcrever(fd)
      progresso.classList.add('hidden')
      renderResultado(data)
    } catch (err) {
      progresso.classList.add('hidden')
      progressoMsg.textContent = `Erro: ${err.message}`
      progresso.classList.remove('hidden')
    }
  }

  function renderResultado(data) {
    segmentos.innerHTML = ''
    resultado.classList.remove('hidden')

    // data pode ter: texto, segmentos, falantes
    const segs = data.segmentos || []
    _textoCompleto = data.texto || segs.map(s => `[${s.falante || 'Falante'}] ${s.texto}`).join('\n')

    if (segs.length) {
      const cores = ['bg-blue-50 border-blue-200', 'bg-purple-50 border-purple-200',
                     'bg-green-50 border-green-200', 'bg-orange-50 border-orange-200']
      const mapaFalantes = {}
      let idx = 0

      for (const seg of segs) {
        const fal = seg.falante || 'Falante'
        if (!(fal in mapaFalantes)) mapaFalantes[fal] = cores[idx++ % cores.length]

        const card = document.createElement('div')
        card.className = `rounded-lg border p-3 ${mapaFalantes[fal]}`
        card.innerHTML = `
          <div class="text-xs font-semibold text-gray-600 mb-1">
            ${fal}
            ${seg.inicio != null ? `<span class="font-normal text-gray-400 ml-1">${fmt(seg.inicio)}</span>` : ''}
          </div>
          <p class="text-sm text-gray-800 leading-relaxed">${seg.texto}</p>
        `
        segmentos.appendChild(card)
      }
    } else {
      textoEl.textContent = _textoCompleto
      textoEl.classList.remove('hidden')
    }
  }

  function fmt(segundos) {
    const m = Math.floor(segundos / 60)
    const s = Math.floor(segundos % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  input.addEventListener('change', (e) => {
    if (e.target.files[0]) processar(e.target.files[0])
  })

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault()
    dropzone.classList.add('border-juridico-500', 'bg-juridico-50')
  })
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-juridico-500', 'bg-juridico-50')
  })
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault()
    dropzone.classList.remove('border-juridico-500', 'bg-juridico-50')
    const arquivo = e.dataTransfer.files[0]
    if (arquivo) processar(arquivo)
  })

  el.querySelector('#trans-copiar').addEventListener('click', () => {
    navigator.clipboard.writeText(_textoCompleto)
  })
  el.querySelector('#trans-baixar').addEventListener('click', () => {
    const blob = new Blob([_textoCompleto], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'transcricao.txt'
    a.click()
  })

  return el
}
