// contexts/AuthContext.tsx - Versão otimizada
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  nome: string;
  email: string;
  foto?: string;
  telefone?: string;
  cpf?: string;
  cep?: string;
  estado_id?: number;
  cidade_id?: number;
  sexo_id?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  token: string | null;
  lastRoute: string | null;
  login: (userData: User, authToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setLastRoute: (route: string) => void;
  updateUser: (userData: User) => Promise<void>; // Nova função para atualizar usuário
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constantes para melhor organização
const STORAGE_KEYS = {
  TOKEN: '@App:userToken',
  USER_ID: '@App:userId', 
  USER_DATA: '@App:userData',
  LAST_ROUTE: '@App:lastRoute'
} as const;

const EXCLUDED_ROUTES = [
  '/',
  '/index',
  '/pages/LoginScreen',
  '/pages/userCadastro', 
  '/pages/ForgotPasswordScreen',
  '/pages/FilterScreen',
  '/pages/MypetsFilter',
] as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [lastRoute, setLastRouteState] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const [savedToken, savedUserId, savedRoute, userData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_ROUTE),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA)
      ]);

      if (savedToken && savedUserId) {
        let parsedUser: User;
        
        if (userData) {
          parsedUser = JSON.parse(userData);
        } else {
          // Fallback se não há dados do usuário
          parsedUser = { 
            id: parseInt(savedUserId), 
            nome: 'Usuário', 
            email: '' 
          };
        }

        setUser(parsedUser);
        setToken(savedToken);
        setIsAuthenticated(true);
        
        console.log('✅ Usuário autenticado:', parsedUser.nome);
      }

      setLastRouteState(savedRoute);
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      await clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData: User, authToken: string) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, authToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userData.id.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
      ]);

      setUser(userData);
      setToken(authToken);
      setIsAuthenticated(true);

      console.log('✅ Login realizado:', userData.nome);
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  };

  const updateUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      setUser(userData);
      console.log('✅ Dados do usuário atualizados:', userData.nome);
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const clearAuthData = async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_ID),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_ROUTE)
    ]);

    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setLastRouteState(null);
  };

  const logout = async () => {
    try {
      await clearAuthData();
      console.log('✅ Logout realizado');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  };

  const setLastRoute = async (route: string) => {
    try {
      if (EXCLUDED_ROUTES.includes(route as any)) {
        console.log('🚫 Rota excluída:', route);
        return;
      }

      console.log('💾 Salvando rota:', route);
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_ROUTE, route);
      setLastRouteState(route);
    } catch (error) {
      console.error('❌ Erro ao salvar rota:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        loading, 
        user,
        token,
        lastRoute, 
        login, 
        logout, 
        setLastRoute,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}