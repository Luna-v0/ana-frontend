/**
 * Cliente HTTP para a API ANA.
 * A URL base vem de VITE_API_URL (definida no build) e cai para
 * http://localhost:8000 quando não definida.
 */

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000');

export { BASE };
