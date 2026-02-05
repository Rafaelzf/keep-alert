import { useSession } from '@/components/auth/ctx';
import { MapBox } from '@/components/map';
import { Alert, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
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
  },
  container: {
    flex: 1,
  },
});
