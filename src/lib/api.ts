import axios from 'axios';

// Caminho relativo. O Vercel (e o proxy do Vite) saberão como lidar com /api/
const api = axios.create({
  baseURL: '/api',
});

export default api;