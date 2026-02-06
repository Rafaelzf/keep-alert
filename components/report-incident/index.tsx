import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';

interface ReportIncidentProps {
  onCenterUser: () => void;
}

const INCIDENT_TYPES = [
  { id: 'theft', label: 'Furto', icon: 'person-running', color: '#a855f7' },
  { id: 'robbery', label: 'Assalto', icon: 'gun', color: '#ef4444' },
  { id: 'robbery-attempt', label: 'Tentativa de Roubo', icon: 'people-robbery', color: '#f59e0b' },
  { id: 'harassment', label: 'Assédio', icon: 'heart-crack', color: '#a855f7' },
  { id: 'fight', label: 'Briga', icon: 'hand-fist', color: '#fb923c' },
  { id: 'fire', label: 'Incêndio', icon: 'fire-flame-curved', color: '#f97316' },
  { id: 'flooding', label: 'Alagamento', icon: 'person-drowning', color: '#06b6d4' },
  { id: 'loud-noise', label: 'Som Alto', icon: 'volume-high', color: '#8b5cf6' },
  { id: 'lost-animal', label: 'Animal Perdido', icon: 'paw', color: '#eab308' },
  { id: 'find-animal', label: 'Animal Encontrado', icon: 'shield-dog', color: '#22c55e' },
  { id: 'lost-person', label: 'Pessoa Desaparecida', icon: 'person-circle-question', color: '#f97316' },
  { id: 'find-person', label: 'Pessoa Encontrada', icon: 'person-circle-check', color: '#10b981' },
  { id: 'animal-abuse', label: 'Maltrato Animal', icon: 'heart-crack', color: '#dc2626' },
  { id: 'kidnapping', label: 'Sequestro', icon: 'user-injured', color: '#991b1b' },
  { id: 'lost-child', label: 'Criança Perdida', icon: 'child', color: '#f97316' },
];

const ITEMS_PER_PAGE = 9;
const { width } = Dimensions.get('window');

export function ReportIncident({ onCenterUser }: ReportIncidentProps) {
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Divide os tipos em páginas de 9 itens
  const pages = [];
  for (let i = 0; i < INCIDENT_TYPES.length; i += ITEMS_PER_PAGE) {
    pages.push(INCIDENT_TYPES.slice(i, i + ITEMS_PER_PAGE));
  }

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const page = Math.round(scrollPosition / (width - 40));
    setCurrentPage(page);
  };

  const handleClose = () => {
    setShowReportSheet(false);
    setSelectedType(null);
    setCurrentPage(0);
  };

  return (
    <>
      <View className="mx-5 mb-5 flex flex-row justify-between gap-3">
        <Pressable
          onPress={onCenterUser}
          className="flex items-center justify-center rounded-lg bg-white p-3 shadow-md">
          <AntDesign name="aim" size={20} color="#78716c" />
        </Pressable>
        <Pressable
          onPress={() => setShowReportSheet(true)}
          className="flex flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-[#b91c1c] py-3 text-white shadow-md">
          <AntDesign name="alert" size={24} color="#fff" />
          <Text className="font-bold text-white">Reportar incidente</Text>
        </Pressable>
        <Pressable className="flex items-center justify-center rounded-lg bg-white p-3 shadow-md">
          <Ionicons name="sync-outline" size={20} color="#78716c" />
        </Pressable>
      </View>

      {/* Bottom Sheet de Reportar Ocorrência */}
      <BottomSheet visible={showReportSheet} onClose={handleClose}>
        <View className="gap-4 pb-10 pt-4">
          {/* Header */}
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center gap-2">
              <AntDesign name="warning" size={24} color="#ef4444" />
              <Text className="text-xl font-bold text-neutral-900">Reportar Ocorrência</Text>
            </View>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color="#78716c" />
            </Pressable>
          </View>

          {/* Info Message */}
          <View className="flex flex-row items-center gap-2 rounded-lg bg-blue-50 p-3">
            <Ionicons name="location" size={16} color="#3b82f6" />
            <Text className="flex-1 text-sm text-blue-700">
              Evento será registrado na sua localização atual
            </Text>
          </View>

          {/* Tipo de Ocorrência */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-neutral-900">
              Tipo de Ocorrência <Text className="text-red-500">*</Text>
            </Text>

            {/* Carrossel de tipos */}
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}>
              {pages.map((pageItems, pageIndex) => (
                <View
                  key={pageIndex}
                  style={{ width: width - 40 }}
                  className="flex flex-row flex-wrap gap-3">
                  {pageItems.map((type) => (
                    <Pressable
                      key={type.id}
                      onPress={() => setSelectedType(type.id)}
                      className={`w-[30%] items-center gap-2 rounded-xl border-2 p-3 ${
                        selectedType === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-neutral-200 bg-white'
                      }`}>
                      <View
                        className="h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${type.color}20` }}>
                        <FontAwesome6 name={type.icon as any} size={20} color={type.color} />
                      </View>
                      <Text className="text-center text-xs font-medium text-neutral-700">
                        {type.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>

            {/* Indicadores de página */}
            {pages.length > 1 && (
              <View className="mt-2 flex flex-row items-center justify-center gap-2">
                {pages.map((_, index) => (
                  <View
                    key={index}
                    className={`h-2 rounded-full ${
                      currentPage === index ? 'w-6 bg-blue-500' : 'w-2 bg-neutral-300'
                    }`}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Botão Reportar */}
          <Button
            className="mt-2 w-full bg-red-600"
            disabled={!selectedType}
            onPress={() => {
              // TODO: Implementar lógica de reportar
              console.log('Reportando:', selectedType);
              handleClose();
            }}>
            <View className="flex flex-row items-center gap-2">
              <AntDesign name="alert" size={18} color="#fff" />
              <Text className="text-base font-bold text-white">Reportar Ocorrência</Text>
            </View>
          </Button>
        </View>
      </BottomSheet>
    </>
  );
}
