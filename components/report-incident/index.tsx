import { useIncidents } from '@/components/incidents/ctx';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { INCIDENT_TYPES } from '@/constants/incidents';
import { playSuccessSound } from '@/lib/sound';
import { IncidentCategory } from '@/types/incident';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface ReportIncidentProps {
  onCenterUser: () => void;
  disabled?: boolean;
}

const ITEMS_PER_PAGE = 9;
const { width } = Dimensions.get('window');

export function ReportIncident({ onCenterUser, disabled = false }: ReportIncidentProps) {
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [step, setStep] = useState<'select' | 'describe'>('select');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const slidePosition = useSharedValue(0);
  const { reportIncident } = useIncidents();

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
    setStep('select');
    setDescription('');
    slidePosition.value = 0;
  };

  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId);
  };

  const handleNext = () => {
    if (!selectedType) return;
    setStep('describe');
    slidePosition.value = withTiming(-(width - 40), { duration: 300 });
  };

  const handleBack = () => {
    setStep('select');
    slidePosition.value = withTiming(0, { duration: 300 });
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    try {
      const result = await reportIncident(selectedType as IncidentCategory, description.trim());

      if (result.success) {
        // Toca som de sucesso + vibração
        playSuccessSound();

        handleClose();
        setToastMessage('Ocorrência reportada com sucesso!');
        setShowToast(true);
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível reportar a ocorrência');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao reportar ocorrência');
    } finally {
      setIsSubmitting(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slidePosition.value }],
  }));

  return (
    <>
      <View className="mx-5 mb-5 flex flex-row justify-between gap-3">
        <Pressable
          onPress={onCenterUser}
          disabled={disabled}
          className="flex items-center justify-center rounded-lg bg-white p-3 shadow-md"
          style={{ opacity: disabled ? 0.5 : 1 }}>
          <AntDesign name="aim" size={20} color={disabled ? '#d1d5db' : '#78716c'} />
        </Pressable>
        <Pressable
          onPress={() => setShowReportSheet(true)}
          disabled={disabled}
          className="flex flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-[#b91c1c] py-3 text-white shadow-md"
          style={{ opacity: disabled ? 0.5 : 1 }}>
          <AntDesign name="alert" size={24} color="#fff" />
          <Text className="font-bold text-white">Reportar incidente</Text>
        </Pressable>
        <Pressable
          disabled={disabled}
          className="flex items-center justify-center rounded-lg bg-white p-3 shadow-md"
          style={{ opacity: disabled ? 0.5 : 1 }}>
          <Ionicons name="sync-outline" size={20} color={disabled ? '#d1d5db' : '#78716c'} />
        </Pressable>
      </View>

      {/* Bottom Sheet de Reportar Ocorrência */}
      <BottomSheet visible={showReportSheet} onClose={handleClose}>
        {/* Overlay de Loading */}
        {isSubmitting && (
          <View className="absolute inset-0 z-50 items-center justify-center bg-black/40">
            <View className="items-center gap-3 rounded-2xl bg-white p-6 shadow-2xl">
              <ActivityIndicator size="large" color="#7c3aed" />
              <Text className="text-base font-semibold text-neutral-900">Reportando...</Text>
              <Text className="text-sm text-neutral-600">Aguarde um momento</Text>
            </View>
          </View>
        )}

        <View className="gap-4 pb-10 pt-4">
          {/* Header */}
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center gap-2">
              {step === 'describe' && (
                <Pressable onPress={handleBack} disabled={isSubmitting} className="mr-2">
                  <Ionicons
                    name="arrow-back"
                    size={24}
                    color={isSubmitting ? '#d1d5db' : '#78716c'}
                  />
                </Pressable>
              )}
              <AntDesign name="warning" size={24} color="#ef4444" />
              <Text className="text-xl font-bold text-neutral-900">
                {step === 'select' ? 'Tipo de Ocorrência' : 'Descrição'}
              </Text>
            </View>
            <Pressable onPress={handleClose} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color={isSubmitting ? '#d1d5db' : '#78716c'} />
            </Pressable>
          </View>

          {/* Info Message */}
          <View className="flex  flex-row items-start gap-2 rounded-md bg-blue-100 p-3">
            <Ionicons name="information-circle-outline" size={16} color="#3b0764" />
            <Text className="flex-1 text-sm text-purple-900">
              {step === 'select'
                ? 'As ocorrências reportadas devem ser relacionadas com a sua localização atual.'
                : 'Adicione detalhes sobre a ocorrência (opcional).'}
            </Text>
          </View>

          {/* Container com overflow hidden para os slides */}
          <View style={{ overflow: 'hidden' }} className={step === 'describe' ? 'h-[150px]' : ''}>
            <Animated.View style={[{ flexDirection: 'row' }, animatedStyle]}>
              {/* Slide 1: Tipo de Ocorrência */}
              <View style={{ width: width - 40 }} className="gap-3">
                <Text className="text-sm font-semibold text-neutral-900">
                  Selecione o tipo <Text className="text-red-500">*</Text>
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
                          onPress={() => handleSelectType(type.id)}
                          className={`w-[30%] items-center gap-2 rounded-xl border-2 p-3 ${
                            selectedType === type.id
                              ? 'border-purple-500 bg-blue-50'
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

              {/* Slide 2: Descrição */}
              <View style={{ width: width - 40 }} className="gap-4">
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-neutral-900">
                    Descrição (opcional)
                  </Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Adicione detalhes sobre a ocorrência..."
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    autoComplete="off"
                    autoCorrect={false}
                    autoCapitalize="sentences"
                    editable={!isSubmitting}
                    className={`rounded-lg border-2 p-3 text-base ${
                      isSubmitting
                        ? 'border-neutral-100 bg-neutral-50 text-neutral-400'
                        : 'border-neutral-200 bg-white text-neutral-900'
                    }`}
                    style={{ minHeight: 100, textAlignVertical: 'top' }}
                  />
                  <Text className="text-right text-xs text-neutral-500">
                    {description.length}/500
                  </Text>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Botões */}
          {step === 'select' ? (
            <Button
              className="mt-2 w-full bg-purple-600"
              disabled={!selectedType}
              onPress={handleNext}>
              <View className="flex flex-row items-center gap-2">
                <Text className="text-base font-bold text-white">Continuar</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </Button>
          ) : (
            <Button
              className="mt-2 w-full bg-red-600"
              disabled={isSubmitting}
              onPress={handleSubmit}>
              <View className="flex flex-row items-center gap-2">
                <AntDesign name="alert" size={18} color="#fff" />
                <Text className="text-base font-bold text-white">
                  {isSubmitting ? 'Reportando...' : 'Confirmar Ocorrência'}
                </Text>
              </View>
            </Button>
          )}
        </View>
      </BottomSheet>

      {/* Toast de sucesso */}
      <Toast message={toastMessage} visible={showToast} onHide={() => setShowToast(false)} />
    </>
  );
}
