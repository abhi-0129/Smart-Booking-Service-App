import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL ,
});

API.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem('sbs_user'));
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  } catch {}
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sbs_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;