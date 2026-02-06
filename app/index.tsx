import { useSession } from '@/components/auth/ctx';
import { Redirect } from 'expo-router';

export default function Index() {
  const { session, isLoading, user } = useSession();

  // Aguarda carregar a sessão do armazenamento local
  if (isLoading) {
    return null; // or a loading spinner
  }

  // Se tem sessão mas o usuário do Firestore ainda não foi carregado, aguarda
  if (session && !user) {
    console.log('[Index] Aguardando carregamento do usuário do Firestore...');
    return null; // or a loading spinner
  }

  // Redirect to appropriate screen based on auth state
  if (session && user) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
