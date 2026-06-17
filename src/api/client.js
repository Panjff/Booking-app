const TOKEN_KEY = "auth_token";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const baseUrl = import.meta.env.VITE_API_URL || "/api";
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const res = await fetch(`${normalizedBaseUrl}${path}`, { ...options, headers });
  
  // Lire le texte d'abord
  const text = await res.text();
  
  // Vérifier si la réponse est vide
  if (!text || text.trim() === '') {
    if (!res.ok) {
      throw new ApiError(res.statusText || 'Erreur serveur', res.status);
    }
    return {}; // Réponse vide mais OK (204 No Content)
  }

  // Essayer de parser le JSON
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error('Erreur de parsing JSON:', text);
    throw new ApiError(`Réponse invalide du serveur: ${text.substring(0, 100)}`, res.status);
  }

  if (!res.ok) {
    throw new ApiError(data.error || res.statusText, res.status);
  }
  
  return data;
}

export const api = {
  auth: {
    login: (body) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    me: () => apiFetch("/auth/me"),
  },
  slots: {
    list: () => apiFetch("/slots"),
    create: (data) => apiFetch("/slots", { method: "POST", body: JSON.stringify(data) }),
    bulkCreate: (data) => apiFetch("/slots/bulk", { method: "POST", body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/slots/${id}`, { method: "DELETE" }),
  },
  // ✅ Gestion des financements
  fundings: {
    list: () => apiFetch("/fundings"),
    create: (data) => apiFetch("/fundings", { method: "POST", body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/fundings/${id}`, { method: "DELETE" }),
    update: (id, data) => apiFetch(`/fundings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },
  payments: {
    createOrder: (data) =>
      apiFetch("/payments/create-order", { method: "POST", body: JSON.stringify(data) }),
    captureOrder: (data) =>
      apiFetch("/payments/capture-order", { method: "POST", body: JSON.stringify(data) }),
  },
  bookings: {
    demo: (data) =>
      apiFetch("/bookings/demo", { method: "POST", body: JSON.stringify(data) }),
  },
};