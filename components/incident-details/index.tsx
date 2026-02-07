import { useIncidents } from '@/components/incidents/ctx';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { INCIDENT_TYPES } from '@/constants/incidents';
import { auth, db } from '@/firebase/firebaseConfig';
import { getTimeAgo } from '@/lib/date';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { encode } from 'ngeohash';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

interface IncidentDetailsProps {
  incidentId: string | null;
  visible: boolean;
  onClose: () => void;
}

// Opções de situação disponíveis (baseadas no enum IncidentSitutation)
const SITUATION_OPTIONS = [
  {
    id: 'police_on_way',
    label: 'Polícia a caminho',
    icon: 'car-outline',
    color: '#3b82f6',
    bgColor: '#dbeafe',
  },
  {
    id: 'police_on_site',
    label: 'Polícia no local',
    icon: 'shield-checkmark-outline',
    color: '#1d4ed8',
    bgColor: '#dbeafe',
  },
  {
    id: 'ambulance_on_way',
    label: 'Ambulância a caminho',
    icon: 'medical-outline',
    color: '#ef4444',
    bgColor: '#fee2e2',
  },
  {
    id: 'ambulance_on_site',
    label: 'Ambulância no local',
    icon: 'medkit-outline',
    color: '#dc2626',
    bgColor: '#fee2e2',
  },
  {
    id: 'firemen_on_way',
    label: 'Bombeiro a caminho',
    icon: 'flame-outline',
    color: '#f97316',
    bgColor: '#ffedd5',
  },
  {
    id: 'firemen_on_site',
    label: 'Bombeiro no local',
    icon: 'flame',
    color: '#ea580c',
    bgColor: '#fed7aa',
  },
  {
    id: 'found',
    label: 'Encontrado',
    icon: 'checkmark-circle-outline',
    color: '#16a34a',
    bgColor: '#dcfce7',
  },
] as const;

// Interface para sugestão de endereço
interface AddressSuggestion {
  name: string;
  fullAddress: string;
  lat: number;
  lon: number;
}

// Função auxiliar para calcular se dois geohashes estão próximos
function areGeohashesClose(geohash1: string, geohash2: string, precision: number = 5): boolean {
  // Compara os primeiros N caracteres do geohash
  // Precisão 5 = ~4.9km x 4.9km
  return geohash1.substring(0, precision) === geohash2.substring(0, precision);
}

