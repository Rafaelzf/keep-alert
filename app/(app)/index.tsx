import { useSession } from '@/components/auth/ctx';
import { MapBox } from '@/components/map';
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
      <View className="h-full w-full flex-1 items-center justify-center">
        <MapBox />
      </View>
    </ScrollView>
  );
}
