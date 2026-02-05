import { useSession } from '@/components/auth/ctx';
import { MapBox } from '@/components/map';
import { Alert, StyleSheet, View } from 'react-native';

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
    <View style={styles.container}>
      <MapBox />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
