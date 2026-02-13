import { useSession } from '@/components/auth/ctx';
import { AddressModal } from '@/components/incident-details/AddressModal';
import { Comments } from '@/components/incident-details/Comments';
import { Images } from '@/components/incident-details/Images';
import { useIncidents } from '@/components/incidents/ctx';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toast } from '@/components/ui/toast';
import { INCIDENT_TYPES } from '@/constants/incidents';
import { auth, db } from '@/firebase/firebaseConfig';
import { getTimeAgo } from '@/lib/date';
import { UserRole } from '@/types/user';
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
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Separator } from '../ui/separator';

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
    id: 'situation_resolved',
    label: 'Resolvido',
    icon: 'checkmark-circle-outline',
    color: '#16a34a',
    bgColor: '#dcfce7',
  },
] as const;

export function IncidentDetails({ incidentId, visible, onClose }: IncidentDetailsProps) {
  const [showSituationModal, setShowSituationModal] = useState(false);
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);
  const [isUpdatingSituation, setIsUpdatingSituation] = useState(false);
  const [showFalseReportModal, setShowFalseReportModal] = useState(false);
  const [isRemovingFalseReport, setIsRemovingFalseReport] = useState(false);
  const [value, setValue] = useState('infos');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Estado para modal de edição de endereço
  const [showAddressModal, setShowAddressModal] = useState(false);

  const { updateIncidentSituation, deleteIncident, incidents } = useIncidents();
  const { user } = useSession();

  // Busca o incident atualizado do contexto em tempo real
  const incident = incidents.find((inc) => inc.id === incidentId) || null;

  // Verifica se o usuário pode deletar o incident (é autor ou admin)
  const canDelete = useMemo(() => {
    if (!user || !incident) return false;
    const isAuthor = user.uid === incident.author.uid;
    const isAdmin = user.role === UserRole.ADMIN;
    return isAuthor || isAdmin;
  }, [user, incident]);

  // Verifica se a ocorrência foi resolvida pelo autor
  const isResolvedByAuthor = useMemo(() => {
    if (!user || !incident) return false;
    const isAuthor = user.uid === incident.author.uid;
    const hasResolvedStatus = (incident.situtation?.situation_resolved ?? 0) > 0;
    return isAuthor && hasResolvedStatus;
  }, [user, incident]);

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
      incident.situtation.situation_resolved > 0
    );
  }, [incident]);

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
        setToastMessage('Situação atualizada com sucesso!');
        setShowToast(true);
      } else {
        setToastMessage(result.error || 'Não foi possível atualizar a situação');
        setShowToast(true);
      }
    } catch (error: any) {
      setToastMessage(error.message || 'Erro ao atualizar situação');
      setShowToast(true);
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

  const handleDeleteIncident = async () => {
    if (!incident) return;

    setIsDeleting(true);
    try {
      const result = await deleteIncident(incident.id);

      if (result.success) {
        setShowDeleteModal(false);
        onClose(); // Fecha o bottom sheet

        // Mostra toast após fechar
        setTimeout(() => {
          setToastMessage('Ocorrência removida com sucesso!');
          setShowToast(true);
        }, 300);
      } else {
        setToastMessage(result.error || 'Não foi possível remover a ocorrência');
        setShowToast(true);
      }
    } catch (error: any) {
      setToastMessage(error.message || 'Erro ao remover ocorrência');
      setShowToast(true);
    } finally {
      setIsDeleting(false);
    }
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
            setToastMessage('Denúncia removida com sucesso!');
            setShowToast(true);
          } else {
            handleCloseFalseReportModal();
            setToastMessage('Não há denúncias para remover');
            setShowToast(true);
          }
        }
      } else {
        // Reporta como falsa ocorrência
        const result = await updateIncidentSituation(incident.id, 'false_accusation');

        if (result.success) {
          handleCloseFalseReportModal();
          setToastMessage('Ocorrência reportada como falsa!');
          setShowToast(true);
        } else {
          setToastMessage(result.error || 'Não foi possível reportar como falsa');
          setShowToast(true);
        }
      }
    } catch (error: any) {
      setToastMessage(error.message || 'Erro ao processar ação');
      setShowToast(true);
    } finally {
      setIsUpdatingSituation(false);
    }
  };

  if (!incident) {
    return null;
  }

  const incidentType = INCIDENT_TYPES.find((type) => type.id === incident.category);
  const label = incidentType?.label || 'Ocorrência';
  const icon = incidentType?.icon || 'circcreatedAthále-exclamation';
  const color = incidentType?.color || '#ef4444';

  // Calcula tempo desde criação
  const createdAt =
    incident.created_at && 'seconds' in incident.created_at
      ? new Date(incident.created_at.seconds * 1000)
      : new Date();
  const timeAgo = getTimeAgo(createdAt);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView className="pb-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex flex-col gap-5 pb-6">
          <View className="flex flex-row justify-between gap-3">
            <View className="flex flex-row items-center gap-3">
              {/* Ícone */}
              <View
                className="h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: `${color}20` }}>
                <FontAwesome6 name={icon as any} size={20} color={color} />
              </View>
              <Text className={`text-base font-bold text-[${color}]`}>{label}</Text>
            </View>

            <View className="flex flex-row items-center gap-2">
              {/* Botão Deletar (apenas para autor ou admin) */}

              <View className={`rounded-lg px-3 py-1 ${isResolvedByAuthor ? 'bg-blue-600' : 'bg-green-600'}`}>
                <Text className="text-xs font-bold text-white">
                  {isResolvedByAuthor ? 'Resolvido' : 'Ativo'}
                </Text>
              </View>

              {/* Botão Fechar */}
              <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center">
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>
          </View>

          {!isResolvedByAuthor && (
            <View className="flex flex-row justify-center gap-3">
              <Pressable
                onPress={handleOpenSituationModal}
                className="flex flex-row items-center gap-2 self-start rounded-lg  bg-primary px-3 py-2">
                <Text className="text-sm font-medium text-white">Atualizar situação</Text>
              </Pressable>
              <Pressable
                onPress={handleOpenFalseReportModal}
                className="flex flex-row items-center gap-2 self-start rounded-lg border border-neutral-300 bg-slate-700 px-3 py-2">
                <Text className="text-sm font-medium text-white">Falsa Ocorrência</Text>
                <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-white">
                  <Text className="text-xs font-bold text-slate-700">
                    {incident?.situtation?.false_accusation ?? 0}
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          {isResolvedByAuthor && (
            <View className="rounded-lg bg-blue-50 p-3">
              <Text className="text-center text-sm font-medium text-blue-900">
                ✓ Esta ocorrência foi marcada como resolvida pelo autor
              </Text>
            </View>
          )}

          <Separator className="flex-1" />

          {/* Info: Tempo e Autor */}
          <View className="gap-1">
            <View className="flex flex-row items-center justify-between gap-2">
              <View className="flex flex-row items-center gap-2">
                <Ionicons name="time-outline" size={14} color="#6b7280" />
                <Text className="text-sm text-neutral-600">
                  <Text className="font-semibold">{timeAgo}</Text>
                </Text>
              </View>
              {canDelete && (
                <Pressable
                  onPress={() => setShowDeleteModal(true)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-red-100">
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </Pressable>
              )}
            </View>
            <View className="flex flex-row items-center gap-2">
              {/* Avatar do usuário */}
              {incident.author.avatar ? (
                <Image
                  source={{ uri: incident.author.avatar }}
                  className="h-6 w-6 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-6 w-6 items-center justify-center rounded-full bg-neutral-200">
                  <Ionicons name="person-outline" size={14} color="#6b7280" />
                </View>
              )}
              <Text className="text-sm text-neutral-600">
                <Text className="font-semibold">{incident.author.name || 'Usuário anônimo'}</Text>
              </Text>
            </View>
          </View>

          <Separator className="flex-1" />
          <Tabs value={value} onValueChange={setValue} className="w-full">
            <TabsList>
              <TabsTrigger value="infos">
                <Text className="text-sm text-neutral-700">Informações</Text>
              </TabsTrigger>
              <TabsTrigger value="messages">
                <Text className="text-sm text-neutral-700">Comentários</Text>
              </TabsTrigger>
              <TabsTrigger value="images">
                <Text className="text-sm text-neutral-700">Imagens</Text>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="infos" className="flex flex-col gap-4">
              {/* Endereço */}
              <View>
                <Text className="text-sm font-semibold text-neutral-700">Endereço</Text>
                <View className="flex flex-row items-center justify-between gap-2 rounded-lg bg-neutral-50 p-3">
                  <Ionicons name="location-outline" size={16} color="#78716c" />
                  <Text className="flex-1 text-sm text-neutral-700">
                    {incident.adress || 'N/A'}
                  </Text>
                  <Pressable
                    onPress={() => setShowAddressModal(true)}
                    className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <Ionicons name="create-outline" size={18} color="#fff" />
                  </Pressable>
                </View>
              </View>

              {/* Descricao */}
              <View>
                <Text className="text-sm font-semibold text-neutral-700">Descrição</Text>
                <View className="flex flex-row items-center justify-between gap-2 rounded-lg bg-neutral-50 p-3">
                  <Text className="flex-1 text-sm text-neutral-700">
                    {incident.description || 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Situação Atual */}
              <View>
                <Text className="text-sm font-semibold text-neutral-700">Situação atual</Text>
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
                        <Text className="text-sm font-medium text-red-700">
                          Ambulância a caminho
                        </Text>
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
                        <Text className="text-sm font-medium text-red-700">
                          Ambulância no local
                        </Text>
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
                        <Text className="text-sm font-medium text-orange-800">
                          Bombeiro a caminho
                        </Text>
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
                        <Text className="text-sm font-medium text-orange-50">
                          Bombeiro no local
                        </Text>
                        <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-orange-950">
                          <Text className="text-xs font-bold text-white">
                            {incident.situtation.firemen_on_site}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Resolvido */}
                    {(incident?.situtation?.situation_resolved ?? 0) > 0 && (
                      <View className="flex flex-row items-center gap-2 rounded-lg border border-green-500 bg-green-300 px-3 py-2">
                        <Ionicons name="checkmark-circle-outline" size={16} color="#15803d" />
                        <Text className="text-sm font-medium text-green-700">Resolvido</Text>
                        <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-green-900">
                          <Text className="text-xs font-bold text-white">
                            {incident.situtation.situation_resolved}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text className="text-sm text-neutral-600">Nenhuma situação atualizada.</Text>
                )}
              </View>
            </TabsContent>
            <TabsContent value="messages">
              <Comments incident={incident} disabled={isResolvedByAuthor} />
            </TabsContent>
            <TabsContent value="images">
              <Images incident={incident} disabled={isResolvedByAuthor} />
            </TabsContent>
          </Tabs>
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

      {/* Modal de Busca de Endereço */}
      <AddressModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        incident={incident}
      />

      {/* Modal de Confirmação de Deleção */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}>
        <Pressable
          onPress={() => setShowDeleteModal(false)}
          className="flex-1 items-center justify-center bg-black/50">
          <View className="relative mx-auto w-[75%] rounded-2xl bg-white p-6 shadow-2xl">
            {/* Botão X */}
            <Pressable
              onPress={() => setShowDeleteModal(false)}
              className="absolute right-2 top-2 z-10 h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
              <Ionicons name="close" size={20} color="#6b7280" />
            </Pressable>

            {/* Ícone de Alerta */}
            <View className="mb-4 items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <Ionicons name="trash" size={40} color="#dc2626" />
              </View>
            </View>

            {/* Título */}
            <Text className="mb-2 text-center text-xl font-bold text-neutral-900">
              Remover Ocorrência?
            </Text>

            {/* Mensagem */}
            <Text className="mb-6 text-center text-base text-neutral-600">
              Tem certeza que deseja remover esta ocorrência? Esta ação não pode ser desfeita.
            </Text>

            {/* Botões */}
            <View className="flex flex-row gap-3 py-2">
              <Pressable
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className={`flex-1 items-center justify-center rounded-lg border-2 border-neutral-300 bg-white py-3 ${
                  isDeleting ? 'opacity-50' : ''
                }`}>
                <Text className="text-base font-semibold text-neutral-700">Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteIncident}
                disabled={isDeleting}
                className={`flex-1 items-center justify-center rounded-lg py-3 ${
                  isDeleting ? 'bg-neutral-400' : 'bg-red-600'
                }`}>
                <Text className="text-base font-semibold text-white">
                  {isDeleting ? 'Removendo...' : 'Sim, Remover'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Toast de notificação */}
      <Toast message={toastMessage} visible={showToast} onHide={() => setShowToast(false)} />
    </BottomSheet>
  );
}
