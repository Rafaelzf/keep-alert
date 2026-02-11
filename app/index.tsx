import { useSession } from '@/components/auth/ctx';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { session, isLoading, user } = useSession();

  // Aguarda carregar a sessão do armazenamento local
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  // Se tem sessão mas o usuário do Firestore ainda não foi carregado, aguarda
  if (session && !user) {
    console.log('[Index] Aguardando carregamento do usuário do Firestore...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  // Redirect to appropriate screen based on auth state
  if (session && user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
