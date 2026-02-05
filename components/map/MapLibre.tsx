import { useSession } from '@/components/auth/ctx';
import { DEFAULT_REGION, getApproximateLocation } from '@/lib/locations';
import {
  Camera,
  MapView,
  UserLocation,
  type CameraRef,
  type MapViewRef,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { MapLoading } from './MapLoading';

// Estilo OpenMapTiles (OSM Bright)
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright';

export function MapLibre() {
  const [isLoading, setIsLoading] = useState(true);
  const [centerCoordinate, setCenterCoordinate] = useState<[number, number]>([
    DEFAULT_REGION.longitude,
    DEFAULT_REGION.latitude,
  ]);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const { user, updateUserLocation } = useSession();
  const mapViewRef = useRef<MapViewRef>(null);
  const cameraRef = useRef<CameraRef>(null);

  useEffect(() => {
    requestLocationPermission();

    return () => {
      console.log('[MapLibre] Componente desmontado');
    };
  }, []);

  async function requestLocationPermission() {
    try {
      // Verifica se já tem permissão
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

      if (existingStatus === 'granted') {
        await getUserLocation();
        return;
      }

      // Pede permissão ao usuário
      Alert.alert(
        'Permitir acesso à localização',
        'Keep Alert precisa acessar sua localização para mostrar alertas próximos a você.',
        [
          {
            text: 'Não permitir',
            onPress: async () => {
              console.log('[MapLibre] Usuário negou permissão - usando localização aproximada');
              await useApproximateLocation();
            },
            style: 'cancel',
          },
          {
            text: 'Permitir',
            onPress: async () => {
              const { status } = await Location.requestForegroundPermissionsAsync();

              if (status === 'granted') {
                console.log('[MapLibre] Permissão concedida');
                setHasLocationPermission(true);
                await getUserLocation();
              } else {
                console.log('[MapLibre] Permissão negada - usando localização aproximada');
                await useApproximateLocation();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('[MapLibre] Erro ao solicitar permissão:', error);
      await useApproximateLocation();
    }
  }

  async function getUserLocation() {
    try {
      console.log('[MapLibre] Obtendo localização precisa do usuário...');
      setIsLoading(true);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: [number, number] = [location.coords.longitude, location.coords.latitude];

      console.log('[MapLibre] Localização precisa obtida:', coords);
      setCenterCoordinate(coords);
      setHasLocationPermission(true);

      // Salva a localização no Firestore (se usuário estiver autenticado)
      if (user) {
        await updateUserLocation(location.coords.latitude, location.coords.longitude);
      } else {
        console.log('[MapLibre] Usuário não autenticado ainda, pulando salvamento de localização');
      }
    } catch (error) {
      console.error('[MapLibre] Erro ao obter localização:', error);
      Alert.alert(
        'Erro ao obter localização',
        'Não foi possível obter sua localização precisa. Usando localização aproximada.'
      );
      await useApproximateLocation();
    } finally {
      setIsLoading(false);
    }
  }

  async function useApproximateLocation() {
    try {
      setIsLoading(true);

      // Primeiro, verifica se o usuário tem última localização salva
      if (user?.last_location) {
        console.log('[MapLibre] Usando última localização salva do usuário');
        const coords: [number, number] = [
          user.last_location.longitude,
          user.last_location.latitude,
        ];
        setCenterCoordinate(coords);
      } else {
        // Se não tiver, detecta localização aproximada via IP
        console.log('[MapLibre] Detectando localização aproximada via IP');
        const approximateRegion = await getApproximateLocation();
        const coords: [number, number] = [approximateRegion.longitude, approximateRegion.latitude];
        setCenterCoordinate(coords);
        console.log('[MapLibre] Usando localização aproximada:', coords);
      }
    } catch (error) {
      console.error('[MapLibre] Erro ao obter localização aproximada:', error);
      setCenterCoordinate([DEFAULT_REGION.longitude, DEFAULT_REGION.latitude]);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <MapLoading />;
  }

  return (
    <MapView
      ref={mapViewRef}
      style={styles.map}
      mapStyle={MAP_STYLE}
      scrollEnabled={true}
      zoomEnabled={true}
      rotateEnabled={true}
      pitchEnabled={false}>
      {/* Câmera inicial */}
      <Camera
        ref={cameraRef}
        centerCoordinate={centerCoordinate}
        zoomLevel={14}
        animationDuration={1000}
        animationMode="flyTo"
        followUserLocation={hasLocationPermission}
      />

      {/* Localização do usuário */}
      {hasLocationPermission && (
        <UserLocation
          visible={true}
          animated={true}
          androidRenderMode="compass"
          showsUserHeadingIndicator={true}
          minDisplacement={10}
          onUpdate={(location) => {
            console.log('[MapLibre] Localização atualizada:', location.coords);
          }}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
