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

  const res = await fetch(`/api${path}`, { ...options, headers });
  
  // ✅ CORRECTION : Lire le texte d'abord
  const text = await res.text();
  
  // ✅ Vérifier si la réponse est vide
  if (!text || text.trim() === '') {
    if (!res.ok) {
      throw new ApiError(res.statusText || 'Erreur serveur', res.status);
    }
    return {}; // Réponse vide mais OK (204 No Content)
  }

  // ✅ Essayer de parser le JSON
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
    register: (body) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    me: () => apiFetch("/auth/me"),
    forgotPassword: (email) =>
      apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
    resetPassword: (body) =>
      apiFetch("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
  },
  slots: {
    list: () => apiFetch("/slots"),
    create: (data) => apiFetch("/slots", { method: "POST", body: JSON.stringify(data) }),
    bulkCreate: (data) => apiFetch("/slots/bulk", { method: "POST", body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/slots/${id}`, { method: "DELETE" }),
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