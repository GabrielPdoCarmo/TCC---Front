// components/AuthGuard.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from './AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Se não estiver carregando e não estiver autenticado, redirecionar
    if (!loading && !isAuthenticated) {
      console.log('🚫 Usuário não autenticado, redirecionando para login');
      router.replace('/pages/LoginScreen' as any);
    }
  }, [isAuthenticated, loading]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  // Se não estiver autenticado, não mostrar conteúdo (já redirecionou)
  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  // Se autenticado, mostrar o conteúdo
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4285F4',
  },
});
