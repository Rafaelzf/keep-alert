import { useSession } from '@/components/auth/ctx';
import { MapBox } from '@/components/map';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <MapBox />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 20,
  },
  container: {
    flex: 1,
  },
});
