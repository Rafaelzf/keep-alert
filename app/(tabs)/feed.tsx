import { IncidentDetails } from '@/components/incident-details';
import { useIncidents } from '@/components/incidents/ctx';
import { INCIDENT_TYPES } from '@/constants/incidents';
import { getTimeAgo } from '@/lib/date';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { collection, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FeedScreen() {
  const { incidents, isLoadingIncidents, loadMoreIncidents, isLoadingMore, hasMoreIncidents } =
    useIncidents();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [showIncidentDetails, setShowIncidentDetails] = useState(false);
  const [incidentStats, setIncidentStats] = useState<
    Map<string, { commentsCount: number; imagesCount: number }>
  >(new Map());
  const insets = useSafeAreaInsets();

  const onRefresh = async () => {
    setRefreshing(true);
    // O contexto já está com subscrição em tempo real, apenas damos feedback visual
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Detecta quando o usuário chegou ao final da lista
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

    // Verifica se está próximo do final (100px do final)
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;

    if (isCloseToBottom && hasMoreIncidents && !isLoadingMore && !isLoadingIncidents) {
      console.log('[Feed] Chegou ao final, carregando mais...');
      loadMoreIncidents();
    }
  };

  // Subscreve às contagens de comentários e imagens para cada incident
  useEffect(() => {
    if (!incidents.length) return;

    const unsubscribers: (() => void)[] = [];

    const db = getFirestore();
    incidents.forEach((incident) => {
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
  }, [incidents]);

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="border-b border-neutral-200 bg-white px-4 pb-4">
        <View className="mt-4 flex flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-neutral-900">Feed de Alertas</Text>
          <View className="flex flex-row items-center gap-2 rounded-full bg-purple-100 px-3 py-1">
            <Ionicons name="pulse" size={16} color="#7c3aed" />
            <Text className="text-sm font-semibold text-purple-700">Ao Vivo</Text>
          </View>
        </View>
        <Text className="mt-1 text-sm text-neutral-600">
          {incidents.length} {incidents.length === 1 ? 'ocorrência ativa' : 'ocorrências ativas'}
        </Text>
      </View>

      {/* Lista de incidents */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-3"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScroll={handleScroll}
        scrollEventThrottle={400}>
        {incidents.length === 0 ? (
          <View className="mt-20 items-center justify-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-neutral-200">
              <Ionicons name="newspaper-outline" size={40} color="#9ca3af" />
            </View>
            <Text className="text-center text-lg font-semibold text-neutral-600">
              Nenhum alerta ativo
            </Text>
            <Text className="mt-2 text-center text-sm text-neutral-500">
              Quando houver novas ocorrências, elas aparecerão aqui
            </Text>
          </View>
        ) : (
          incidents.map((incident) => {
            const incidentType = INCIDENT_TYPES.find((type) => type.id === incident.category);
            const label = incidentType?.label || 'Ocorrência';
            const icon = incidentType?.icon || 'alert-circle';
            const color = incidentType?.color || '#ef4444';

            const createdAt =
              incident.created_at && 'seconds' in incident.created_at
                ? new Date(incident.created_at.seconds * 1000)
                : new Date();
            const timeAgo = getTimeAgo(createdAt);

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
                  <View className="rounded-lg bg-green-600 px-2 py-1">
                    <Text className="text-xs font-bold text-white">Ativo</Text>
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

        {/* Indicador de carregamento de mais incidents */}
        {isLoadingMore && (
          <View className="items-center justify-center py-6">
            <ActivityIndicator size="large" color="#ef4444" />
            <Text className="mt-2 text-sm text-neutral-600">Carregando mais alertas...</Text>
          </View>
        )}

        {/* Mensagem quando não há mais incidents */}
        {!hasMoreIncidents && incidents.length > 0 && (
          <View className="items-center justify-center py-6">
            <Ionicons name="checkmark-circle-outline" size={32} color="#10b981" />
            <Text className="mt-2 text-sm font-medium text-neutral-600">
              Todos os alertas foram carregados
            </Text>
          </View>
        )}

        {/* Padding bottom para a tab bar */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>

      {/* BottomSheet com detalhes do incident */}
      <IncidentDetails
        incidentId={selectedIncidentId}
        visible={showIncidentDetails}
        onClose={() => setShowIncidentDetails(false)}
      />
    </View>
  );
}
