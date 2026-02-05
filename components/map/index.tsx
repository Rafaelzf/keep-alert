import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import MapView from 'react-native-maps';

export function MapBox() {
  useEffect(() => {
    console.log('[MapBox] Componente montado');
    return () => {
      console.log('[MapBox] Componente desmontado');
    };
  }, []);

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      }}
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
