// app/index.tsx - Solução definitiva com AuthProvider
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Componente que usa o contexto de autenticação
function IndexScreenContent() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace('/pages/PetAdoptionScreen');
      } else {
        router.replace('/pages/LoginScreen');
      }
    }
  }, [isAuthenticated, loading]);

  return (
    <View style={styles.container}>
      {/* Logo do app enquanto carrega */}
      <Image source={require('../assets/images/Icone/Pets_Up.png')} style={styles.logo} resizeMode="contain" />
      <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
    </View>
  );
}

// Componente principal que envolve com AuthProvider
export default function IndexScreen() {
  return (
    <AuthProvider>
      <IndexScreenContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4682B4',
  },
  logo: {
    width: 250,
    height: 100,
    marginBottom: 50,
  },
  loader: {
    marginTop: 20,
  },
});
