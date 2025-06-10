// app/index.tsx - Solução com redirecionamento inteligente e tipagem correta
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

// ✅ Definir rotas válidas do app
type ValidRoutes =
  | '/pages/LoginScreen'
  | '/pages/PetAdoptionScreen'
  | '/pages/MyPetsScreen'
  | '/pages/ConfigScreen'
  | '/pages/ProfileScreen'
  | '/pages/PetDonation';

// ✅ Função helper para validar e redirecionar
const safeRedirect = (route: string) => {
  // Mapear rotas conhecidas para tipos válidos
  const routeMap: { [key: string]: ValidRoutes } = {
    '/pages/LoginScreen': '/pages/LoginScreen',
    '/pages/PetAdoptionScreen': '/pages/PetAdoptionScreen',
    '/pages/MyPetsScreen': '/pages/MyPetsScreen',
    '/pages/ConfigScreen': '/pages/ConfigScreen',
    '/pages/ProfileScreen': '/pages/ProfileScreen',
    '/pages/PetDonation': '/pages/PetDonation',
  };

  // Se a rota existir no mapa, usar ela; senão, usar rota padrão
  const validRoute = routeMap[route] || '/pages/PetAdoptionScreen';

  router.replace(validRoute);
};

export default function IndexScreen() {
  const { loading, getRedirectRoute } = useAuth();

  useEffect(() => {
    if (!loading) {
      // ✅ Usar a nova função para obter a rota correta
      const redirectRoute = getRedirectRoute();

      // ✅ Pequeno delay para evitar problemas de navegação
      setTimeout(() => {
        safeRedirect(redirectRoute);
      }, 100);
    }
  }, [loading, getRedirectRoute]);

  return (
    <View style={styles.container}>
      {/* Logo do app enquanto carrega */}
      <Image source={require('../assets/images/Icone/Petz_Up.png')} style={styles.logo} resizeMode="contain" />
      <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
    </View>
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
