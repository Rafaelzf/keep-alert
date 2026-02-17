import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { MapLoading } from './MapLoading';
import { DEFAULT_REGION, getApproximateLocation } from '@/lib/locations';
import { useSession } from '@/components/auth/ctx';

export function MapBox() {
  const [isLoading, setIsLoading] = useState(true);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const { user, updateUserLocation } = useSession();

  useEffect(() => {
    requestLocationPermission();

    return () => {
      console.log('[MapBox] Componente desmontado');
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
              console.log('[MapBox] Usuário negou permissão - usando localização aproximada');
              await useApproximateLocation();
            },
            style: 'cancel',
          },
          {
            text: 'Permitir',
            onPress: async () => {
              const { status } = await Location.requestForegroundPermissionsAsync();

              if (status === 'granted') {
                console.log('[MapBox] Permissão concedida');
                setHasLocationPermission(true);
                await getUserLocation();
              } else {
                console.log('[MapBox] Permissão negada - usando localização aproximada');
                await useApproximateLocation();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('[MapBox] Erro ao solicitar permissão:', error);
      await useApproximateLocation();
    }
  }

  async function getUserLocation() {
    try {
      console.log('[MapBox] Obtendo localização precisa do usuário...');
      setIsLoading(true);

      const location = await Location.getCurrentPositionAsync();

      const userRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      };

      console.log('[MapBox] Localização precisa obtida:', userRegion);
      setRegion(userRegion);
      setHasLocationPermission(true);

      // Salva a localização no Firestore
      await updateUserLocation(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('[MapBox] Erro ao obter localização:', error);
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
        console.log('[MapBox] Usando última localização salva do usuário');
        const lastLocationRegion: Region = {
          latitude: user.last_location.latitude,
          longitude: user.last_location.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        };
        setRegion(lastLocationRegion);
      } else {
        // Se não tiver, detecta localização aproximada via IP
        console.log('[MapBox] Detectando localização aproximada via IP');
        const approximateRegion = await getApproximateLocation();
        setRegion(approximateRegion);
        console.log('[MapBox] Usando localização aproximada:', approximateRegion);
      }
    } catch (error) {
      console.error('[MapBox] Erro ao obter localização aproximada:', error);
      setRegion(DEFAULT_REGION);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <MapLoading />;
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={region}
      showsUserLocation={hasLocationPermission}
      showsMyLocationButton={hasLocationPermission}
      onMapReady={() => console.log('[MapBox] Mapa carregado')}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
});
