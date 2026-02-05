import { useSession } from '@/components/auth/ctx';
import { MapLibre } from '@/components/map/MapLibre';
import { PerimeterControl } from '@/components/perimeter';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { signOut, isAuthenticating, firebaseUser, user } = useSession();
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

      {/* Mapa ocupa toda a tela */}
      <MapLibre />

      {/* PerimeterControl flutuando sobre o mapa */}
      <View style={[styles.perimeterContainer, { top: insets.top }]}>
        <PerimeterControl />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    zIndex: 5,
  },
  perimeterContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
