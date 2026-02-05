import { useSession } from '@/components/auth/ctx';
import { MapBox } from '@/components/map';
import { Alert, View } from 'react-native';

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
    <>
      <View className="flex-1">
        <MapBox />
      </View>
    </>
  );
}
