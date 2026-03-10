/**
 * Cliente HTTP para a API ANA.
 * Em dev, o proxy do Vite redireciona /api/* → backend:8000/*.
 * Em produção, VITE_API_URL aponta para o backend.
 */

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}`
  : '/api'

async function request(path, options = {}) {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const erro = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(erro.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── RAG ──────────────────────────────────────────────────────────────────────

export const rag = {
  status: () => request('/rag/status'),

  buscar: (query, { topK = 10, validar = false, filtros = {} } = {}) =>
    request('/rag/buscar', {
      method: 'POST',
      body: JSON.stringify({ query, top_k: topK, validar, filtros }),
    }),

  resumir: async (query, chunks) => {
    const res = await fetch(`${BASE}/rag/resumir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, chunks }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res // streaming — o caller consome res.body
  },
}

// ── Sessões ───────────────────────────────────────────────────────────────────

export const sessoes = {
  listar: () => request('/sessoes/'),

  criar: (dados) =>
    request('/sessoes/', { method: 'POST', body: JSON.stringify(dados) }),

  obter: (id) => request(`/sessoes/${id}`),

  atualizar: (id, campos) =>
    request(`/sessoes/${id}`, { method: 'PATCH', body: JSON.stringify(campos) }),

  deletar: (id) =>
    request(`/sessoes/${id}`, { method: 'DELETE' }).catch(() => {}),

  listarDocumentos: (id) => request(`/sessoes/${id}/documentos`),

  uploadDocumento: (id, arquivo) => {
    const fd = new FormData()
    fd.append('arquivo', arquivo)
    return fetch(`${BASE}/sessoes/${id}/documentos`, { method: 'POST', body: fd })
      .then(r => r.json())
  },

  removerDocumento: (sessaoId, docId) =>
    request(`/sessoes/${sessaoId}/documentos/${docId}`, { method: 'DELETE' }),

  buscar: (id, query, modo = 'intra', topK = 10) =>
    request(`/sessoes/${id}/buscar`, {
      method: 'POST',
      body: JSON.stringify({ query, modo, top_k: topK }),
    }),
}

// ── Transcrição ───────────────────────────────────────────────────────────────

export const transcricao = {
  transcrever: (formData) =>
    fetch(`${BASE}/transcricao/transcrever`, { method: 'POST', body: formData })
      .then(r => r.json()),
}

// ── Health ────────────────────────────────────────────────────────────────────

export const health = {
  check: () => request('/health/'),
}
