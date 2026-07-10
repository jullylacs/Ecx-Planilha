import axios from "axios";

const apiBasePath = import.meta.env.VITE_API_BASE_PATH || "/api/v1";
const normalizedBasePath = String(apiBasePath).startsWith("/") ? apiBasePath : `/${apiBasePath}`;
const explicitBaseUrl = import.meta.env.VITE_API_URL;
// Por padrão usa um caminho relativo: o dev server do Vite faz proxy de
// /api para o backend, então funciona tanto em localhost quanto quando
// a página é acessada pelo IP da máquina na rede — sem depender de host fixo.
const apiBaseUrl = explicitBaseUrl
  ? String(explicitBaseUrl).replace(/\/$/, "")
  : normalizedBasePath;

// Instância do Axios com baseURL apontando para o backend
// withCredentials: o token de sessão vai num cookie httpOnly (não em localStorage), então o
// navegador precisa ser instruído a enviar/aceitar esse cookie em toda requisição.
const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Em caso de sessão inválida/expirada, força novo login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
