import { useSession } from '@/components/auth/ctx';
import { useIncidents } from '@/components/incidents/ctx';
import { INCIDENT_TYPES } from '@/constants/incidents';
import { DEFAULT_REGION, getApproximateLocation } from '@/lib/locations';
import { Incident } from '@/types/incident';
import { UserPerimeterRadius, UserStatus } from '@/types/user';
import {
  Camera,
  CircleLayer,
  FillLayer,
  LineLayer,
  MapView,
  ShapeSource,
  SymbolLayer,
  UserLocation,
  type CameraRef,
  type MapViewRef,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, StyleSheet } from 'react-native';
import { IncidentDetails } from '@/components/incident-details';
import { IncidentMarkerImages } from './IncidentMarkerImages';
import { MapLoading } from './MapLoading';

// Estilo OpenMapTiles (OSM Bright)
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright';

// Função para criar um círculo GeoJSON baseado em centro e raio
function createCircle(
  center: [number, number],
  radiusInMeters: number,
  points: number = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const distanceX = radiusInMeters / (111320 * Math.cos((center[1] * Math.PI) / 180));
  const distanceY = radiusInMeters / 110574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center[0] + x, center[1] + y]);
  }
  coords.push(coords[0]); // Fechar o polígono

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  };
}

// Função para obter a cor de uma categoria
function getCategoryColor(category: string): string {
  const incidentType = INCIDENT_TYPES.find((type) => type.id === category);
  return incidentType?.color || '#ef4444'; // vermelho padrão se não encontrar
}

// Função para obter a label traduzida de uma categoria
function getCategoryLabel(category: string): string {
  const incidentType = INCIDENT_TYPES.find((type) => type.id === category);
  return incidentType?.label || 'Ocorrência';
}

// Função para converter incidents em GeoJSON FeatureCollection
function incidentsToGeoJSON(incidents: Incident[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: incidents.map((incident) => ({
      type: 'Feature',
      id: incident.id,
      properties: {
        category: incident.category,
        label: getCategoryLabel(incident.category),
        description: incident.description,
        author_id: incident.author_id,
        color: getCategoryColor(incident.category),
      },
      geometry: {
        type: 'Point',
        coordinates: [incident.location.geopoint.long, incident.location.geopoint.lat],
      },
    })),
  };
}

interface MapLibreProps {
  perimeter: UserPerimeterRadius | null;
  onLoadingChange?: (isLoading: boolean) => void;
  filters?: Set<string>;
}

export interface MapLibreRef {
  centerOnUser: () => void;
  refresh: () => Promise<void>;
}

