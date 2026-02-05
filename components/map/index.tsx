import React from 'react';
import MapView from 'react-native-maps';

export function MapBox() {
  return (
    <MapView
      style={{ flex: 1 }}
      className="h-full w-full flex-1"
      initialRegion={{
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      }}
    />
  );
}
