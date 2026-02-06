import { useSession } from '@/components/auth/ctx';
import { MapLibre } from '@/components/map/MapLibre';
import { PerimeterControl } from '@/components/perimeter';
import { UserPerimeterRadius } from '@/types/user';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function HomeScreen() {
  const { signOut, user } = useSession();
  const [perimeter, setPerimeter] = useState<UserPerimeterRadius | null>(
    user?.perimeter_radius || null
  );
  const insets = useSafeAreaInsets();

  // Sincroniza o perímetro com o usuário quando carregar
  useEffect(() => {
    if (user?.perimeter_radius && perimeter !== user.perimeter_radius) {
      setPerimeter(user.perimeter_radius);
    }
  }, [user?.perimeter_radius]);

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  }

  console.log('[HomeScreen] Perimeter:', user?.perimeter_radius);

  return (
    <View style={styles.container}>
      {/* Fundo branco no topo (status bar) */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      {/* Mapa ocupa toda a tela */}
      <MapLibre perimeter={perimeter} />

      {/* PerimeterControl flutuando sobre o mapa */}
      <View style={[styles.perimeterContainer, { top: insets.top }]}>
        <PerimeterControl perimeter={perimeter} setPerimeter={setPerimeter} />
        <Pressable
          onPress={handleSignOut}
          className="mr-5 mt-5 h-10 w-10 self-end rounded-full bg-white p-2">
          <Ionicons name="log-out-outline" size={24} color="#007AFF" />
        </Pressable>
      </View>

      <View style={[styles.perimeterContainer, { bottom: insets.bottom }]}>
        <Pressable
          onPress={handleSignOut}
          className="mr-5 mt-5 h-10 w-10 self-end rounded-full bg-white p-2">
          <Ionicons name="log-out-outline" size={24} color="#007AFF" />
        </Pressable>
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
