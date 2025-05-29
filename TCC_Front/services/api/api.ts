// @/services/api/api.ts - Versão corrigida com interceptor de TOKEN

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Android
const api = axios.create({
  baseURL: `http://192.168.110.225:3000/api`,
  timeout: 10000,
});

console.log('Base URL:', api.defaults.baseURL);

// 🆕 INTERCEPTOR DE REQUEST - Para incluir token automaticamente
api.interceptors.request.use(
  async (config) => {
    try {
      console.log('🔄 Interceptor de request para:', config.url);
      
      // Buscar token da chave que sabemos que funciona (baseado nos seus logs)
      const token = await AsyncStorage.getItem('@App:token');
      
      if (token) {
        // Adicionar token no header Authorization
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Token adicionado automaticamente');
        console.log('🔑 Token preview:', token.substring(0, 30) + '...');
      } else {
        console.warn('⚠️ Token não encontrado no AsyncStorage');
      }
      
      return config;
    } catch (error) {
      console.error('❌ Erro no interceptor de request:', error);
      return config; // Continuar mesmo com erro
    }
  },
  (error) => {
    console.error('❌ Erro no interceptor de request:', error);
    return Promise.reject(error);
  }
);

// ✅ INTERCEPTOR DE RESPONSE - Seu interceptor original + limpeza de token expirado
api.interceptors.response.use(
  (response) => {
    console.log('✅ Resposta bem-sucedida para:', response.config.url);
    return response;
  },
  async (error) => {
    const errorMessage = error.response?.data || { error: 'Erro na requisição' };
    console.error('❌ Erro na resposta:', errorMessage);
    console.error('📊 Status:', error.response?.status);
    console.error('🌐 URL:', error.config?.url);
    
    // 🆕 Se token expirou (401), limpar AsyncStorage
    if (error.response?.status === 401) {
      console.log('🧹 Token expirado (401), limpando AsyncStorage...');
      
      try {
        await AsyncStorage.multiRemove([
          '@App:token',
          '@App:user',
          '@App:userData', 
          '@App:userId'
        ]);
        console.log('✅ AsyncStorage limpo');
      } catch (storageError) {
        console.error('Erro ao limpar storage:', storageError);
      }
    }
    
    return Promise.reject(errorMessage);
  }
);

export default api;