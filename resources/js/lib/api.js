import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('decaparts_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (r) => r,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('decaparts_token');
            localStorage.removeItem('decaparts_user');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/app/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
