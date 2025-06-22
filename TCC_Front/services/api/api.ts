// @/services/api/api.ts - Versão corrigida com interceptor de TOKEN

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Android
const api = axios.create({
  baseURL: `http://192.168.1.12:3000/api`,
  timeout: 10000,
});

// 🆕 INTERCEPTOR DE REQUEST - Para incluir token automaticamente
api.interceptors.request.use(
  async (config) => {
    try {
      // Buscar token da chave que sabemos que funciona (baseado nos seus logs)
      const token = await AsyncStorage.getItem('@App:token');

      if (token) {
        // Adicionar token no header Authorization
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      return config; // Continuar mesmo com erro
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ INTERCEPTOR DE RESPONSE - Seu interceptor original + limpeza de token expirado
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const errorMessage = error.response?.data || { error: 'Erro na requisição' };

    // 🆕 Se token expirou (401), limpar AsyncStorage
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.multiRemove(['@App:token', '@App:user', '@App:userData', '@App:userId']);
      } catch (storageError) {}
    }

    return Promise.reject(errorMessage);
  }
);

export default api;
