import { auth, db } from '@/firebase/firebaseConfig';
import { Incident, IncidentCategory, IncidentStatus } from '@/types/incident';
import * as Location from 'expo-location';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { createContext, use, type PropsWithChildren } from 'react';
import { encode } from 'ngeohash';

interface IncidentContextType {
  reportIncident: (
    category: IncidentCategory,
    description?: string
  ) => Promise<{ success: boolean; incidentId?: string; error?: string }>;
}

const IncidentContext = createContext<IncidentContextType>({
  reportIncident: async () => ({ success: false }),
});

export function useIncidents() {
  const value = use(IncidentContext);
  if (!value) {
    throw new Error('useIncidents must be wrapped in a <IncidentProvider />');
  }
  return value;
}

export function IncidentProvider({ children }: PropsWithChildren) {
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

      const lat = location.coords.latitude;
      const long = location.coords.longitude;

      // Gera o geohash para a localização
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
    <IncidentContext.Provider value={{ reportIncident }}>{children}</IncidentContext.Provider>
  );
}
