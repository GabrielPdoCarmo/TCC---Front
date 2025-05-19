import axios from 'axios';
//Android
const api = axios.create({
  baseURL: `http://192.168.110.225:3000/api`,
  timeout: 10000,
});
console.log('Base URL:', api.defaults.baseURL);
// //android Studio emulator
// const api = axios.create({
//   baseURL: 'http://10.0.2.2:3000/api',
//   timeout: 10000,
// });

// Adicionando interceptor de erro para todas as requisições
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data || { error: 'Erro na requisição' };
    console.error('Erro:', errorMessage);
    return Promise.reject(errorMessage);
  }
);

export default api;