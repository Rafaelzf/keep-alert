import { useSession } from '@/components/auth/ctx';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Alert, ScrollView, View } from 'react-native';

export default function HomeScreen() {
  const { signOut, isAuthenticating, firebaseUser } = useSession();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  }

  return (
    // ScrollView é melhor aqui para garantir que os dados não cortem em telas pequenas
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-background">
      <View className="flex-1 items-center justify-center gap-6 p-6">
        <View className="items-center">
          <Text className="text-foreground text-3xl font-bold">Keep Alert</Text>
          <Text className="text-muted-foreground mt-2 text-center">
            Você está autenticado como:
          </Text>
        </View>

        {/* Container de Dados (Fora do componente Text principal) */}
        <View className="bg-card border-border w-full space-y-3 rounded-xl border p-4">
          <Text className="text-foreground">
            <Text className="font-bold">Email:</Text> {firebaseUser?.email}
          </Text>

          <Text className="text-foreground">
            <Text className="font-bold">UID:</Text> {firebaseUser?.uid}
          </Text>

          <Text className="text-foreground">
            <Text className="font-bold">Nome:</Text> {firebaseUser?.displayName || 'N/A'}
          </Text>

          <Text className="text-foreground">
            <Text className="font-bold">Verificado:</Text>{' '}
            {firebaseUser?.emailVerified ? 'Sim' : 'Não'}
          </Text>

          <View className="border-border mt-2 border-t pt-2">
            <Text className="text-muted-foreground text-sm">
              <Text className="font-bold">Criado em:</Text> {firebaseUser?.metadata.creationTime}
            </Text>
            <Text className="text-muted-foreground text-sm">
              <Text className="font-bold">Último login:</Text>{' '}
              {firebaseUser?.metadata.lastSignInTime}
            </Text>
          </View>
        </View>

        <Button
          onPress={handleSignOut}
          variant="outline"
          disabled={isAuthenticating}
          className="w-full max-w-[200px]">
          <Text>{isAuthenticating ? 'Saindo...' : 'Sair'}</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
