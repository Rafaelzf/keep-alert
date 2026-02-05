import { useSession } from '@/components/auth/ctx';
import { MapLibre } from '@/components/map/MapLibre';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { signOut, isAuthenticating, firebaseUser } = useSession();
  const insets = useSafeAreaInsets();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  }

  return (
    <View style={styles.container}>
      {/* Fundo branco no topo (status bar) */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <View style={styles.mapContainer}>
        <MapLibre />
      </View>

      <View style={[styles.bottomSafeArea, { height: insets.bottom }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topSafeArea: {
    backgroundColor: '#ffffff',
  },
  mapContainer: {
    flex: 1,
  },
  bottomSafeArea: {
    backgroundColor: '#000000',
  },
});
