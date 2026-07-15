import axios from 'axios';

// Deploy paytida frontend/.env faylida VITE_API_URL o'rnatiladi,
// aks holda lokal backend ishlatiladi
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Sessiya tugatilganda faqat auth kalitlarni tozalaymiz (localStorage.clear()
// mavzu sozlamalarini ham o'chirib yuborardi) va login sahifasiga o'tamiz
const forceLogout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('auth-storage'); // zustand persist nusxasi
  if (window.location.pathname !== '/login') window.location.href = '/login';
};

// Bir vaqtda bir nechta so'rov 401 olsa, faqat BITTA refresh yuboriladi.
// Aks holda birinchi refresh tokenni almashtirib, qolganlari eski token
// bilan muvaffaqiyatsiz tugab, foydalanuvchi bekorga login sahifasiga otilardi.
let refreshPromise: Promise<string> | null = null;

const doRefresh = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    const err: any = new Error('No refresh token');
    err.forceLogout = true;
    throw err;
  }
  try {
    const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    return res.data.accessToken;
  } catch (err: any) {
    // Faqat server "token yaroqsiz" (401) desa sessiyani tugatamiz.
    // Internet uzilishi yoki server vaqtincha ishlamasligi kabi holatlarda
    // foydalanuvchini chiqarib yubormaymiz — keyingi so'rovda qayta urinamiz.
    if (err.response?.status === 401) err.forceLogout = true;
    throw err;
  }
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = typeof original?.url === 'string' && original.url.includes('/auth/');
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = doRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        const token = await refreshPromise;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (err: any) {
        if (err?.forceLogout) forceLogout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
