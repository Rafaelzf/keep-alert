import { useSession } from '@/components/auth/ctx';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

export default function HomeScreen() {
  const { signOut } = useSession();

  return (
    <View className="bg-background flex-1 items-center justify-center gap-6 p-4">
      <Text className="text-foreground text-3xl font-bold">Keep Alert</Text>
      <Text className="text-muted-foreground text-center">
        Você está autenticado! Esta é a tela principal do app.
      </Text>

      <Button onPress={signOut} variant="outline">
        <Text>Sair</Text>
      </Button>
    </View>
  );
}
