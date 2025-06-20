import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="pages/LoginScreen" />
        <Stack.Screen name="pages/PetAdoptionScreen" />
        <Stack.Screen name="pages/ConfigScreen" />
        <Stack.Screen name="pages/ProfileScreen" />
        <Stack.Screen name="pages/PetDonation" />
        <Stack.Screen name="pages/MyPetsScreen" />
        <Stack.Screen name="pages/FilterScreen" />
        <Stack.Screen name="pages/PetDetailsScreen" />
        <Stack.Screen name="pages/ForgotPasswordScreen" />
        <Stack.Screen name="pages/userCadastro" />
      </Stack>
    </AuthProvider>
  );
}