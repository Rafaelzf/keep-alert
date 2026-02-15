import { useIncidents } from '@/components/incidents/ctx';
import { INCIDENT_TYPES } from '@/constants/incidents';
import { getTimeAgo } from '@/lib/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FeedScreen() {
  const { incidents, isLoadingIncidents } = useIncidents();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const onRefresh = async () => {
    setRefreshing(true);
    // O contexto já está com subscrição em tempo real, apenas damos feedback visual
    setTimeout(() => setRefreshing(false), 1000);
  };

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
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
              'seconds' in incident.created_at
                ? new Date(incident.created_at.seconds * 1000)
                : new Date();
            const timeAgo = getTimeAgo(createdAt);

            return (
              <Pressable
                key={incident.id}
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
                <View className="flex flex-row items-center border-t border-neutral-100 px-4 py-3">
                  <View className="flex-1 flex flex-row items-center gap-1">
                    <Ionicons name="location-outline" size={14} color="#6b7280" />
                    <Text className="text-xs text-neutral-600" numberOfLines={1}>
                      {incident.adress || 'Localização não disponível'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}

        {/* Padding bottom para a tab bar */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}
