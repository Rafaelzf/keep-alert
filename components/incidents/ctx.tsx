import { auth, db } from '@/firebase/firebaseConfig';
import { Incident, IncidentCategory, IncidentStatus } from '@/types/incident';
import * as Location from 'expo-location';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';
import { encode, decode, neighbors } from 'ngeohash';

interface IncidentContextType {
  reportIncident: (
    category: IncidentCategory,
    description?: string
  ) => Promise<{ success: boolean; incidentId?: string; error?: string }>;
  incidents: Incident[];
  isLoadingIncidents: boolean;
}

const IncidentContext = createContext<IncidentContextType>({
  reportIncident: async () => ({ success: false }),
  incidents: [],
  isLoadingIncidents: false,
});

export function useIncidents() {
  const value = use(IncidentContext);
  if (!value) {
    throw new Error('useIncidents must be wrapped in a <IncidentProvider />');
  }
  return value;
}

export function IncidentProvider({ children }: PropsWithChildren) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false);

  // Subscreve aos incidents próximos em tempo real
  useEffect(() => {
    let unsubscribeIncidents: (() => void) | undefined;

    // Observa mudanças no estado de autenticação
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Se não houver usuário, limpa os incidents e cancela subscrição
      if (!user) {
        console.log('[IncidentProvider] Usuário não autenticado');
        setIncidents([]);
        setIsLoadingIncidents(false);
        if (unsubscribeIncidents) {
          unsubscribeIncidents();
          unsubscribeIncidents = undefined;
        }
        return;
      }

      // Se houver usuário, inicia subscrição aos incidents
      try {
        setIsLoadingIncidents(true);

        // Obtém a localização atual do usuário
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('[IncidentProvider] Permissão de localização não concedida');
          setIsLoadingIncidents(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const userLat = location.coords.latitude;
        const userLong = location.coords.longitude;

        // Gera geohash da posição do usuário (precisão 6 = ~1.2km)
        const centerGeohash = encode(userLat, userLong, 6);

        // Obtém geohashes vizinhos para cobrir área maior
        const geohashes = [centerGeohash, ...neighbors(centerGeohash)];

        console.log('[IncidentProvider] Buscando incidents próximos a:', centerGeohash);

        // Query do Firestore filtrando por status ACTIVE
        const incidentsRef = collection(db, 'incidents');
        const q = query(
          incidentsRef,
          where('status', '==', IncidentStatus.ACTIVE),
          orderBy('created_at', 'desc')
        );

        // Subscreve às mudanças em tempo real
        unsubscribeIncidents = onSnapshot(
          q,
          (snapshot) => {
            const fetchedIncidents: Incident[] = [];

            snapshot.forEach((doc) => {
              const data = doc.data();
              const incident: Incident = {
                id: doc.id,
                category: data.category,
                description: data.description || '',
                author_ref: data.author_ref,
                author_id: data.author_id,
                location: data.location,
                status: data.status,
                created_at: data.created_at,
                stats: data.stats,
              };

              // Filtra por proximidade usando geohash
              const incidentGeohash = incident.location.geohash.substring(0, 6);
              if (geohashes.includes(incidentGeohash)) {
                fetchedIncidents.push(incident);
              }
            });

            console.log(
              `[IncidentProvider] ${fetchedIncidents.length} incidents ativos encontrados`
            );
            setIncidents(fetchedIncidents);
            setIsLoadingIncidents(false);
          },
          (error) => {
            console.error('[IncidentProvider] Erro ao buscar incidents:', error);
            setIsLoadingIncidents(false);
          }
        );
      } catch (error) {
        console.error('[IncidentProvider] Erro ao iniciar subscrição:', error);
        setIsLoadingIncidents(false);
      }
    });

    // Cleanup: cancela ambas as subscrições quando o componente desmonta
    return () => {
      unsubscribeAuth();
      if (unsubscribeIncidents) {
        unsubscribeIncidents();
      }
    };
  }, []);

  const reportIncident = async (
    category: IncidentCategory,
    description?: string
  ): Promise<{ success: boolean; incidentId?: string; error?: string }> => {
    try {
      // Verifica se o usuário está autenticado
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Obtém a localização atual do usuário
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { success: false, error: 'Permissão de localização não concedida' };
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const originalLat = location.coords.latitude;
      const originalLong = location.coords.longitude;

      // Desloca a posição entre 150 e 200 metros de forma aleatória
      const minDistance = 150;
      const maxDistance = 200;
      const offsetMeters = minDistance + Math.random() * (maxDistance - minDistance);
      const randomAngle = Math.random() * 2 * Math.PI; // Ângulo aleatório em radianos (0 a 360°)

      // Converte metros para graus
      // 1 grau de latitude ≈ 111,000 metros (constante)
      const metersPerDegreeLat = 111000;
      // 1 grau de longitude varia com a latitude
      const metersPerDegreeLong = 111320 * Math.cos((originalLat * Math.PI) / 180);

      // Calcula deslocamento em graus (sem aplicar direção ainda)
      const offsetDegreesLat = offsetMeters / metersPerDegreeLat;
      const offsetDegreesLong = offsetMeters / metersPerDegreeLong;

      // Aplica a direção usando sin/cos
      // sin(ângulo) = componente Norte-Sul (latitude)
      // cos(ângulo) = componente Leste-Oeste (longitude)
      const latOffset = offsetDegreesLat * Math.sin(randomAngle);
      const longOffset = offsetDegreesLong * Math.cos(randomAngle);

      // Aplica o deslocamento
      const lat = originalLat + latOffset;
      const long = originalLong + longOffset;

      const angleInDegrees = (randomAngle * 180) / Math.PI;
      console.log(
        `[reportIncident] Deslocamento: ${offsetMeters}m a ${angleInDegrees.toFixed(0)}° | Offset: lat=${latOffset.toFixed(6)}, long=${longOffset.toFixed(6)}`
      );

      // Gera o geohash para a localização deslocada
      const geohash = encode(lat, long, 9);

      // Cria a referência do documento do incidente
      const incidentRef = doc(collection(db, 'incidents'));
      const incidentId = incidentRef.id;

      // Cria a referência do autor
      const authorRef = doc(db, 'users', currentUser.uid);

      // Cria o objeto do incidente
      const incident: Omit<Incident, 'id'> = {
        category,
        description: description || '',
        author_ref: authorRef,
        author_id: currentUser.uid,
        location: {
          geopoint: { lat, long },
          geohash,
        },
        status: IncidentStatus.ACTIVE,
        created_at: serverTimestamp(),
        stats: {
          police_on_way_count: 0,
          ambulance_on_way_count: 0,
          false_report_count: 0,
        },
      };

      // Salva o incidente no Firestore
      await setDoc(incidentRef, incident);

      console.log('[reportIncident] Incidente reportado com sucesso:', incidentId);
      return { success: true, incidentId };
    } catch (error: any) {
      console.error('[reportIncident] Erro ao reportar incidente:', error);
      return { success: false, error: error.message || 'Erro ao reportar incidente' };
    }
  };

  return (
    <IncidentContext.Provider value={{ reportIncident, incidents, isLoadingIncidents }}>
      {children}
    </IncidentContext.Provider>
  );
}