export const MapLibre = forwardRef<MapLibreRef, MapLibreProps>(function MapLibre(
  { perimeter, onLoadingChange, filters },
  ref
) {
  const [isLoading, setIsLoading] = useState(true);
  const [centerCoordinate, setCenterCoordinate] = useState<[number, number]>([
    DEFAULT_REGION.longitude,
    DEFAULT_REGION.latitude,
  ]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [showIncidentDetails, setShowIncidentDetails] = useState(false);
  const { user, updateUserLocation } = useSession();
  const { incidents } = useIncidents();
  const mapViewRef = useRef<MapViewRef>(null);
  const cameraRef = useRef<CameraRef>(null);

  // Cria o círculo do perímetro baseado na localização do usuário
  const perimeterCircle = useMemo(() => {
    if (!userLocation || !perimeter) {
      return null;
    }
    return createCircle(userLocation, perimeter);
  }, [userLocation, perimeter]);

  // Converte incidents para GeoJSON (aplicando filtros se houver)
  const incidentsGeoJSON = useMemo(() => {
    const filteredIncidents = filters
      ? incidents.filter(incident => filters.has(incident.category))
      : incidents;
    return incidentsToGeoJSON(filteredIncidents);
  }, [incidents, filters]);

  // Expõe funções para controlar o mapa
  useImperativeHandle(ref, () => ({
    centerOnUser: () => {
      if (userLocation && cameraRef.current) {
        console.log('[MapLibre] Centralizando no usuário:', userLocation);
        cameraRef.current.setCamera({
          centerCoordinate: userLocation,
          zoomLevel: 15,
          animationDuration: 1000,
        });
      } else {
        console.log('[MapLibre] Não é possível centralizar - userLocation:', userLocation);
      }
    },
    refresh: async () => {
      console.log('[MapLibre] Atualizando mapa...');
      try {
        // Atualiza a localização do usuário
        await getUserLocation();

        // Re-centraliza no usuário após atualizar a localização
        if (userLocation && cameraRef.current) {
          cameraRef.current.setCamera({
            centerCoordinate: userLocation,
            zoomLevel: 15,
            animationDuration: 1000,
          });
        }
      } catch (error) {
        console.error('[MapLibre] Erro ao atualizar mapa:', error);
        throw error;
      }
    },
  }));

  useEffect(() => {
    requestLocationPermission();

    return () => {
      console.log('[MapLibre] Componente desmontado');
    };
  }, []);

  // Notifica mudanças no estado de loading
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

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
                setHasLocationPermission(true);
                await getUserLocation();
              } else {
                await useApproximateLocation();
              }
            },
          },
        ]
      );
    } catch (error) {
      await useApproximateLocation();
    }
  }

  async function getUserLocation() {
    try {
      setIsLoading(true);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: [number, number] = [location.coords.longitude, location.coords.latitude];

      setCenterCoordinate(coords);
      setUserLocation(coords);
      setHasLocationPermission(true);

      // Salva a localização no Firestore (se usuário estiver autenticado e ativo)
      if (user && user.status === UserStatus.ACTIVE && user.terms_accepted) {
        await updateUserLocation(location.coords.latitude, location.coords.longitude);
      }
    } catch (error) {
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
        const coords: [number, number] = [
          user.last_location.longitude,
          user.last_location.latitude,
        ];
        setCenterCoordinate(coords);
        setUserLocation(coords);
      } else {
        // Se não tiver, detecta localização aproximada via IP
        console.log('[MapLibre] Detectando localização aproximada via IP');
        const approximateRegion = await getApproximateLocation();
        const coords: [number, number] = [approximateRegion.longitude, approximateRegion.latitude];
        setCenterCoordinate(coords);
        setUserLocation(coords);
      }
    } catch (error) {
      console.error('[MapLibre] Erro ao obter localização aproximada:', error);
      const defaultCoords: [number, number] = [DEFAULT_REGION.longitude, DEFAULT_REGION.latitude];
      setCenterCoordinate(defaultCoords);
      setUserLocation(defaultCoords);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <MapLoading />;
  }

  return (
    <>
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

      {/* Círculo do perímetro */}
      {perimeterCircle && (
        <ShapeSource id="perimeter-source" shape={perimeterCircle}>
          <FillLayer
            id="perimeter-fill"
            style={{
              fillColor: 'rgba(59, 130, 246, 0.15)',
              fillOpacity: 1,
            }}
          />
          <LineLayer
            id="perimeter-border"
            style={{
              lineColor: 'rgba(59, 130, 246, 0.6)',
              lineWidth: 2,
            }}
          />
        </ShapeSource>
      )}

      {/* Imagens dos markers */}
      <IncidentMarkerImages />

      {/* Markers dos incidents */}
      {incidentsGeoJSON.features.length > 0 && (
        <ShapeSource
          id="incidents-source"
          shape={incidentsGeoJSON}
          onPress={(event) => {
            const feature = event.features[0];
            if (feature) {
              const incidentId = feature.id as string;
              setSelectedIncidentId(incidentId);
              setShowIncidentDetails(true);
            }
          }}>
          <SymbolLayer
            id="incidents-symbols"
            style={{
              iconImage: ['get', 'category'],
              iconSize: 0.4,
              iconAllowOverlap: true,
              iconIgnorePlacement: true,
            }}
          />
        </ShapeSource>
      )}

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
            const coords: [number, number] = [location.coords.longitude, location.coords.latitude];
            setUserLocation(coords);
          }}
        />
      )}
      </MapView>

      {/* BottomSheet com detalhes do incident */}
      {showIncidentDetails && selectedIncidentId && (
        <IncidentDetails
          incidentId={selectedIncidentId}
          visible={showIncidentDetails}
          onClose={() => {
            setShowIncidentDetails(false);
            setSelectedIncidentId(null);
          }}
        />
      )}
    </>
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
