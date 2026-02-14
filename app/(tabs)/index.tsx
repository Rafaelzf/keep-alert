import { useSession } from '@/components/auth/ctx';
import { MapLibre, type MapLibreRef } from '@/components/map/MapLibre';
import { PerimeterControl } from '@/components/perimeter';
import { ReportIncident } from '@/components/report-incident';
import { INCIDENT_TYPES } from '@/constants/incidents';
import { IncidentCategory } from '@/types/incident';
import { UserPerimeterRadius } from '@/types/user';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useSession();
  const [perimeter, setPerimeter] = useState<UserPerimeterRadius | null>(
    user?.perimeter_radius || null
  );
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Set<IncidentCategory>>(
    new Set(INCIDENT_TYPES.map((type) => type.id))
  );
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapLibreRef>(null);

  // Sincroniza o perímetro com o usuário quando carregar
  useEffect(() => {
    if (user?.perimeter_radius && perimeter !== user.perimeter_radius) {
      setPerimeter(user.perimeter_radius);
    }
  }, [user?.perimeter_radius]);

  const toggleFilter = (categoryId: IncidentCategory) => {
    setSelectedFilters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const selectAllFilters = () => {
    setSelectedFilters(new Set(INCIDENT_TYPES.map((type) => type.id)));
  };

  const clearAllFilters = () => {
    setSelectedFilters(new Set());
  };

  const handleRefreshMap = async () => {
    if (mapRef.current) {
      await mapRef.current.refresh();
    }
  };

  return (
    <View style={styles.container}>
      {/* Fundo branco no topo (status bar) */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      {/* Mapa ocupa toda a tela */}
      <MapLibre
        ref={mapRef}
        perimeter={perimeter}
        onLoadingChange={setIsMapLoading}
        filters={selectedFilters}
      />

      {/* PerimeterControl flutuando sobre o mapa */}
      <View style={[styles.perimeterContainer, { top: insets.top }]}>
        <PerimeterControl
          perimeter={perimeter}
          setPerimeter={setPerimeter}
          disabled={isMapLoading}
        />
      </View>

      {/* Botão de Filtro */}
      <View style={[styles.filterButton, { top: insets.top + 120 }]}>
        <Pressable
          onPress={() => setShowFilterModal(true)}
          disabled={isMapLoading}
          style={[
            styles.filterButtonInner,
            isMapLoading && styles.filterButtonDisabled,
          ]}>
          <Ionicons name="filter" size={20} color={isMapLoading ? '#9ca3af' : '#7c3aed'} />
        </Pressable>
      </View>

      <View style={[styles.perimeterContainer, { bottom: insets.bottom - 30 }]}>
        <ReportIncident
          onCenterUser={() => mapRef.current?.centerOnUser()}
          onRefresh={handleRefreshMap}
          disabled={isMapLoading}
        />
      </View>

      {/* Modal de Filtros */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}>
        <Pressable
          onPress={() => setShowFilterModal(false)}
          style={styles.modalOverlay}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar ocorrências por:</Text>
              <Pressable onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            {/* Botões de Selecionar/Limpar Todos */}
            <View style={styles.actionButtons}>
              <Pressable onPress={selectAllFilters} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Selecionar Todos</Text>
              </Pressable>
              <Pressable onPress={clearAllFilters} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Limpar Todos</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.filterList} showsVerticalScrollIndicator={true}>
              {INCIDENT_TYPES.map((type) => {
                const isSelected = selectedFilters.has(type.id);
                return (
                  <Pressable
                    key={type.id}
                    onPress={() => toggleFilter(type.id)}
                    style={styles.filterItem}>
                    <View
                      style={[
                        styles.filterIcon,
                        { backgroundColor: `${type.color}20` },
                      ]}>
                      <FontAwesome6 name={type.icon as any} size={18} color={type.color} />
                    </View>
                    <Text style={styles.filterLabel}>{type.label}</Text>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Botão Aplicar */}
            <Pressable
              onPress={() => setShowFilterModal(false)}
              style={styles.applyButton}>
              <Text style={styles.applyButtonText}>
                Aplicar Filtros ({selectedFilters.size})
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    zIndex: 5,
  },
  perimeterContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  filterButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  filterButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '85%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#171717',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterList: {
    maxHeight: 400,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  filterIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  filterLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#171717',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  applyButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
