// contexts/AuthContext.tsx - CORRIGIDO com timing e debug
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  foto?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: Usuario | null;
  token: string | null;
  loading: boolean;
  login: (userData: Usuario, token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar autenticação na inicialização
  useEffect(() => {
    checkInitialAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<{
    isAuthenticated: boolean;
    user: Usuario | null;
    token: string | null;
  }> => {
    try {
      // Buscar token e dados do usuário
      const storedToken = await AsyncStorage.getItem('@App:token');
      const userJson = await AsyncStorage.getItem('@App:user');
      const userId = await AsyncStorage.getItem('@App:userId');

      if (!storedToken || !userJson || !userId) {
        return { isAuthenticated: false, user: null, token: null };
      }

      // Parse dos dados do usuário
      let userData: Usuario;
      try {
        userData = JSON.parse(userJson);
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse dos dados do usuário:', parseError);
        return { isAuthenticated: false, user: null, token: null };
      }

      return { isAuthenticated: true, user: userData, token: storedToken };
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      return { isAuthenticated: false, user: null, token: null };
    }
  };

  const clearAuthData = async (): Promise<void> => {
    try {
      console.log('🧹 Limpando dados de autenticação...');
      await AsyncStorage.multiRemove(['@App:token', '@App:user', '@App:userId', '@App:userPhoto']);
      console.log('✅ Dados de autenticação limpos com sucesso');
    } catch (error) {
      console.error('❌ Erro ao limpar dados de autenticação:', error);
    }
  };

  const checkInitialAuthStatus = async () => {
    try {
      setLoading(true);

      // Pequeno delay para garantir que o AsyncStorage esteja pronto
      await new Promise((resolve) => setTimeout(resolve, 100));

      const authStatus = await checkAuthStatus();

      setIsAuthenticated(authStatus.isAuthenticated);
      setUser(authStatus.user);
      setToken(authStatus.token);
    } catch (error) {
      console.error('❌ Erro ao verificar status inicial:', error);
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData: Usuario, userToken: string) => {
    try {
      console.log('🔐 INICIANDO login no contexto...');
      console.log('📥 Dados recebidos:', {
        userData: { id: userData.id, nome: userData.nome, email: userData.email },
        token: userToken ? `${userToken.substring(0, 20)}...` : null,
      });

      // 1. Primeiro salvar no AsyncStorage
      console.log('💾 Salvando dados no AsyncStorage...');
      await AsyncStorage.multiSet([
        ['@App:token', userToken],
        ['@App:user', JSON.stringify(userData)],
        ['@App:userId', userData.id.toString()],
      ]);
      console.log('✅ Dados salvos no AsyncStorage');

      // 2. Verificar se foi salvo corretamente
      console.log('🔍 Verificando se dados foram salvos...');
      const savedToken = await AsyncStorage.getItem('@App:token');
      const savedUser = await AsyncStorage.getItem('@App:user');
      const savedUserId = await AsyncStorage.getItem('@App:userId');

      console.log('📱 Verificação pós-salvamento:', {
        tokenSalvo: !!savedToken,
        userSalvo: !!savedUser,
        userIdSalvo: !!savedUserId,
      });

      // 3. Aguardar um pouco para garantir persistência
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 4. Atualizar o estado do contexto
      console.log('🔄 Atualizando estado do contexto...');
      setIsAuthenticated(true);
      setUser(userData);
      setToken(userToken);

      console.log('✅ Login no contexto CONCLUÍDO com sucesso');
      console.log('📊 Estado final:', {
        isAuthenticated: true,
        user: userData.nome,
        hasToken: !!userToken,
      });
    } catch (error) {
      console.error('❌ Erro durante login no contexto:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('👋 Fazendo logout...');

      // Limpar dados locais
      await clearAuthData();
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ Erro durante logout:', error);
      // Mesmo com erro, tentar limpar os dados
      await clearAuthData();
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    }
  };

  const refreshAuthStatus = async () => {
    console.log('🔄 Atualizando status de autenticação...');
    setLoading(true);

    try {
      const authStatus = await checkAuthStatus();
      console.log('📊 Novo status:', authStatus);

      setIsAuthenticated(authStatus.isAuthenticated);
      setUser(authStatus.user);
      setToken(authStatus.token);
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    isAuthenticated,
    user,
    token,
    loading,
    login,
    logout,
    refreshAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    console.error('❌ useAuth chamado fora do AuthProvider!');
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};
