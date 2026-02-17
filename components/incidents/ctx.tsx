import { auth, db } from '@/firebase/firebaseConfig';
import { Incident, IncidentCategory, IncidentStatus } from '@/types/incident';
import * as Location from 'expo-location';
import { onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { encode } from 'ngeohash';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

interface IncidentContextType {
  reportIncident: (
    category: IncidentCategory,
    description?: string
  ) => Promise<{ success: boolean; incidentId?: string; error?: string }>;
  updateIncidentSituation: (
    incidentId: string,
    situation: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteIncident: (incidentId: string) => Promise<{ success: boolean; error?: string }>;
  loadMoreIncidents: () => Promise<void>;
  incidents: Incident[];
  isLoadingIncidents: boolean;
  isLoadingMore: boolean;
  hasMoreIncidents: boolean;
}

const IncidentContext = createContext<IncidentContextType>({
  reportIncident: async () => ({ success: false }),
  updateIncidentSituation: async () => ({ success: false }),
  deleteIncident: async () => ({ success: false }),
  loadMoreIncidents: async () => {},
  incidents: [],
  isLoadingIncidents: false,
  isLoadingMore: false,
  hasMoreIncidents: true,
});

export function useIncidents() {
  const value = use(IncidentContext);
  if (!value) {
    throw new Error('useIncidents must be wrapped in a <IncidentProvider />');
  }
  return value;
}

const INCIDENTS_PAGE_SIZE = 15;

export function IncidentProvider({ children }: PropsWithChildren) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreIncidents, setHasMoreIncidents] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);

  // Subscreve aos incidents próximos em tempo real com paginação
  useEffect(() => {
    let unsubscribeIncidents: (() => void) | undefined;

    // Observa mudanças no estado de autenticação
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Se não houver usuário, limpa os incidents e cancela subscrição
      if (!user) {
        console.log('[IncidentProvider] Usuário não autenticado');
        setIncidents([]);
        setIsLoadingIncidents(false);
        setHasMoreIncidents(true);
        setLastDoc(null);
        if (unsubscribeIncidents) {
          unsubscribeIncidents();
          unsubscribeIncidents = undefined;
        }
        return;
      }

      // Se houver usuário, inicia subscrição aos incidents (primeira página)
      try {
        setIsLoadingIncidents(true);

        // Query do Firestore filtrando por status ACTIVE com limite
        const incidentsRef = collection(db, 'incidents');
        const q = query(
          incidentsRef,
          where('status', '==', IncidentStatus.ACTIVE),
          orderBy('created_at', 'desc'),
          limit(INCIDENTS_PAGE_SIZE)
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
                author: data.author || {
                  uid: data.author_id || 'unknown',
                  name: 'Usuário anônimo',
                },
                location: data.location,
                status: data.status,
                created_at: data.created_at,
                situtation: data.situtation,
                adress: data.adress,
              };

              fetchedIncidents.push(incident);
            });

            console.log(
              `[IncidentProvider] ${fetchedIncidents.length} incidents ativos encontrados (página inicial)`
            );

            // Verifica se há mais resultados
            setHasMoreIncidents(snapshot.docs.length === INCIDENTS_PAGE_SIZE);

            // Salva o último documento para paginação
            if (snapshot.docs.length > 0) {
              setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            }

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

  // Função para carregar mais incidents
  const loadMoreIncidents = async () => {
    if (!lastDoc || !hasMoreIncidents || isLoadingMore) {
      console.log('[loadMoreIncidents] Não há mais incidents ou já está carregando');
      return;
    }

    try {
      setIsLoadingMore(true);
      console.log('[loadMoreIncidents] Carregando mais incidents...');

      const incidentsRef = collection(db, 'incidents');
      const q = query(
        incidentsRef,
        where('status', '==', IncidentStatus.ACTIVE),
        orderBy('created_at', 'desc'),
        startAfter(lastDoc),
        limit(INCIDENTS_PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      const newIncidents: Incident[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const incident: Incident = {
          id: doc.id,
          category: data.category,
          description: data.description || '',
          author_ref: data.author_ref,
          author: data.author || {
            uid: data.author_id || 'unknown',
            name: 'Usuário anônimo',
          },
          location: data.location,
          status: data.status,
          created_at: data.created_at,
          situtation: data.situtation,
          adress: data.adress,
        };

        newIncidents.push(incident);
      });

      console.log(`[loadMoreIncidents] ${newIncidents.length} novos incidents carregados`);

      // Verifica se há mais resultados
      setHasMoreIncidents(snapshot.docs.length === INCIDENTS_PAGE_SIZE);

      // Atualiza o último documento
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }

      // Adiciona os novos incidents à lista existente
      setIncidents((prev) => [...prev, ...newIncidents]);
    } catch (error) {
      console.error('[loadMoreIncidents] Erro ao carregar mais incidents:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const updateIncidentSituation = async (
    incidentId: string,
    newSituation: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Verifica se o usuário está autenticado
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Busca a última situação escolhida pelo usuário
      const situationUpdatesRef = collection(db, 'incidents', incidentId, 'situation_updates');
      const q = query(
        situationUpdatesRef,
        where('user_id', '==', currentUser.uid),
        orderBy('created_at', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      let previousSituation: string | null = null;

      if (!querySnapshot.empty) {
        previousSituation = querySnapshot.docs[0].data().situation;
      }

      const incidentRef = doc(db, 'incidents', incidentId);

      // Se está mudando de voto
      if (previousSituation && previousSituation !== newSituation) {
        // Busca o documento atual para verificar os contadores
        const incidentDoc = await getDoc(incidentRef);
        const incidentData = incidentDoc.data();

        if (incidentData && incidentData.situtation) {
          const currentCount = incidentData.situtation[previousSituation] || 0;

          // Só decrementa se o contador atual for > 0
          if (currentCount > 0) {
            const decrementField = `situtation.${previousSituation}`;
            const incrementField = `situtation.${newSituation}`;

            await updateDoc(incidentRef, {
              [decrementField]: increment(-1),
              [incrementField]: increment(1),
            });
          } else {
            // Se o contador anterior já é 0, apenas incrementa o novo
            const incrementField = `situtation.${newSituation}`;
            await updateDoc(incidentRef, {
              [incrementField]: increment(1),
            });
          }
        }
      } else if (!previousSituation) {
        // Primeira vez que vota
        const incrementField = `situtation.${newSituation}`;
        await updateDoc(incidentRef, {
          [incrementField]: increment(1),
        });
      }

      // Busca os dados atualizados do usuário no Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : null;

      // Cria o documento de atualização de situação na subcoleção
      const situationUpdate = {
        situation: newSituation,
        user_id: currentUser.uid,
        created_at: serverTimestamp(),
        user_name: userData?.name || currentUser.displayName || currentUser.email || 'Usuário anônimo',
      };

      await addDoc(situationUpdatesRef, situationUpdate);

      // ===== FLUXO DE BANIMENTO =====
      // Se a nova situação for "false_accusation", verifica se atingiu 3 votos
      if (newSituation === 'false_accusation') {
        // Busca o incidente atualizado para pegar o contador atual
        const updatedIncidentDoc = await getDoc(incidentRef);
        const updatedIncidentData = updatedIncidentDoc.data();

        if (updatedIncidentData && updatedIncidentData.situtation.false_accusation >= 3) {
          console.log('[updateIncidentSituation] Incidente atingiu 3 votos de falsa acusação');

          // Busca o autor do incidente
          const authorRef = updatedIncidentData.author_ref;
          const authorDoc = await getDoc(authorRef);

          if (authorDoc.exists()) {
            const authorData = authorDoc.data();
            const currentStrikes = authorData.strike_count || 0;
            const newStrikes = currentStrikes + 1;

            console.log(
              `[updateIncidentSituation] Autor ${authorData.name} receberá penalização. Strikes: ${currentStrikes} → ${newStrikes}`
            );

            // Atualiza o strike_count do autor
            const updateData: any = {
              strike_count: newStrikes,
              updated_at: serverTimestamp(),
            };

            // Se atingiu 3 strikes, bane a conta
            if (newStrikes >= 3) {
              updateData.status = 'Banned';
              console.log(
                `[updateIncidentSituation] Autor ${authorData.name} foi BANIDO por atingir 3 penalizações`
              );
            }

            await updateDoc(authorRef, updateData);
          }

          // Marca o incidente como inativo
          await updateDoc(incidentRef, {
            status: 'inactive',
            updated_at: serverTimestamp(),
          });

          console.log('[updateIncidentSituation] Incidente marcado como inativo');
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('[updateIncidentSituation] Erro ao atualizar situação:', error);
      return { success: false, error: error.message || 'Erro ao atualizar situação' };
    }
  };

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

      const location = await Location.getCurrentPositionAsync();

      const originalLat = location.coords.latitude;
      const originalLong = location.coords.longitude;

      // Desloca a posição entre 150 e 200 metros de forma aleatória
      const minDistance = 50;
      const maxDistance = 100;
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

      // Busca o endereço usando a API Photon (reverse geocoding)
      let address = '';
      try {
        console.log('[reportIncident] Buscando endereço para:', { lat, long });
        const response = await fetch(`https://photon.komoot.io/reverse?lon=${long}&lat=${lat}`);
        console.log('[reportIncident] Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('[reportIncident] API Photon response:', JSON.stringify(data, null, 2));

          if (data.features && data.features.length > 0) {
            const props = data.features[0].properties;
            console.log('[reportIncident] Properties:', props);

            // Monta o endereço a partir das propriedades disponíveis
            const parts = [
              props.name,
              props.street,
              props.housenumber,
              props.city || props.county,
              props.state,
              props.country,
            ].filter(Boolean);
            address = parts.join(', ');
            console.log('[reportIncident] Endereço montado:', address);
          } else {
            console.log('[reportIncident] Nenhum resultado encontrado');
          }
        } else {
          console.error('[reportIncident] Erro na resposta da API:', response.status);
        }
      } catch (error) {
        console.error('[reportIncident] Erro ao buscar endereço:', error);
        address = '';
      }

      // Cria a referência do documento do incidente
      const incidentRef = doc(collection(db, 'incidents'));
      const incidentId = incidentRef.id;

      // Cria a referência do autor
      const authorRef = doc(db, 'users', currentUser.uid);

      // Busca os dados atualizados do usuário no Firestore
      const userDoc = await getDoc(authorRef);
      const userData = userDoc.exists() ? userDoc.data() : null;

      // Cria o objeto do incidente
      const incident: Omit<Incident, 'id'> = {
        category,
        description: description || '',
        author_ref: authorRef,
        author: {
          uid: currentUser.uid,
          name: userData?.name || currentUser.displayName || currentUser.email || 'Usuário anônimo',
          avatar: userData?.photoURL || currentUser.photoURL || undefined,
        },
        location: {
          geopoint: { lat, long },
          geohash,
        },
        adress: address,
        status: IncidentStatus.ACTIVE,
        created_at: serverTimestamp(),
        situtation: {
          police_on_way: 0,
          ambulance_on_way: 0,
          police_on_site: 0,
          ambulance_on_site: 0,
          firemen_on_way: 0,
          firemen_on_site: 0,
          situation_resolved: 0,
          false_accusation: 0,
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

  const deleteIncident = async (
    incidentId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Verifica se o usuário está autenticado
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Marca o incident como INACTIVE (deletado/desativado)
      const incidentRef = doc(db, 'incidents', incidentId);
      await updateDoc(incidentRef, {
        status: IncidentStatus.INACTIVE,
        deleted_at: serverTimestamp(),
        deleted_by: currentUser.uid,
      });

      console.log('[deleteIncident] Incident marcado como inativo:', incidentId);
      return { success: true };
    } catch (error: any) {
      console.error('[deleteIncident] Erro ao deletar incident:', error);
      return { success: false, error: error.message || 'Erro ao deletar incident' };
    }
  };

  return (
    <IncidentContext.Provider
      value={{
        reportIncident,
        updateIncidentSituation,
        deleteIncident,
        loadMoreIncidents,
        incidents,
        isLoadingIncidents,
        isLoadingMore,
        hasMoreIncidents,
      }}>
      {children}
    </IncidentContext.Provider>
  );
}
