// contexts/AuthContext.tsx - Versão corrigida com limpeza de lastRoute no logout

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
  updateUser: (userData: User) => Promise<void>;
  getRedirectRoute: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ Constantes para melhor organização
const STORAGE_KEYS = {
  TOKEN: '@App:token',
  USER_ID: '@App:userId',
  USER_DATA: '@App:userData',
  LAST_ROUTE: '@App:lastRoute',
} as const;

// ✅ Rotas que NÃO devem ser salvas como última rota
const EXCLUDED_ROUTES = [
  '/',
  '/index',
  '/pages/LoginScreen',
  '/pages/userCadastro',
  '/pages/ForgotPasswordScreen',
] as const;

// ✅ Mapeamento de rotas de filtro para suas telas pai
const FILTER_ROUTE_MAPPING: { [key: string]: string } = {
  '/pages/FilterScreen': '/pages/PetAdoptionScreen',
  '/pages/MypetsFilter': '/pages/MyPetsScreen',
  // Adicione outras rotas de filtro aqui conforme necessário
};

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
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
      ]);

      if (savedToken && savedUserId) {
        let parsedUser: User;

        if (userData) {
          parsedUser = JSON.parse(userData);
        } else {
          parsedUser = {
            id: parseInt(savedUserId),
            nome: 'Usuário',
            email: '',
          };
        }

        setUser(parsedUser);
        setToken(savedToken);
        setIsAuthenticated(true);
      }

      // 🆕 CORRIGIDO: Só definir lastRoute se o usuário estiver autenticado
      if (savedToken && savedUserId && savedRoute) {
        setLastRouteState(savedRoute);
      } else {
        setLastRouteState(null);
      }
    } catch (error) {
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
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData)),
      ]);

      setUser(userData);
      setToken(authToken);
      setIsAuthenticated(true);
      
      // 🆕 IMPORTANTE: NÃO definir lastRoute no login - deixar null para ir sempre para tela principal
      setLastRouteState(null);
    } catch (error) {
      throw error;
    }
  };

  const updateUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const clearAuthData = async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_ID),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_ROUTE), // 🆕 IMPORTANTE: Limpar lastRoute no logout
    ]);

    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setLastRouteState(null); // 🆕 IMPORTANTE: Limpar estado também
  };

  const logout = async () => {
    try {
      await clearAuthData();
    } catch (error) {}
  };

  // ✅ Função setLastRoute (mantida igual)
  const setLastRoute = async (route: string) => {
    try {
      // Verificar se é uma rota excluída
      if (EXCLUDED_ROUTES.includes(route as any)) {
        return;
      }

      // Se for uma rota de filtro, salvar a rota pai
      let routeToSave = route;
      if (FILTER_ROUTE_MAPPING[route]) {
        routeToSave = FILTER_ROUTE_MAPPING[route];
      }

      await AsyncStorage.setItem(STORAGE_KEYS.LAST_ROUTE, routeToSave);
      setLastRouteState(routeToSave);
    } catch (error) {}
  };

  // 🆕 CORRIGIDA: Função getRedirectRoute sempre vai para tela principal após login
  const getRedirectRoute = (): string => {
    // Se não estiver autenticado, sempre ir para login
    if (!isAuthenticated) {
      return '/pages/LoginScreen';
    }

    // 🆕 MUDANÇA PRINCIPAL: Após login, SEMPRE ir para tela principal
    // O lastRoute só é usado quando o app é reaberto (não após login)
    // Se tiver última rota salva E não estiver em processo de login recente
    if (lastRoute && user) {
      return lastRoute;
    }

    // 🆕 Rota padrão para usuários autenticados: SEMPRE tela principal
    return '/pages/PetAdoptionScreen';
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
        updateUser,
        getRedirectRoute,
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