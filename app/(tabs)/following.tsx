import { IncidentDetails } from '@/components/incident-details';
import { useIncidents } from '@/components/incidents/ctx';
import { INCIDENT_TYPES } from '@/constants/incidents';
import { getTimeAgo } from '@/lib/date';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth } from '@react-native-firebase/auth';
import { collection, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FollowingScreen() {
  const { incidents } = useIncidents();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [showIncidentDetails, setShowIncidentDetails] = useState(false);
  const [followingIncidentIds, setFollowingIncidentIds] = useState<Set<string>>(new Set());
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(true);
  const [incidentStats, setIncidentStats] = useState<
    Map<string, { commentsCount: number; imagesCount: number }>
  >(new Map());
  const insets = useSafeAreaInsets();

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Busca os IDs das ocorrências que o usuário está seguindo
  useEffect(() => {
    if (!getAuth().currentUser) {
      setIsLoadingFollowing(false);
      return;
    }

    setIsLoadingFollowing(true);
    const followingIds: string[] = [];
    const unsubscribers: (() => void)[] = [];

    const db = getFirestore();
    // Para cada incident, verifica se o usuário está seguindo
    incidents.forEach((incident) => {
      const followerRef = collection(db, 'incidents', incident.id, 'followers');
      const unsubscribe = onSnapshot(followerRef, (snapshot) => {
        const isFollowing = snapshot.docs.some((docSnap) => docSnap.id === getAuth().currentUser?.uid);

        setFollowingIncidentIds((prev) => {
          const newSet = new Set(prev);
          if (isFollowing) {
            newSet.add(incident.id);
          } else {
            newSet.delete(incident.id);
          }
          return newSet;
        });
      });

      unsubscribers.push(unsubscribe);
    });

    setIsLoadingFollowing(false);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [incidents]);

  // Filtra apenas os incidents que o usuário está seguindo
  const followingIncidents = incidents.filter((incident) => followingIncidentIds.has(incident.id));

  // Subscreve às contagens de comentários e imagens para cada incident
  useEffect(() => {
    if (!followingIncidents.length) return;

    const unsubscribers: (() => void)[] = [];

    const db = getFirestore();

    followingIncidents.forEach((incident) => {
      // Subscrição para comentários
      const commentsRef = collection(db, 'incidents', incident.id, 'comments');

      const unsubComments = onSnapshot(commentsRef, (snapshot) => {
        setIncidentStats((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(incident.id) || { commentsCount: 0, imagesCount: 0 };
          newMap.set(incident.id, { ...current, commentsCount: snapshot.size });
          return newMap;
        });
      });

      unsubscribers.push(unsubComments);

      // Subscrição para imagens
      const imagesRef = collection(db, 'incidents', incident.id, 'images');

      const unsubImages = onSnapshot(imagesRef, (snapshot) => {
        setIncidentStats((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(incident.id) || { commentsCount: 0, imagesCount: 0 };
          newMap.set(incident.id, { ...current, imagesCount: snapshot.size });
          return newMap;
        });
      });

      unsubscribers.push(unsubImages);
    });

    // Cleanup
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [followingIncidents]);

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="border-b border-neutral-200 bg-white px-4 pb-4">
        <View className="mt-4 flex flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-neutral-900">Ocorrências Seguidas</Text>
          <View className="flex flex-row items-center gap-2 rounded-full bg-purple-100 px-3 py-1">
            <Ionicons name="eye" size={16} color="#7c3aed" />
            <Text className="text-sm font-semibold text-purple-700">
              {followingIncidents.length}
            </Text>
          </View>
        </View>
        <Text className="mt-1 text-sm text-neutral-600">
          {followingIncidents.length === 0
            ? 'Você não está seguindo nenhuma ocorrência'
            : `Seguindo ${followingIncidents.length} ${followingIncidents.length === 1 ? 'ocorrência' : 'ocorrências'}`}
        </Text>
      </View>

      {/* Lista de incidents seguidos */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-3"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {isLoadingFollowing ? (
          <View className="mt-20 items-center justify-center">
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text className="mt-4 text-sm text-neutral-600">Carregando...</Text>
          </View>
        ) : followingIncidents.length === 0 ? (
          <View className="mt-20 items-center justify-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-neutral-200">
              <Ionicons name="eye-outline" size={40} color="#9ca3af" />
            </View>
            <Text className="text-center text-lg font-semibold text-neutral-600">
              Nenhuma ocorrência seguida
            </Text>
            <Text className="mt-2 px-8 text-center text-sm text-neutral-500">
              Toque no botão "Seguir" nos detalhes de uma ocorrência para acompanhar suas
              atualizações
            </Text>
          </View>
        ) : (
          followingIncidents.map((incident) => {
            const incidentType = INCIDENT_TYPES.find((type) => type.id === incident.category);
            const label = incidentType?.label || 'Ocorrência';
            const icon = incidentType?.icon || 'alert-circle';
            const color = incidentType?.color || '#ef4444';

            const createdAt =
              incident.created_at && 'seconds' in incident.created_at
                ? new Date(incident.created_at.seconds * 1000)
                : new Date();
            const timeAgo = getTimeAgo(createdAt);

            // Verifica se foi resolvida pelo autor
            const isResolved = (incident.situtation?.situation_resolved ?? 0) > 0;

            return (
              <Pressable
                key={incident.id}
                onPress={() => {
                  setSelectedIncidentId(incident.id);
                  setShowIncidentDetails(true);
                }}
                className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                {/* Header */}
                <View className="flex flex-row items-center gap-3 p-4">
                  <View
                    className="h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${color}20` }}>
                    <FontAwesome6 name={icon as any} size={20} color={color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-neutral-900">{label}</Text>
                    <Text className="text-xs text-neutral-500">{timeAgo}</Text>
                  </View>
                  <View
                    className={`rounded-lg px-2 py-1 ${
                      isResolved
                        ? 'bg-blue-600'
                        : incident.status === 'active'
                          ? 'bg-green-600'
                          : 'bg-gray-500'
                    }`}>
                    <Text className="text-xs font-bold text-white">
                      {isResolved
                        ? 'Resolvido'
                        : incident.status === 'active'
                          ? 'Ativo'
                          : 'Inativo'}
                    </Text>
                  </View>
                </View>

                {/* Descrição */}
                {incident.description && (
                  <View className="border-t border-neutral-100 px-4 py-3">
                    <Text className="text-sm text-neutral-700" numberOfLines={2}>
                      {incident.description}
                    </Text>
                  </View>
                )}

                {/* Footer */}
                <View className="flex flex-col gap-2 border-t border-neutral-100 px-4 py-3">
                  {/* Localização */}
                  <View className="flex flex-row items-center gap-1">
                    <Ionicons name="location-outline" size={14} color="#6b7280" />
                    <Text className="flex-1 text-xs text-neutral-600" numberOfLines={1}>
                      {incident.adress || 'Localização não disponível'}
                    </Text>
                  </View>

                  {/* Estatísticas: Comentários e Imagens */}
                  <View className="flex flex-row items-center gap-4">
                    {/* Comentários */}
                    <View className="flex flex-row items-center gap-1">
                      <Ionicons name="chatbubble-outline" size={14} color="#6b7280" />
                      <Text className="text-xs font-medium text-neutral-600">
                        {incidentStats.get(incident.id)?.commentsCount || 0}
                      </Text>
                    </View>

                    {/* Imagens */}
                    <View className="flex flex-row items-center gap-1">
                      <Ionicons name="image-outline" size={14} color="#6b7280" />
                      <Text className="text-xs font-medium text-neutral-600">
                        {incidentStats.get(incident.id)?.imagesCount || 0}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Modal de detalhes */}
      <IncidentDetails
        incidentId={selectedIncidentId}
        visible={showIncidentDetails}
        onClose={() => setShowIncidentDetails(false)}
      />
    </View>
  );
}
