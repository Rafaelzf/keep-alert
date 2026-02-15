import { useSession } from '@/components/auth/ctx';
import { storage, db } from '@/firebase/firebaseConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import * as ImagePicker from 'expo-image-picker';
import { INCIDENT_TYPES } from '@/constants/incidents';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Incident } from '@/types/incident';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, signOut, updateUserAvatar, updateUserProfile } = useSession();
  const insets = useSafeAreaInsets();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [showContestSheet, setShowContestSheet] = useState(false);
  const [showDefenceModal, setShowDefenceModal] = useState(false);
  const [falseIncidents, setFalseIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [defenceText, setDefenceText] = useState('');
  const [isSubmittingDefence, setIsSubmittingDefence] = useState(false);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [showMyIncidentsSheet, setShowMyIncidentsSheet] = useState(false);
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);
  const [loadingMyIncidents, setLoadingMyIncidents] = useState(false);
  const [incidentsCount, setIncidentsCount] = useState(0);
  const [hasMoreMyIncidents, setHasMoreMyIncidents] = useState(true);
  const [isLoadingMoreMyIncidents, setIsLoadingMoreMyIncidents] = useState(false);

  // Busca a contagem inicial de ocorrências do usuário
  useEffect(() => {
    async function fetchIncidentsCount() {
      if (!user?.uid) return;

      try {
        const incidentsRef = collection(db, 'incidents');
        const q = query(incidentsRef, where('author.uid', '==', user.uid));
        const snapshot = await getDocs(q);
        setIncidentsCount(snapshot.size);
      } catch (error) {
        console.error('[Profile] Erro ao buscar contagem de ocorrências:', error);
      }
    }

    fetchIncidentsCount();
  }, [user?.uid]);

  function handleCloseApp() {
    Alert.alert('Fechar Aplicativo', 'Deseja realmente fechar o aplicativo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Fechar',
        onPress: () => BackHandler.exitApp(),
        style: 'destructive',
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Encerrar Conta',
      'Tem certeza que deseja encerrar sua conta? Esta ação é permanente e não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar Conta',
          onPress: async () => {
            // TODO: Implementar lógica de encerramento de conta
            Alert.alert(
              'Em Desenvolvimento',
              'Funcionalidade de encerramento de conta será implementada em breve.'
            );
          },
          style: 'destructive',
        },
      ]
    );
  }

  function handleOpenEditProfile() {
    setEditName(user?.name || '');
    setEditPhone(user?.phoneNumber || '');
    setShowEditProfile(true);
  }

  async function handleSaveProfile() {
    try {
      if (!editName.trim()) {
        Alert.alert('Atenção', 'O nome não pode estar vazio');
        return;
      }

      setShowEditProfile(false);
      await updateUserProfile(editName.trim(), editPhone.trim());
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('[Profile] Erro ao salvar perfil:', error);
      Alert.alert('Erro', error.message || 'Não foi possível atualizar o perfil');
    }
  }

  async function handleOpenContest() {
    if (!user?.uid) return;

    setShowContestSheet(true);
    setLoadingIncidents(true);

    try {
      // Busca incidentes do usuário que foram marcados como falsa acusação
      const incidentsRef = collection(db, 'incidents');
      const q = query(
        incidentsRef,
        where('author.uid', '==', user.uid),
        where('situtation.false_accusation', '>=', 3)
      );

      const snapshot = await getDocs(q);
      const incidents: Incident[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        incidents.push({
          id: doc.id,
          category: data.category,
          description: data.description || '',
          author_ref: data.author_ref,
          author: data.author,
          location: data.location,
          status: data.status,
          created_at: data.created_at,
          situtation: data.situtation,
          adress: data.adress,
        });
      });

      // Ordena localmente por número de acusações (maior primeiro) e depois por data
      incidents.sort((a, b) => {
        const countDiff = b.situtation.false_accusation - a.situtation.false_accusation;
        if (countDiff !== 0) return countDiff;

        // Se tiverem o mesmo número de acusações, ordena por data (mais recente primeiro)
        const aTime = a.created_at && typeof a.created_at === 'object' && 'seconds' in a.created_at
          ? a.created_at.seconds
          : 0;
        const bTime = b.created_at && typeof b.created_at === 'object' && 'seconds' in b.created_at
          ? b.created_at.seconds
          : 0;
        return bTime - aTime;
      });

      setFalseIncidents(incidents);
    } catch (error: any) {
      console.error('[Profile] Erro ao buscar incidentes:', error);
      Alert.alert('Erro', 'Não foi possível carregar os incidentes');
    } finally {
      setLoadingIncidents(false);
    }
  }

  function handleSelectIncident(incident: Incident) {
    setSelectedIncident(incident);
    setDefenceText('');
    setShowDefenceModal(true);
  }

  async function handleSubmitDefence() {
    if (!defenceText.trim() || !selectedIncident || !user) {
      Alert.alert('Atenção', 'Por favor, escreva sua defesa');
      return;
    }

    setIsSubmittingDefence(true);
    try {
      const defenceRef = collection(db, 'incidents', selectedIncident.id, 'strike_defence');

      await addDoc(defenceRef, {
        user_id: user.uid,
        user_name: user.name,
        defence_text: defenceText.trim(),
        created_at: serverTimestamp(),
      });

      Alert.alert('Sucesso', 'Sua defesa foi enviada para análise');
      setShowDefenceModal(false);
      setDefenceText('');
      setSelectedIncident(null);
    } catch (error: any) {
      console.error('[Profile] Erro ao enviar defesa:', error);
      Alert.alert('Erro', 'Não foi possível enviar a defesa');
    } finally {
      setIsSubmittingDefence(false);
    }
  }

  const [lastMyIncidentDoc, setLastMyIncidentDoc] = useState<QueryDocumentSnapshot | null>(null);
  const MY_INCIDENTS_PAGE_SIZE = 10;

  // Função para obter ícone e cor do tipo de incidente
  function getIncidentIcon(category: string) {
    const incidentType = INCIDENT_TYPES.find((type) => type.id === category);
    return {
      icon: incidentType?.icon || 'alert-circle',
      color: incidentType?.color || '#6b7280',
    };
  }

  async function handleOpenMyIncidents() {
    if (!user?.uid) return;

    setShowMyIncidentsSheet(true);
    setLoadingMyIncidents(true);
    setMyIncidents([]);
    setLastMyIncidentDoc(null);
    setHasMoreMyIncidents(true);

    try {
      // Busca primeira página de ocorrências do usuário (ativas e inativas)
      const incidentsRef = collection(db, 'incidents');
      const q = query(
        incidentsRef,
        where('author.uid', '==', user.uid),
        orderBy('created_at', 'desc'),
        limit(MY_INCIDENTS_PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      const incidents: Incident[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        incidents.push({
          id: doc.id,
          category: data.category,
          description: data.description || '',
          author_ref: data.author_ref,
          author: data.author,
          location: data.location,
          status: data.status,
          created_at: data.created_at,
          situtation: data.situtation,
          adress: data.adress,
        });
      });

      setMyIncidents(incidents);
      setHasMoreMyIncidents(snapshot.docs.length === MY_INCIDENTS_PAGE_SIZE);

      if (snapshot.docs.length > 0) {
        setLastMyIncidentDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (error: any) {
      console.error('[Profile] Erro ao buscar minhas ocorrências:', error);
      Alert.alert('Erro', 'Não foi possível carregar as ocorrências');
    } finally {
      setLoadingMyIncidents(false);
    }
  }

  async function loadMoreMyIncidents() {
    if (!user?.uid || !lastMyIncidentDoc || !hasMoreMyIncidents || isLoadingMoreMyIncidents) {
      return;
    }

    setIsLoadingMoreMyIncidents(true);

    try {
      const incidentsRef = collection(db, 'incidents');
      const q = query(
        incidentsRef,
        where('author.uid', '==', user.uid),
        orderBy('created_at', 'desc'),
        startAfter(lastMyIncidentDoc),
        limit(MY_INCIDENTS_PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      const newIncidents: Incident[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        newIncidents.push({
          id: doc.id,
          category: data.category,
          description: data.description || '',
          author_ref: data.author_ref,
          author: data.author,
          location: data.location,
          status: data.status,
          created_at: data.created_at,
          situtation: data.situtation,
          adress: data.adress,
        });
      });

      setMyIncidents((prev) => [...prev, ...newIncidents]);
      setHasMoreMyIncidents(snapshot.docs.length === MY_INCIDENTS_PAGE_SIZE);

      if (snapshot.docs.length > 0) {
        setLastMyIncidentDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (error) {
      console.error('[Profile] Erro ao carregar mais ocorrências:', error);
    } finally {
      setIsLoadingMoreMyIncidents(false);
    }
  }

  function handleMyIncidentsScroll(event: any) {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;

    if (isCloseToBottom && hasMoreMyIncidents && !isLoadingMoreMyIncidents) {
      loadMoreMyIncidents();
    }
  }

  async function uploadAvatarToStorage(uri: string): Promise<string> {
    try {
      if (!user?.uid) throw new Error('Usuário não autenticado');

      // Converte URI para Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Cria referência no Storage
      const filename = `${user.uid}.jpg`;
      const storageRef = ref(storage, `avatar-users/${filename}`);

      // Upload com progresso
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.round(progress));
          },
          (error) => {
            console.error('[Avatar] Erro no upload:', error);
            reject(error);
          },
          async () => {
            // Upload completo - obter URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      throw error;
    }
  }

  async function saveAvatar(photoURL: string) {
    try {
      if (!user?.uid) throw new Error('Usuário não autenticado');

      // Usa a função do contexto que atualiza tanto Firestore quanto estado local
      await updateUserAvatar(photoURL);

      Alert.alert('Sucesso', 'Foto de perfil atualizada!');
    } catch (error: any) {
      console.error('[Avatar] Erro ao atualizar avatar:', error);
      throw error;
    }
  }

  async function handlePickImage() {
    try {
      setShowAvatarOptions(false);

      // Solicita permissão
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permissão Necessária', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }

      // Abre galeria
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Quadrado para avatar
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const downloadURL = await uploadAvatarToStorage(result.assets[0].uri);
        await saveAvatar(downloadURL);
      }
    } catch (error: any) {
      console.error('[Avatar] Erro ao escolher imagem:', error);
      Alert.alert('Erro', error.message || 'Não foi possível escolher a imagem');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleTakePhoto() {
    try {
      setShowAvatarOptions(false);

      // Solicita permissão da câmera
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permissão Necessária', 'Precisamos de permissão para usar a câmera.');
        return;
      }

      // Abre câmera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // Quadrado para avatar
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const downloadURL = await uploadAvatarToStorage(result.assets[0].uri);
        await saveAvatar(downloadURL);
      }
    } catch (error: any) {
      console.error('[Avatar] Erro ao tirar foto:', error);
      Alert.alert('Erro', error.message || 'Não foi possível tirar a foto');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleRemoveAvatar() {
    try {
      if (!user?.uid || !user?.photoURL) return;

      setShowAvatarOptions(false);

      Alert.alert('Remover Foto', 'Deseja remover sua foto de perfil?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploading(true);

              // Remove do Storage
              const filename = `${user.uid}.jpg`;
              const storageRef = ref(storage, `avatar-users/${filename}`);
              await deleteObject(storageRef);

              // Remove do Firestore e atualiza estado local
              await updateUserAvatar('');

              Alert.alert('Sucesso', 'Foto de perfil removida!');
            } catch (error: any) {
              console.error('[Avatar] Erro ao remover avatar:', error);
              Alert.alert('Erro', 'Não foi possível remover a foto');
            } finally {
              setIsUploading(false);
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error('[Avatar] Erro:', error);
    }
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="border-b border-neutral-200 bg-white px-4 pb-4">
        <Text className="mt-4 text-2xl font-bold text-neutral-900">Perfil</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4">
        {/* Card do usuário */}
        <View className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <View className="items-center gap-4 p-6">
            {/* Avatar - Clicável para editar */}
            <Pressable onPress={() => setShowAvatarOptions(true)} className="relative">
              {isUploading ? (
                <View className="h-24 w-24 items-center justify-center rounded-full bg-neutral-200">
                  <ActivityIndicator size="large" color="#7c3aed" />
                  <Text className="mt-2 text-xs text-neutral-600">{uploadProgress}%</Text>
                </View>
              ) : user?.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  className="h-24 w-24 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-24 w-24 items-center justify-center rounded-full bg-purple-100">
                  <Ionicons name="person" size={48} color="#7c3aed" />
                </View>
              )}

              {/* Ícone de editar */}
              <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-purple-600">
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </Pressable>

            {/* Nome */}
            <View className="items-center gap-1">
              <Text className="text-xl font-bold text-neutral-900">{user?.name}</Text>
              <Text className="text-sm text-neutral-600">{user?.email}</Text>
            </View>

            {/* Status */}
            <View className="flex flex-row items-center gap-2 rounded-full bg-green-100 px-4 py-2">
              <View className="h-2 w-2 rounded-full bg-green-600" />
              <Text className="text-sm font-semibold text-green-700">Conta Ativa</Text>
            </View>
          </View>
        </View>

        {/* Informações da conta */}
        <View className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <View className="border-b border-neutral-100 p-4">
            <Text className="font-semibold text-neutral-900">Informações da Conta</Text>
          </View>

          <View className="gap-0">
            {/* Telefone */}
            {user?.phoneNumber && (
              <View className="flex flex-row items-center gap-3 border-b border-neutral-100 p-4">
                <Ionicons name="call-outline" size={20} color="#6b7280" />
                <View className="flex-1">
                  <Text className="text-xs text-neutral-500">Telefone</Text>
                  <Text className="text-sm font-medium text-neutral-900">{user.phoneNumber}</Text>
                </View>
              </View>
            )}

            {/* Perímetro */}
            <View className="flex flex-row items-center gap-3 border-b border-neutral-100 p-4">
              <Ionicons name="location-outline" size={20} color="#6b7280" />
              <View className="flex-1">
                <Text className="text-xs text-neutral-500">Raio de Alerta</Text>
                <Text className="text-sm font-medium text-neutral-900">
                  {user?.perimeter_radius ? `${user.perimeter_radius}m` : 'Não definido'}
                </Text>
              </View>
            </View>

            {/* Notificações */}
            <View className="flex flex-row items-center gap-3 border-b border-neutral-100 p-4">
              <Ionicons name="notifications-outline" size={20} color="#6b7280" />
              <View className="flex-1">
                <Text className="text-xs text-neutral-500">Notificações</Text>
                <Text className="text-sm font-medium text-neutral-900">
                  {user?.alerts_notifications ? 'Ativadas' : 'Desativadas'}
                </Text>
              </View>
            </View>

            {/* Minhas Ocorrências */}
            <Pressable
              onPress={handleOpenMyIncidents}
              className="flex flex-row items-center gap-3 border-b border-neutral-100 p-4">
              <Ionicons name="alert-circle-outline" size={20} color="#6b7280" />
              <View className="flex-1">
                <Text className="text-xs text-neutral-500">Minhas Ocorrências</Text>
                <Text className="text-sm font-medium text-neutral-900">
                  {incidentsCount > 0 ? `${incidentsCount} reportada${incidentsCount !== 1 ? 's' : ''}` : 'Nenhuma ocorrência'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </Pressable>

            {/* Penalizações */}
            <Pressable
              onPress={user && user.strike_count > 0 ? handleOpenContest : undefined}
              className="flex flex-row items-center gap-3 border-b border-neutral-100 p-4">
              <Ionicons
                name="warning-outline"
                size={20}
                color={
                  user?.strike_count === 0
                    ? '#6b7280'
                    : user?.strike_count === 1
                      ? '#9ca3af'
                      : user?.strike_count === 2
                        ? '#f59e0b'
                        : '#ef4444'
                }
              />
              <View className="flex-1">
                <Text className="text-xs text-neutral-500">Penalizações Recebidas</Text>
                <Text
                  className={`text-sm font-medium ${
                    user?.strike_count === 0
                      ? 'text-neutral-900'
                      : user?.strike_count === 1
                        ? 'text-gray-600'
                        : user?.strike_count === 2
                          ? 'text-yellow-600'
                          : 'text-red-600'
                  }`}>
                  {user?.strike_count || 0} de 3
                </Text>
                {user?.strike_count === 2 && (
                  <Text className="mt-1 text-xs font-semibold text-yellow-600">
                    ⚠️ Só mais uma penalização e sua conta será banida
                  </Text>
                )}
              </View>
              {user && user.strike_count > 0 && (
                <View className="flex flex-row items-center gap-1">
                  <Ionicons name="shield-checkmark-outline" size={16} color="#7c3aed" />
                  <Text className="text-xs font-medium text-purple-600">Contestar</Text>
                </View>
              )}
            </Pressable>

            {/* Status da Conta */}
            <View className="flex flex-row items-center gap-3 p-4">
              <Ionicons
                name="shield-outline"
                size={20}
                color={
                  user?.status === 'active'
                    ? '#22c55e'
                    : user?.status === 'Banned'
                      ? '#ef4444'
                      : '#6b7280'
                }
              />
              <View className="flex-1">
                <Text className="text-xs text-neutral-500">Status da Conta</Text>
                <Text
                  className={`text-sm font-semibold ${
                    user?.status === 'active'
                      ? 'text-green-600'
                      : user?.status === 'Banned'
                        ? 'text-red-600'
                        : 'text-neutral-600'
                  }`}>
                  {user?.status === 'active'
                    ? 'Ativa'
                    : user?.status === 'Banned'
                      ? 'Banida'
                      : user?.status === 'inactive'
                        ? 'Inativa'
                        : 'Desconhecido'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ações */}
        <View className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <View className="border-b border-neutral-100 p-4">
            <Text className="font-semibold text-neutral-900">Ações</Text>
          </View>

          <View className="gap-0">
            {/* Editar Perfil */}
            <Pressable
              onPress={handleOpenEditProfile}
              className="flex flex-row items-center gap-3 border-b border-neutral-100 p-4">
              <Ionicons name="create-outline" size={20} color="#6b7280" />
              <Text className="flex-1 text-sm font-medium text-neutral-900">Editar Perfil</Text>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </Pressable>

            {/* Fechar Aplicativo */}
            <Pressable
              onPress={handleCloseApp}
              className="flex flex-row items-center gap-3 border-b border-neutral-100 p-4">
              <Ionicons name="exit-outline" size={20} color="#6b7280" />
              <Text className="flex-1 text-sm font-medium text-neutral-900">Fechar Aplicativo</Text>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </Pressable>

            {/* Encerrar Conta */}
            <Pressable onPress={handleDeleteAccount} className="flex flex-row items-center gap-3 p-4">
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text className="flex-1 text-sm font-medium text-red-600">Encerrar Minha Conta</Text>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </Pressable>
          </View>
        </View>

        {/* Padding bottom para a tab bar */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>

      {/* Modal de opções de avatar */}
      <Modal
        visible={showAvatarOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarOptions(false)}>
        <Pressable
          onPress={() => setShowAvatarOptions(false)}
          className="flex-1 items-center justify-center bg-black/50">
          <View className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6">
            <Text className="mb-4 text-center text-xl font-bold text-neutral-900">
              Foto de Perfil
            </Text>

            <View className="gap-3">
              {/* Tirar Foto */}
              <Pressable
                onPress={handleTakePhoto}
                className="flex flex-row items-center gap-3 rounded-lg border border-neutral-200 p-4">
                <Ionicons name="camera-outline" size={24} color="#7c3aed" />
                <Text className="flex-1 text-base font-medium text-neutral-900">Tirar Foto</Text>
              </Pressable>

              {/* Escolher da Galeria */}
              <Pressable
                onPress={handlePickImage}
                className="flex flex-row items-center gap-3 rounded-lg border border-neutral-200 p-4">
                <Ionicons name="images-outline" size={24} color="#7c3aed" />
                <Text className="flex-1 text-base font-medium text-neutral-900">
                  Escolher da Galeria
                </Text>
              </Pressable>

              {/* Remover Foto (só aparece se tiver foto) */}
              {user?.photoURL && (
                <Pressable
                  onPress={handleRemoveAvatar}
                  className="flex flex-row items-center gap-3 rounded-lg border border-red-200 p-4">
                  <Ionicons name="trash-outline" size={24} color="#ef4444" />
                  <Text className="flex-1 text-base font-medium text-red-600">Remover Foto</Text>
                </Pressable>
              )}

              {/* Cancelar */}
              <Pressable
                onPress={() => setShowAvatarOptions(false)}
                className="mt-2 rounded-lg bg-neutral-100 p-4">
                <Text className="text-center text-base font-medium text-neutral-700">
                  Cancelar
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Modal de editar perfil */}
      <Modal
        visible={showEditProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditProfile(false)}>
        <Pressable
          onPress={() => setShowEditProfile(false)}
          className="flex-1 items-center justify-center bg-black/50">
          <Pressable onPress={(e) => e.stopPropagation()} className="mx-4 w-full max-w-sm">
            <View className="rounded-2xl bg-white p-6">
              <Text className="mb-6 text-center text-xl font-bold text-neutral-900">
                Editar Perfil
              </Text>

              <View className="gap-4">
                {/* Campo Nome */}
                <View className="gap-2">
                  <Text className="text-sm font-medium text-neutral-700">Nome</Text>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Seu nome"
                    className="rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {/* Campo Telefone */}
                <View className="gap-2">
                  <Text className="text-sm font-medium text-neutral-700">Telefone</Text>
                  <TextInput
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="(00) 00000-0000"
                    keyboardType="phone-pad"
                    className="rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {/* Botões */}
                <View className="mt-2 gap-3">
                  <Pressable
                    onPress={handleSaveProfile}
                    className="rounded-lg bg-purple-600 p-4">
                    <Text className="text-center text-base font-semibold text-white">
                      Salvar Alterações
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setShowEditProfile(false)}
                    className="rounded-lg bg-neutral-100 p-4">
                    <Text className="text-center text-base font-medium text-neutral-700">
                      Cancelar
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Bottom Sheet de Contestação */}
      <Modal
        visible={showContestSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContestSheet(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <Pressable
            className="flex-1"
            onPress={() => setShowContestSheet(false)}
          />
          <View className="h-[75%] rounded-t-3xl bg-white">
            {/* Header */}
            <View className="border-b border-neutral-200 p-4">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xl font-bold text-neutral-900">Contestar Penalizações</Text>
                <Pressable onPress={() => setShowContestSheet(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </Pressable>
              </View>
              <Text className="mt-1 text-sm text-neutral-600">
                Selecione o incidente que deseja contestar
              </Text>
            </View>

            {/* Lista de incidentes */}
            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={true}>
              {loadingIncidents ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#7c3aed" />
                  <Text className="mt-2 text-sm text-neutral-600">Carregando...</Text>
                </View>
              ) : falseIncidents.length === 0 ? (
                <View className="items-center py-8">
                  <Ionicons name="checkmark-circle-outline" size={48} color="#22c55e" />
                  <Text className="mt-2 text-center text-base font-medium text-neutral-900">
                    Nenhum incidente para contestar
                  </Text>
                  <Text className="mt-1 text-center text-sm text-neutral-600">
                    Você não possui incidentes marcados como falsa acusação
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {falseIncidents.map((incident) => (
                    <Pressable
                      key={incident.id}
                      onPress={() => handleSelectIncident(incident)}
                      className="rounded-xl border border-neutral-200 bg-white p-4">
                      <View className="flex flex-row items-start gap-3">
                        <View className="rounded-full bg-red-100 p-2">
                          <Ionicons name="warning" size={20} color="#ef4444" />
                        </View>
                        <View className="flex-1">
                          <Text className="font-semibold text-neutral-900">
                            {incident.category}
                          </Text>
                          {incident.description && (
                            <Text className="mt-1 text-sm text-neutral-600" numberOfLines={2}>
                              {incident.description}
                            </Text>
                          )}
                          <Text className="mt-2 text-xs text-red-600">
                            {incident.situtation.false_accusation} votos de falsa acusação
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Sheet de Minhas Ocorrências */}
      <Modal
        visible={showMyIncidentsSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMyIncidentsSheet(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <Pressable className="flex-1" onPress={() => setShowMyIncidentsSheet(false)} />
          <View className="h-[75%] rounded-t-3xl bg-white">
            {/* Header */}
            <View className="border-b border-neutral-200 p-4">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xl font-bold text-neutral-900">Minhas Ocorrências</Text>
                <Pressable onPress={() => setShowMyIncidentsSheet(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </Pressable>
              </View>
              <Text className="mt-1 text-sm text-neutral-600">
                {`${myIncidents.length} ocorrência${myIncidents.length !== 1 ? 's' : ''} reportada${myIncidents.length !== 1 ? 's' : ''}`}
              </Text>
            </View>

            {/* Lista de ocorrências */}
            <ScrollView
              className="flex-1 p-4"
              showsVerticalScrollIndicator={true}
              onScroll={handleMyIncidentsScroll}
              scrollEventThrottle={400}
              contentContainerStyle={{ paddingBottom: 80 }}>
              {loadingMyIncidents ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#7c3aed" />
                  <Text className="mt-2 text-sm text-neutral-600">Carregando...</Text>
                </View>
              ) : myIncidents.length === 0 ? (
                <View className="items-center py-8">
                  <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
                  <Text className="mt-2 text-center text-base font-medium text-neutral-900">
                    Nenhuma ocorrência reportada
                  </Text>
                  <Text className="mt-1 text-center text-sm text-neutral-600">
                    Você ainda não reportou nenhuma ocorrência
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {myIncidents.map((incident) => {
                    const { icon, color } = getIncidentIcon(incident.category);
                    return (
                      <View
                        key={incident.id}
                        className="rounded-xl border border-neutral-200 bg-white p-4">
                        <View className="flex flex-row items-start gap-3">
                          <View
                            className="rounded-full p-2"
                            style={{ backgroundColor: `${color}20` }}>
                            <FontAwesome6 name={icon as any} size={20} color={color} />
                          </View>
                        <View className="flex-1">
                          <View className="flex flex-row items-center justify-between">
                            <Text className="font-semibold text-neutral-900">
                              {incident.category}
                            </Text>
                            <View
                              className={`rounded-full px-2 py-1 ${
                                incident.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                              }`}>
                              <Text
                                className={`text-xs font-semibold ${
                                  incident.status === 'active' ? 'text-green-700' : 'text-gray-600'
                                }`}>
                                {incident.status === 'active' ? 'Ativa' : 'Inativa'}
                              </Text>
                            </View>
                          </View>

                          {incident.description && (
                            <Text className="mt-1 text-sm text-neutral-600" numberOfLines={2}>
                              {incident.description}
                            </Text>
                          )}

                          {incident.adress && (
                            <View className="mt-2 flex flex-row items-center gap-1">
                              <Ionicons name="location-outline" size={14} color="#9ca3af" />
                              <Text className="flex-1 text-xs text-neutral-500" numberOfLines={1}>
                                {incident.adress}
                              </Text>
                            </View>
                          )}

                          {/* Estatísticas da ocorrência */}
                          {incident.situtation && (
                            <View className="mt-3 flex flex-row gap-2">
                              {incident.situtation.false_accusation > 0 && (
                                <View className="flex flex-row items-center gap-1 rounded-full bg-red-50 px-2 py-1">
                                  <Ionicons name="warning" size={12} color="#ef4444" />
                                  <Text className="text-xs text-red-600">
                                    {incident.situtation.false_accusation} falsa
                                    {incident.situtation.false_accusation !== 1 ? 's' : ''}
                                  </Text>
                                </View>
                              )}
                              {incident.situtation.situation_resolved > 0 && (
                                <View className="flex flex-row items-center gap-1 rounded-full bg-green-50 px-2 py-1">
                                  <Ionicons name="checkmark" size={12} color="#22c55e" />
                                  <Text className="text-xs text-green-600">
                                    {incident.situtation.situation_resolved} resolvida
                                    {incident.situtation.situation_resolved !== 1 ? 's' : ''}
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}

                          <Text className="mt-2 text-xs text-neutral-400">
                            {incident.created_at &&
                            typeof incident.created_at === 'object' &&
                            'seconds' in incident.created_at
                              ? new Date(incident.created_at.seconds * 1000).toLocaleDateString(
                                  'pt-BR',
                                  {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )
                              : 'Data não disponível'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    );
                  })}

                  {/* Loading indicator para scroll infinito */}
                  {isLoadingMoreMyIncidents && (
                    <View className="items-center py-4">
                      <ActivityIndicator size="small" color="#7c3aed" />
                      <Text className="mt-2 text-xs text-neutral-600">Carregando mais...</Text>
                    </View>
                  )}

                  {/* Mensagem de fim */}
                  {!hasMoreMyIncidents && myIncidents.length > 0 && (
                    <View className="items-center pb-8 pt-4">
                      <Text className="text-xs text-neutral-500">
                        Todas as ocorrências foram carregadas
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Defesa */}
      <Modal
        visible={showDefenceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDefenceModal(false)}>
        <Pressable
          onPress={() => setShowDefenceModal(false)}
          className="flex-1 items-center justify-center bg-black/50">
          <Pressable onPress={(e) => e.stopPropagation()} className="mx-4 w-full max-w-sm">
            <View className="rounded-2xl bg-white p-6">
              <Text className="mb-4 text-center text-xl font-bold text-neutral-900">
                Escreva sua Defesa
              </Text>

              <Text className="mb-4 text-sm text-neutral-600">
                Explique por que você acredita que este incidente não é uma falsa acusação. Sua
                defesa será analisada pela equipe.
              </Text>

              <TextInput
                value={defenceText}
                onChangeText={setDefenceText}
                placeholder="Digite sua defesa aqui..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900"
                placeholderTextColor="#9ca3af"
              />

              <View className="mt-4 gap-3">
                <Pressable
                  onPress={handleSubmitDefence}
                  disabled={isSubmittingDefence}
                  className="rounded-lg bg-purple-600 p-4"
                  style={{ opacity: isSubmittingDefence ? 0.5 : 1 }}>
                  {isSubmittingDefence ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-center text-base font-semibold text-white">
                      Enviar Defesa
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => setShowDefenceModal(false)}
                  disabled={isSubmittingDefence}
                  className="rounded-lg bg-neutral-100 p-4">
                  <Text className="text-center text-base font-medium text-neutral-700">
                    Cancelar
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
