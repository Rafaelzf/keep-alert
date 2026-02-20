import { Incident } from '@/types/incident';
import Ionicons from '@expo/vector-icons/Ionicons';
import { doc, getFirestore, updateDoc } from '@react-native-firebase/firestore';
import { encode } from 'ngeohash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

interface AddressSuggestion {
  name: string;
  fullAddress: string;
  lat: number;
  lon: number;
}

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
  incident: Incident | null;
}

// Função auxiliar para calcular se dois geohashes estão próximos
function areGeohashesClose(geohash1: string, geohash2: string, precision: number = 5): boolean {
  return geohash1.substring(0, precision) === geohash2.substring(0, precision);
}

export function AddressModal({ visible, onClose, incident }: AddressModalProps) {
  const [addressInput, setAddressInput] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const lastSearchQueryRef = useRef<string>('');

  // Handler de mudança de texto
  const handleAddressInputChange = useCallback((text: string) => {
    setAddressInput(text);
  }, []);

  // Debounce para busca de endereços
  useEffect(() => {
    if (!visible || addressInput.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }

    if (addressInput.trim() === lastSearchQueryRef.current) {
      return;
    }

    const searchTimeout = setTimeout(async () => {
      if (!incident) return;

      const trimmedInput = addressInput.trim();
      lastSearchQueryRef.current = trimmedInput;
      setIsLoadingAddresses(true);

      try {
        const lat = incident.location.geopoint.lat;
        const lon = incident.location.geopoint.long;

        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmedInput)}&lat=${lat}&lon=${lon}&limit=10`
        );

        if (response.ok) {
          const data = await response.json();

          if (data.features && data.features.length > 0) {
            const incidentGeohash = incident.location.geohash;
            const suggestions: AddressSuggestion[] = [];

            for (const feature of data.features) {
              const suggestionLat = feature.geometry.coordinates[1];
              const suggestionLon = feature.geometry.coordinates[0];
              const suggestionGeohash = encode(suggestionLat, suggestionLon, 9);

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

            setAddressSuggestions(suggestions.slice(0, 5));
          } else {
            setAddressSuggestions([]);
          }
        }
      } catch (error) {
        console.error('[AddressModal] Erro ao buscar endereços:', error);
        setAddressSuggestions([]);
      } finally {
        setIsLoadingAddresses(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [addressInput, visible, incident]);

  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    if (!incident) return;

    try {
      const incidentRef = doc(getFirestore(), 'incidents', incident.id);
      const newGeohash = encode(suggestion.lat, suggestion.lon, 9);

      await updateDoc(incidentRef, {
        adress: suggestion.fullAddress,
        'location.geopoint.lat': suggestion.lat,
        'location.geopoint.long': suggestion.lon,
        'location.geohash': newGeohash,
      });

      Alert.alert('Sucesso', 'Endereço e localização atualizados com sucesso!');
      handleClose();
    } catch (error: any) {
      console.error('[AddressModal] Erro ao atualizar endereço:', error);
      Alert.alert('Erro', error.message || 'Não foi possível atualizar o endereço');
    }
  };

  const handleClose = () => {
    setAddressInput('');
    setAddressSuggestions([]);
    lastSearchQueryRef.current = '';
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable onPress={handleClose} className="flex-1 items-center justify-center bg-black/50">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-[90%] max-w-md rounded-2xl bg-white shadow-2xl"
          style={{ maxHeight: '80%' }}>
          {/* Header */}
          <View className="flex flex-row items-center justify-between border-b border-neutral-200 p-4">
            <Text className="text-xl font-bold text-neutral-900">Buscar Endereço</Text>
            <Pressable onPress={handleClose} className="h-8 w-8 items-center justify-center">
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          {/* Content */}
          <View className="p-4">
            {/* Input de busca */}
            <View className="mb-4 flex-row items-center gap-2 rounded-lg border-2 border-primary bg-white px-3 py-2">
              <Ionicons name="search-outline" size={18} color="#6366f1" />
              <TextInput
                value={addressInput}
                onChangeText={handleAddressInputChange}
                placeholder="Digite para buscar endereço..."
                placeholderTextColor="#9ca3af"
                className="flex-1 text-sm text-neutral-900"
                autoComplete="off"
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus
              />
              {addressInput.length > 0 && (
                <Pressable
                  onPress={() => {
                    setAddressInput('');
                    setAddressSuggestions([]);
                    lastSearchQueryRef.current = '';
                  }}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </Pressable>
              )}
            </View>

            {/* Loading */}
            {isLoadingAddresses && (
              <View className="mb-4 flex flex-row items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                <Ionicons name="hourglass-outline" size={14} color="#3b82f6" />
                <Text className="text-xs text-blue-700">Buscando endereços...</Text>
              </View>
            )}

            {/* Sugestões com ScrollView */}
            {addressSuggestions.length > 0 && (
              <ScrollView
                style={{ maxHeight: 300, overflow: 'scroll' }}
                showsVerticalScrollIndicator={true}>
                <View className="gap-2">
                  {addressSuggestions.map((suggestion, index) => (
                    <Pressable
                      key={`suggestion-${index}`}
                      onPress={() => handleSelectSuggestion(suggestion)}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 active:bg-blue-50">
                      <View className="flex flex-row items-start gap-2">
                        <Ionicons name="location" size={16} color="#6366f1" />
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-neutral-900">
                            {suggestion.name}
                          </Text>
                          <Text className="text-xs text-neutral-600">{suggestion.fullAddress}</Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Nenhum resultado */}
            {!isLoadingAddresses &&
              addressInput.trim().length > 2 &&
              addressSuggestions.length === 0 && (
                <View className="flex flex-row items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2">
                  <Ionicons name="warning-outline" size={14} color="#ca8a04" />
                  <Text className="flex-1 text-xs text-yellow-700">
                    Nenhum endereço encontrado próximo à ocorrência. Tente outro termo de busca.
                  </Text>
                </View>
              )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
