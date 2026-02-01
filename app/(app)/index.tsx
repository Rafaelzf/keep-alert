import { useSession } from '@/components/auth/ctx';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Alert, View } from 'react-native';

export default function HomeScreen() {
  const { signOut, isAuthenticating } = useSession();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  }

  return (
    <View className="bg-background flex-1 items-center justify-center gap-6 p-4">
      <Text className="text-foreground text-3xl font-bold">Keep Alert</Text>
      <Text className="text-muted-foreground text-center">
        Você está autenticado! Esta é a tela principal do app.
      </Text>

      <Button onPress={handleSignOut} variant="outline" disabled={isAuthenticating}>
        <Text>{isAuthenticating ? 'Saindo...' : 'Sair'}</Text>
      </Button>
    </View>
  );
}
