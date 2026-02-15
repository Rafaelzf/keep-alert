import { useSession } from '@/components/auth/ctx';
import { MapLibre, type MapLibreRef } from '@/components/map/MapLibre';
import { PerimeterControl } from '@/components/perimeter';
import { ReportIncident } from '@/components/report-incident';
import { UserPerimeterRadius } from '@/types/user';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useSession();
  const [perimeter, setPerimeter] = useState<UserPerimeterRadius | null>(
    user?.perimeter_radius || null
  );
  const [isMapLoading, setIsMapLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapLibreRef>(null);

  // Sincroniza o perímetro com o usuário quando carregar
  useEffect(() => {
    if (user?.perimeter_radius && perimeter !== user.perimeter_radius) {
      setPerimeter(user.perimeter_radius);
    }
  }, [user?.perimeter_radius]);

  return (
    <View style={styles.container}>
      {/* Fundo branco no topo (status bar) */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      {/* Mapa ocupa toda a tela */}
      <MapLibre ref={mapRef} perimeter={perimeter} onLoadingChange={setIsMapLoading} />

      {/* PerimeterControl flutuando sobre o mapa */}
      <View style={[styles.perimeterContainer, { top: insets.top }]}>
        <PerimeterControl
          perimeter={perimeter}
          setPerimeter={setPerimeter}
          disabled={isMapLoading}
        />
      </View>

      <View style={[styles.perimeterContainer, { bottom: insets.bottom - 30 }]}>
        <ReportIncident
          onCenterUser={() => mapRef.current?.centerOnUser()}
          disabled={isMapLoading}
        />
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