export function IncidentDetails({ incidentId, visible, onClose }: IncidentDetailsProps) {
  const [comment, setComment] = useState('');
  const [showSituationModal, setShowSituationModal] = useState(false);
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);
  const [isUpdatingSituation, setIsUpdatingSituation] = useState(false);
  const [showFalseReportModal, setShowFalseReportModal] = useState(false);
  const [isRemovingFalseReport, setIsRemovingFalseReport] = useState(false);

  // Estados para edição de endereço
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AddressSuggestion | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const { updateIncidentSituation, incidents } = useIncidents();

  // Busca o incident atualizado do contexto em tempo real
  const incident = incidents.find((inc) => inc.id === incidentId) || null;

  // Stats - usando optional chaining para acessar com segurança

  const hasStats = useMemo(() => {
    if (!incident?.situtation) return false;
    return (
      incident.situtation.police_on_way > 0 ||
      incident.situtation.ambulance_on_way > 0 ||
      incident.situtation.firemen_on_way > 0 ||
      incident.situtation.police_on_site > 0 ||
      incident.situtation.ambulance_on_site > 0 ||
      incident.situtation.firemen_on_site > 0 ||
      incident.situtation.found > 0
    );
  }, [incident]);

  // Debounce para busca de endereços
  useEffect(() => {
    // Só busca se estiver editando, tiver pelo menos 3 caracteres e não tiver selecionado uma sugestão
    if (!isEditingAddress || addressInput.trim().length < 3 || selectedSuggestion) {
      setAddressSuggestions([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      if (!incident) return;

      setIsLoadingAddresses(true);
      try {
        const lat = incident.location.geopoint.lat;
        const lon = incident.location.geopoint.long;

        // Busca endereços usando a API Photon
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(addressInput)}&lat=${lat}&lon=${lon}&limit=10`
        );

        if (response.ok) {
          const data = await response.json();

          if (data.features && data.features.length > 0) {
            // Filtra sugestões próximas usando geohash
            const incidentGeohash = incident.location.geohash;
            const suggestions: AddressSuggestion[] = [];

            for (const feature of data.features) {
              const suggestionLat = feature.geometry.coordinates[1];
              const suggestionLon = feature.geometry.coordinates[0];
              const suggestionGeohash = encode(suggestionLat, suggestionLon, 9);

              // Verifica se está próximo (precisão 5 = ~4.9km)
              if (areGeohashesClose(incidentGeohash, suggestionGeohash, 5)) {
                const props = feature.properties;
                const parts = [
                  props.name,
                  props.street,
                  props.housenumber,
                  props.city || props.county,
                  props.state,
                  props.country,
                ].filter(Boolean);

                suggestions.push({
                  name: props.name || props.street || 'Endereço',
                  fullAddress: parts.join(', '),
                  lat: suggestionLat,
                  lon: suggestionLon,
                });
              }
            }

            setAddressSuggestions(suggestions.slice(0, 5)); // Limita a 5 sugestões
          } else {
            setAddressSuggestions([]);
          }
        }
      } catch (error) {
        console.error('[IncidentDetails] Erro ao buscar endereços:', error);
        setAddressSuggestions([]);
      } finally {
        setIsLoadingAddresses(false);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(searchTimeout);
  }, [addressInput, isEditingAddress, incident, selectedSuggestion]);

  // Busca a última situação escolhida pelo usuário quando o modal abre
  useEffect(() => {
    const fetchLastUserSituation = async () => {
      if (!showSituationModal || !incident || !auth.currentUser) return;

      try {
        const situationUpdatesRef = collection(db, 'incidents', incident.id, 'situation_updates');

        // Busca a última situação escolhida pelo usuário atual
        const q = query(
          situationUpdatesRef,
          where('user_id', '==', auth.currentUser.uid),
          orderBy('created_at', 'desc'),
          limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const lastSituation = querySnapshot.docs[0].data().situation;
          setSelectedSituation(lastSituation);
        } else {
          setSelectedSituation(null);
        }
      } catch (error) {
        console.error('Erro ao buscar última situação:', error);
        setSelectedSituation(null);
      }
    };

    fetchLastUserSituation();
  }, [showSituationModal, incident]);

  // Funções para controlar o modal de situação
  const handleOpenSituationModal = () => {
    setShowSituationModal(true);
  };

  const handleCloseSituationModal = () => {
    setShowSituationModal(false);
    setSelectedSituation(null);
  };

  const handleConfirmSituation = async () => {
    if (!selectedSituation || !incident) return;

    setIsUpdatingSituation(true);
    try {
      const result = await updateIncidentSituation(incident.id, selectedSituation);

      if (result.success) {
        handleCloseSituationModal();
        Alert.alert('Sucesso', 'Situação atualizada com sucesso!');
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível atualizar a situação');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar situação');
    } finally {
      setIsUpdatingSituation(false);
    }
  };

  // Funções para controlar o modal de falsa ocorrência
  const handleOpenFalseReportModal = async () => {
    if (!incident || !auth.currentUser) return;

    try {
      // Verifica se o último voto foi "false_accusation"
      const situationUpdatesRef = collection(db, 'incidents', incident.id, 'situation_updates');
      const q = query(
        situationUpdatesRef,
        where('user_id', '==', auth.currentUser.uid),
        orderBy('created_at', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const lastSituation = querySnapshot.docs[0].data().situation;
        setIsRemovingFalseReport(lastSituation === 'false_accusation');
      } else {
        setIsRemovingFalseReport(false);
      }
    } catch (error) {
      console.error('Erro ao verificar último voto:', error);
      setIsRemovingFalseReport(false);
    }

    setShowFalseReportModal(true);
  };

  const handleCloseFalseReportModal = () => {
    setShowFalseReportModal(false);
  };

  const handleConfirmFalseReport = async () => {
    if (!incident || !auth.currentUser) return;

    setIsUpdatingSituation(true);
    try {
      if (isRemovingFalseReport) {
        // Remove o voto de falsa ocorrência (apenas decrementa)
        const incidentRef = doc(db, 'incidents', incident.id);
        const incidentDoc = await getDoc(incidentRef);
        const incidentData = incidentDoc.data();

        if (incidentData && incidentData.situtation) {
          const currentCount = incidentData.situtation.false_accusation || 0;

          // Só decrementa se > 0
          if (currentCount > 0) {
            await updateDoc(incidentRef, {
              'situtation.false_accusation': increment(-1),
            });

            // Salva na subcoleção que o voto foi removido
            const situationUpdatesRef = collection(
              db,
              'incidents',
              incident.id,
              'situation_updates'
            );
            await addDoc(situationUpdatesRef, {
              situation: 'removed_false_accusation',
              user_id: auth.currentUser.uid,
              created_at: serverTimestamp(),
              user_name:
                auth.currentUser.displayName || auth.currentUser.email || 'Usuário anônimo',
            });

            handleCloseFalseReportModal();
            Alert.alert('Sucesso', 'Denúncia removida com sucesso!');
          } else {
            handleCloseFalseReportModal();
            Alert.alert('Aviso', 'Não há denúncias para remover');
          }
        }
      } else {
        // Reporta como falsa ocorrência
        const result = await updateIncidentSituation(incident.id, 'false_accusation');

        if (result.success) {
          handleCloseFalseReportModal();
          Alert.alert('Sucesso', 'Ocorrência reportada como falsa!');
        } else {
          Alert.alert('Erro', result.error || 'Não foi possível reportar como falsa');
        }
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao processar ação');
    } finally {
      setIsUpdatingSituation(false);
    }
  };

  // Funções para controlar edição de endereço
  const handleStartEditAddress = () => {
    setIsEditingAddress(true);
    setAddressInput(''); // Começa vazio para o usuário digitar
    setSelectedSuggestion(null);
    setAddressSuggestions([]);
  };

  const handleCancelEditAddress = () => {
    setIsEditingAddress(false);
    setAddressInput('');
    setSelectedSuggestion(null);
    setAddressSuggestions([]);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setSelectedSuggestion(suggestion);
    setAddressInput(suggestion.fullAddress);
    setAddressSuggestions([]);
  };

  const handleSaveAddress = async () => {
    if (!incident || !selectedSuggestion) return;

    try {
      const incidentRef = doc(db, 'incidents', incident.id);

      // Gera o novo geohash a partir das novas coordenadas
      const newGeohash = encode(selectedSuggestion.lat, selectedSuggestion.lon, 9);

      // Atualiza o endereço, coordenadas e geohash no Firestore
      await updateDoc(incidentRef, {
        adress: selectedSuggestion.fullAddress,
        'location.geopoint.lat': selectedSuggestion.lat,
        'location.geopoint.long': selectedSuggestion.lon,
        'location.geohash': newGeohash,
      });

      console.log('[IncidentDetails] Endereço e localização atualizados:', {
        address: selectedSuggestion.fullAddress,
        lat: selectedSuggestion.lat,
        long: selectedSuggestion.lon,
        geohash: newGeohash,
      });

      Alert.alert('Sucesso', 'Endereço e localização atualizados com sucesso!');
      handleCancelEditAddress();
    } catch (error: any) {
      console.error('[IncidentDetails] Erro ao atualizar endereço:', error);
      Alert.alert('Erro', error.message || 'Não foi possível atualizar o endereço');
    }
  };

  if (!incident) {
    console.log('[IncidentDetails] Incident is null');
    return null;
  }

  console.log('[IncidentDetails] Rendering incident:', incident.id, incident);

  const incidentType = INCIDENT_TYPES.find((type) => type.id === incident.category);
  const label = incidentType?.label || 'Ocorrência';
  const icon = incidentType?.icon || 'circcreatedAthále-exclamation';
  const color = incidentType?.color || '#ef4444';

  // Calcula tempo desde criação
  const createdAt =
    'seconds' in incident.created_at ? new Date(incident.created_at.seconds * 1000) : new Date();
  const timeAgo = getTimeAgo(createdAt);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView className="pb-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex flex-col gap-5 pb-6">
          <View className="flex flex-row items-center justify-between">
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
              <View className="rounded-lg bg-green-600 px-3 py-1">
                <Text className="text-xs font-bold text-white">Ativo</Text>
              </View>

              {/* Botão Fechar */}
              <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center">
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>
          </View>

          <View className="flex flex-row justify-end">
            <Pressable
              onPress={handleOpenSituationModal}
              className="flex flex-row items-center gap-2 self-start rounded-lg  bg-primary px-3 py-2">
              <Ionicons name="sync-outline" size={16} color="#fff" />
              <Text className="text-sm font-medium text-white">Atualizar situação</Text>
            </Pressable>
          </View>

          {/* Info: Tempo e Autor */}
          <View className="gap-1">
            <View className="flex flex-row items-center gap-2">
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text className="text-sm text-neutral-600">
                <Text className="font-semibold">{timeAgo}</Text>
              </Text>
            </View>
            <View className="flex flex-row items-center gap-2">
              <Ionicons name="person-outline" size={14} color="#6b7280" />
              <Text className="text-sm text-neutral-600">
                Reportado por:{' '}
                <Text className="font-semibold">{incident.author_id.substring(0, 8)}</Text>
              </Text>
            </View>
          </View>

          {/* Endereço */}
          <View>
            <Text className="mb-2 text-base font-semibold text-neutral-900">Endereço</Text>

            {/* Modo Visualização */}
            {!isEditingAddress && (
              <View className="flex flex-row items-center justify-between gap-2 rounded-lg bg-neutral-50 p-3">
                <Ionicons name="location-outline" size={16} color="#78716c" />
                <Text className="flex-1 text-sm text-neutral-700">{incident.adress || 'N/A'}</Text>
                <Pressable
                  onPress={handleStartEditAddress}
                  className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <Ionicons name="create-outline" size={18} color="#fff" />
                </Pressable>
              </View>
            )}

            {/* Modo Edição */}
            {isEditingAddress && (
              <View className="gap-2">
                {/* Input de busca com botões */}
                <View className="flex flex-row items-center gap-2">
                  <View className="flex-1 flex-row items-center gap-2 rounded-lg border-2 border-primary bg-white px-3 py-2">
                    <Ionicons name="search-outline" size={18} color="#6366f1" />
                    <TextInput
                      value={addressInput}
                      onChangeText={(text) => {
                        setAddressInput(text);
                        setSelectedSuggestion(null); // Reseta sugestão quando digitar
                      }}
                      placeholder="Digite para buscar endereço..."
                      placeholderTextColor="#9ca3af"
                      className="flex-1 text-sm text-neutral-900"
                      autoFocus
                    />
                    {addressInput.length > 0 && (
                      <Pressable
                        onPress={() => {
                          setAddressInput('');
                          setSelectedSuggestion(null);
                          setAddressSuggestions([]);
                        }}>
                        <Ionicons name="close-circle" size={18} color="#9ca3af" />
                      </Pressable>
                    )}
                  </View>

                  {/* Botão Cancelar ou Salvar */}
                  {selectedSuggestion ? (
                    <Pressable
                      onPress={handleSaveAddress}
                      className="items-center justify-center rounded-lg bg-green-600 px-4 py-2.5">
                      <Text className="text-sm font-semibold text-white">Salvar</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={handleCancelEditAddress}
                      className="items-center justify-center rounded-lg bg-neutral-400 px-3 py-2.5">
                      <Ionicons name="close" size={20} color="#fff" />
                    </Pressable>
                  )}
                </View>

                {/* Loading de busca */}
                {isLoadingAddresses && (
                  <View className="flex flex-row items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                    <Ionicons name="hourglass-outline" size={14} color="#3b82f6" />
                    <Text className="text-xs text-blue-700">Buscando endereços...</Text>
                  </View>
                )}

                {/* Sugestões de endereço */}
                {addressSuggestions.length > 0 && !selectedSuggestion && (
                  <View className="gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-md">
                    <View className="px-2 py-1">
                      <Text className="text-xs font-semibold text-neutral-500">
                        Sugestões próximas:
                      </Text>
                    </View>
                    {addressSuggestions.map((suggestion, index) => (
                      <Pressable
                        key={index}
                        onPress={() => handleSelectSuggestion(suggestion)}
                        className="rounded-md bg-neutral-50 p-3 active:bg-primary/10">
                        <View className="flex flex-row items-start gap-2">
                          <Ionicons name="location" size={16} color="#6366f1" />
                          <View className="flex-1">
                            <Text className="text-sm font-semibold text-neutral-900">
                              {suggestion.name}
                            </Text>
                            <Text className="text-xs text-neutral-600">
                              {suggestion.fullAddress}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Mensagem quando selecionou uma sugestão */}
                {selectedSuggestion && (
                  <View className="flex flex-row items-start gap-2 rounded-lg bg-green-50 p-3">
                    <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-green-900">
                        Endereço selecionado:
                      </Text>
                      <Text className="text-xs text-green-700">{selectedSuggestion.fullAddress}</Text>
                    </View>
                  </View>
                )}

                {/* Nenhum resultado */}
                {!isLoadingAddresses &&
                  addressInput.trim().length > 2 &&
                  addressSuggestions.length === 0 &&
                  !selectedSuggestion && (
                    <View className="flex flex-row items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2">
                      <Ionicons name="warning-outline" size={14} color="#ca8a04" />
                      <Text className="flex-1 text-xs text-yellow-700">
                        Nenhum endereço encontrado próximo à ocorrência. Tente outro termo de busca.
                      </Text>
                    </View>
                  )}
              </View>
            )}
          </View>

          {/* Situação Atual */}
          <View>
            <Text className="mb-3 text-base font-semibold text-neutral-900">Situação atual</Text>
            {hasStats ? (
              <View className="flex flex-row flex-wrap gap-2">
                {/* Polícia a caminho */}
                {(incident?.situtation?.police_on_way ?? 0) > 0 && (
                  <View className="flex flex-row items-center gap-2 rounded-lg border border-blue-500 bg-blue-300 px-3 py-2">
                    <Ionicons name="car-outline" size={16} color="#1d4ed8" />
                    <Text className="text-sm font-medium text-blue-700">Polícia a caminho</Text>
                    <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-blue-900">
                      <Text className="text-xs font-bold text-white">
                        {incident.situtation.police_on_way}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Polícia no local */}
                {(incident?.situtation?.police_on_site ?? 0) > 0 && (
                  <View className="flex flex-row items-center gap-2 rounded-lg border border-blue-900 bg-blue-500 px-3 py-2">
                    <MaterialIcons name="local-police" size={16} color="#fff" />
                    <Text className="text-sm font-medium text-white">Polícia no local</Text>
                    <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-blue-900">
                      <Text className="text-xs font-bold text-white">
                        {incident.situtation.police_on_site}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Ambulância a caminho */}
                {(incident?.situtation?.ambulance_on_way ?? 0) > 0 && (
                  <View className="flex flex-row items-center gap-2 rounded-lg  border border-red-700 bg-red-400 px-3 py-2">
                    <FontAwesome5 name="ambulance" size={12} color="#b91c1c" />
                    <Text className="text-sm font-medium text-red-700">Ambulância a caminho</Text>
                    <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-red-700">
                      <Text className="text-xs font-bold text-white">
                        {incident.situtation.ambulance_on_way}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Ambulância no local */}
                {(incident?.situtation?.ambulance_on_site ?? 0) > 0 && (
                  <View className="flex flex-row items-center gap-2 rounded-lg border border-red-700  px-3 py-2">
                    <Ionicons name="medkit-outline" size={16} color="#b91c1c" />
                    <Text className="text-sm font-medium text-red-700">Ambulância no local</Text>
                    <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-red-700">
                      <Text className="text-xs font-bold text-white">
                        {incident.situtation.ambulance_on_site}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Bombeiro a caminho */}
                {(incident?.situtation?.firemen_on_way ?? 0) > 0 && (
                  <View className="flex flex-row items-center gap-2 rounded-lg border border-orange-500 bg-orange-300 px-3 py-2">
                    <Ionicons name="flame-outline" size={16} color="#ea580c" />
                    <Text className="text-sm font-medium text-orange-800">Bombeiro a caminho</Text>
                    <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-orange-900">
                      <Text className="text-xs font-bold text-white">
                        {incident.situtation.firemen_on_way}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Bombeiro no local */}
                {(incident?.situtation?.firemen_on_site ?? 0) > 0 && (
                  <View className="flex flex-row items-center gap-2 rounded-lg border border-orange-700 bg-orange-500 px-3 py-2">
                    <Ionicons name="flame" size={16} color="#fed7aa" />
                    <Text className="text-sm font-medium text-orange-50">Bombeiro no local</Text>
                    <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-orange-950">
                      <Text className="text-xs font-bold text-white">
                        {incident.situtation.firemen_on_site}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Encontrado */}
                {(incident?.situtation?.found ?? 0) > 0 && (
                  <View className="flex flex-row items-center gap-2 rounded-lg border border-green-500 bg-green-300 px-3 py-2">
                    <Ionicons name="checkmark-circle-outline" size={16} color="#15803d" />
                    <Text className="text-sm font-medium text-green-700">Encontrado</Text>
                    <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-green-900">
                      <Text className="text-xs font-bold text-white">
                        {incident.situtation.found}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <Text className="text-sm text-neutral-600">Nenhuma situação atualizada.</Text>
            )}
          </View>

          {/* Reportar Problema */}
          <View>
            <Text className="mb-3 text-base font-semibold text-neutral-900">Reportar Problema</Text>
            <Pressable
              onPress={handleOpenFalseReportModal}
              className="flex flex-row items-center gap-2 self-start rounded-lg border border-neutral-300 bg-slate-700 px-3 py-2">
              <Ionicons name="alert-circle-outline" size={16} color="#fff" />

              <Text className="text-sm font-medium text-white">Falsa Ocorrência</Text>
              <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-white">
                <Text className="text-xs font-bold text-slate-700">
                  {incident?.situtation?.false_accusation ?? 0}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Comentários */}
          <View>
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
        </View>
      </ScrollView>

      {/* Modal de Atualizar Situação */}
      <Modal
        visible={showSituationModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseSituationModal}>
        {/* Overlay escuro */}
        <Pressable
          onPress={handleCloseSituationModal}
          className="flex-1 items-center justify-center bg-black/50">
          {/* Container do modal - impede que cliques aqui fechem o modal */}
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-[90%] max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {/* Header do modal */}
            <View className="mb-5 flex flex-row items-center justify-between">
              <Text className="text-xl font-bold text-neutral-900">Atualizar Situação</Text>
              <Pressable
                onPress={handleCloseSituationModal}
                className="h-8 w-8 items-center justify-center">
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            {/* Info Message */}
            <View className="mb-5 flex flex-row items-start gap-2 rounded-lg bg-blue-50 p-3">
              <Ionicons name="information-circle-outline" size={18} color="#3b82f6" />
              <Text className="flex-1 text-sm text-blue-900">
                Selecione a situação atual da ocorrência.
              </Text>
            </View>

            {/* Opções de situação - Radio Buttons */}
            <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
              <View className="gap-3">
                {SITUATION_OPTIONS.map((option) => {
                  const isSelected = selectedSituation === option.id;
                  const isOpaque = selectedSituation !== null && !isSelected;

                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => setSelectedSituation(option.id)}
                      className={`flex flex-row items-center gap-3 rounded-xl border-2 p-4 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-neutral-200 bg-white'
                      }`}
                      style={{ opacity: isOpaque ? 0.4 : 1 }}>
                      {/* Radio button */}
                      <View
                        className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-neutral-300 bg-white'
                        }`}>
                        {isSelected && <View className="h-3 w-3 rounded-full bg-white" />}
                      </View>

                      {/* Ícone */}
                      <View
                        className="h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: option.bgColor }}>
                        <Ionicons name={option.icon as any} size={20} color={option.color} />
                      </View>

                      {/* Label */}
                      <Text className="flex-1 text-base font-medium text-neutral-900">
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Botões de ação */}
            <View className="mt-5 flex flex-row gap-3">
              <Pressable
                onPress={handleCloseSituationModal}
                disabled={isUpdatingSituation}
                className={`flex-1 items-center justify-center rounded-lg border-2 border-neutral-300 bg-white py-3 ${
                  isUpdatingSituation ? 'opacity-50' : ''
                }`}>
                <Text className="text-base font-semibold text-neutral-700">Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmSituation}
                disabled={!selectedSituation || isUpdatingSituation}
                className={`flex-1 items-center justify-center rounded-lg py-3 ${
                  selectedSituation && !isUpdatingSituation ? 'bg-purple-600' : 'bg-neutral-300'
                }`}>
                <Text className="text-base font-semibold text-white">
                  {isUpdatingSituation ? 'Atualizando...' : 'Confirmar'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de Confirmação de Falsa Ocorrência */}
      <Modal
        visible={showFalseReportModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseFalseReportModal}>
        {/* Overlay escuro */}
        <Pressable
          onPress={handleCloseFalseReportModal}
          className="flex-1 items-center justify-center bg-black/50">
          {/* Container do modal */}
          <View className="relative mx-auto w-[75%] rounded-2xl bg-white p-6 shadow-2xl">
            {/* Botão X no topo direito */}
            <Pressable
              onPress={handleCloseFalseReportModal}
              className="absolute right-2 top-2 z-10 h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
              <Ionicons name="close" size={20} color="#6b7280" />
            </Pressable>

            {/* Ícone de Alerta */}
            <View className="mb-4 items-center">
              <View
                className={`h-16 w-16 items-center justify-center rounded-full ${
                  isRemovingFalseReport ? 'bg-blue-100' : 'bg-red-100'
                }`}>
                <Ionicons
                  name={isRemovingFalseReport ? 'remove-circle' : 'alert-circle'}
                  size={40}
                  color={isRemovingFalseReport ? '#2563eb' : '#dc2626'}
                />
              </View>
            </View>

            {/* Título */}
            <Text className="mb-2 text-center text-xl font-bold text-neutral-900">
              {isRemovingFalseReport ? 'Retirar Denúncia?' : 'Reportar como Falsa?'}
            </Text>

            {/* Mensagem */}
            <Text className="mb-6 text-center text-base text-neutral-600">
              {isRemovingFalseReport
                ? 'Deseja retirar sua denúncia de falsa ocorrência?'
                : 'Tem certeza que deseja reportar essa ocorrência como falsa?'}
            </Text>

            {/* Botões */}
            <View className=" flex flex-row gap-3 py-2">
              <Pressable
                onPress={handleCloseFalseReportModal}
                disabled={isUpdatingSituation}
                className={`flex-1 items-center justify-center rounded-lg border-2 border-neutral-300 bg-white py-3 ${
                  isUpdatingSituation ? 'opacity-50' : ''
                }`}>
                <Text className="text-base font-semibold text-neutral-700">Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmFalseReport}
                disabled={isUpdatingSituation}
                className={`flex-1 items-center justify-center rounded-lg py-3 ${
                  isUpdatingSituation
                    ? 'bg-neutral-400'
                    : isRemovingFalseReport
                      ? 'bg-blue-600'
                      : 'bg-red-600'
                }`}>
                <Text className="text-base font-semibold text-white">
                  {isUpdatingSituation
                    ? isRemovingFalseReport
                      ? 'Retirando...'
                      : 'Reportando...'
                    : isRemovingFalseReport
                      ? 'Sim, Retirar'
                      : 'Sim, Reportar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </BottomSheet>
  );
}
