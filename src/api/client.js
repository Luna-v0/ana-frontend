/**
 * Cliente HTTP para a API ANA.
 * A URL base usa window.ANA_BACKEND_URL (compatível com old_index.html)
 * ou cai para '' (mesmo origin — proxy do Vite em dev redireciona /api/* → backend).
 * Em produção, VITE_API_URL pode sobrescrever.
 */

const BASE = (import.meta.env.VITE_API_URL || window.ANA_BACKEND_URL || 'http://localhost:8000');

export { BASE };
