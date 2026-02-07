import { BottomSheet } from '@/components/ui/bottom-sheet';
import { INCIDENT_TYPES } from '@/constants/incidents';
import { Incident } from '@/types/incident';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

interface IncidentDetailsProps {
  incident: Incident | null;
  visible: boolean;
  onClose: () => void;
}

// Função para calcular tempo relativo
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'agora há pouco';
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} h`;
  const days = Math.floor(diffInSeconds / 86400);
  return `há ${days} dia${days > 1 ? 's' : ''}`;
}

export function IncidentDetails({ incident, visible, onClose }: IncidentDetailsProps) {
  const [comment, setComment] = useState('');

  if (!incident) return null;

  const incidentType = INCIDENT_TYPES.find((type) => type.id === incident.category);
  const label = incidentType?.label || 'Ocorrência';
  const icon = incidentType?.icon || 'circle-exclamation';
  const color = incidentType?.color || '#ef4444';

  // Calcula tempo desde criação
  const createdAt =
    'seconds' in incident.created_at
      ? new Date(incident.created_at.seconds * 1000)
      : new Date();
  const timeAgo = getTimeAgo(createdAt);

  // Stats
  const { police_on_way_count, ambulance_on_way_count, false_report_count } = incident.stats;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView className="pb-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-4 flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-3">
            {/* Ícone */}
            <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: `${color}20` }}>
              <FontAwesome6 name={icon as any} size={20} color={color} />
            </View>
            <Text className="text-xl font-bold text-neutral-900">{label}</Text>
          </View>

          <View className="flex flex-row items-center gap-2">
            {/* Badge Status */}
            <View className="rounded-md bg-red-500 px-3 py-1">
              <Text className="text-xs font-bold text-white">Ativo</Text>
            </View>

            {/* Botão Fechar */}
            <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center">
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>
        </View>

        {/* Info: Tempo e Autor */}
        <View className="mb-4 gap-1">
          <View className="flex flex-row items-center gap-2">
            <Ionicons name="time-outline" size={14} color="#6b7280" />
            <Text className="text-sm text-neutral-600">{timeAgo}</Text>
          </View>
          <View className="flex flex-row items-center gap-2">
            <Ionicons name="person-outline" size={14} color="#6b7280" />
            <Text className="text-sm text-neutral-600">
              Reportado por: {incident.author_id.substring(0, 8)}...
            </Text>
          </View>
        </View>

        {/* Atualizar Status */}
        <View className="mb-4">
          <Text className="mb-3 text-base font-semibold text-neutral-900">Atualizar Status</Text>
          <View className="flex flex-row flex-wrap gap-2">
            {/* Polícia a caminho */}
            <Pressable className="flex flex-row items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-900 px-3 py-2">
              <Ionicons name="car-outline" size={16} color="#fff" />
              <Text className="text-sm font-medium text-white">Polícia a caminho</Text>
              {police_on_way_count > 0 && (
                <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-white">
                  <Text className="text-xs font-bold text-neutral-900">
                    {police_on_way_count}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Bombeiro a caminho */}
            <Pressable className="flex flex-row items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2">
              <Ionicons name="flame-outline" size={16} color="#6b7280" />
              <Text className="text-sm font-medium text-neutral-700">Bombeiro a caminho</Text>
              {ambulance_on_way_count > 0 && (
                <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-neutral-900">
                  <Text className="text-xs font-bold text-white">{ambulance_on_way_count}</Text>
                </View>
              )}
            </Pressable>

            {/* Polícia no local */}
            <Pressable className="flex flex-row items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2">
              <Ionicons name="shield-checkmark-outline" size={16} color="#6b7280" />
              <Text className="text-sm font-medium text-neutral-700">Polícia no local</Text>
            </Pressable>

            {/* Bombeiro no local */}
            <Pressable className="flex flex-row items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2">
              <Ionicons name="medical-outline" size={16} color="#6b7280" />
              <Text className="text-sm font-medium text-neutral-700">Bombeiro no local</Text>
            </Pressable>

            {/* Encontrado */}
            <Pressable className="flex flex-row items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2">
              <Ionicons name="checkmark-circle-outline" size={16} color="#6b7280" />
              <Text className="text-sm font-medium text-neutral-700">Encontrado</Text>
            </Pressable>

            {/* Resolvido */}
            <Pressable className="flex flex-row items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2">
              <Ionicons name="checkmark-done-outline" size={16} color="#6b7280" />
              <Text className="text-sm font-medium text-neutral-700">Resolvido</Text>
              <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-neutral-900">
                <Text className="text-xs font-bold text-white">1</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Reportar Problema */}
        <View className="mb-4">
          <Text className="mb-3 text-base font-semibold text-neutral-900">Reportar Problema</Text>
          <Pressable className="flex flex-row items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 self-start">
            <Ionicons name="alert-circle-outline" size={16} color="#6b7280" />
            <Text className="text-sm font-medium text-neutral-700">Falsa Ocorrência</Text>
          </Pressable>
        </View>

        {/* Comentários */}
        <View className="mb-4">
          <View className="mb-3 flex flex-row items-center gap-2">
            <Text className="text-base font-semibold text-neutral-900">Comentários</Text>
            <View className="h-5 w-5 items-center justify-center rounded-full bg-neutral-200">
              <Text className="text-xs font-bold text-neutral-700">1</Text>
            </View>
          </View>

          {/* Comentário exemplo (hardcoded) */}
          <View className="mb-3 rounded-lg bg-neutral-50 p-3">
            <View className="mb-2 flex flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-neutral-900">Rafael Francucci</Text>
              <Text className="text-xs text-neutral-500">há 10 dias</Text>
            </View>
            <Text className="text-sm text-neutral-700">Biga</Text>
          </View>
        </View>

        {/* Campo de comentário */}
        <View className="flex flex-row gap-2">
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Escreva um comentário..."
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900"
            multiline
            maxLength={500}
          />
          <Pressable className="h-12 w-12 items-center justify-center rounded-lg bg-neutral-400">
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
