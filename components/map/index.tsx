import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { MapLoading } from './MapLoading';

const DEFAULT_REGION: Region = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.015,
  longitudeDelta: 0.0121,
};

export function MapBox() {
  const [isLoading, setIsLoading] = useState(true);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    console.log('[MapBox] Componente montado');
    requestLocationPermission();

    return () => {
      console.log('[MapBox] Componente desmontado');
    };
  }, []);

  async function requestLocationPermission() {
    try {
      console.log('[MapBox] Solicitando permissão de localização...');

      // Verifica se já tem permissão
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

      if (existingStatus === 'granted') {
        console.log('[MapBox] Permissão já concedida');
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
            onPress: () => {
              console.log('[MapBox] Usuário negou permissão');
              setIsLoading(false);
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
                console.log('[MapBox] Permissão negada pelo usuário');
                setIsLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('[MapBox] Erro ao solicitar permissão:', error);
      setIsLoading(false);
    }
  }

  async function getUserLocation() {
    try {
      console.log('[MapBox] Obtendo localização do usuário...');
      setIsLoading(true);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      };

      console.log('[MapBox] Localização obtida:', userRegion);
      setRegion(userRegion);
      setHasLocationPermission(true);
    } catch (error) {
      console.error('[MapBox] Erro ao obter localização:', error);
      Alert.alert(
        'Erro ao obter localização',
        'Não foi possível obter sua localização. Usando localização padrão.'
      );
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
