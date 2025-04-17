// pages/index.tsx
import { Redirect } from 'expo-router';

export default function Index() {
  // Redireciona para a tela de login quando o app é aberto
  return <Redirect href="/pages/login" />;
}
