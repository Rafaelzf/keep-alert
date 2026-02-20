import { useSession } from '@/components/auth/ctx';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Linking } from 'react-native';
import { Comments } from '@/components/incident-details/Comments';
import { Images } from '@/components/incident-details/Images';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { Toast } from '@/components/ui/toast';
import { getTimeAgo } from '@/lib/date';
import { useIncidents } from '@/components/incidents/ctx';
import { UserStatus } from '@/types/user';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import { INCIDENT_TYPES } from '@/constants/incidents';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
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
  TextInput,
  View,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProfileScreen() {
  const { user, signOut, updateUserAvatar, updateUserProfile } = useSession();
  const router = useRouter();
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
  const [selectedMyIncident, setSelectedMyIncident] = useState<Incident | null>(null);
  const [myIncidentTab, setMyIncidentTab] = useState('infos');
  const [showDeleteMyIncidentModal, setShowDeleteMyIncidentModal] = useState(false);
  const [isDeletingMyIncident, setIsDeletingMyIncident] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isActivatingAccount, setIsActivatingAccount] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [locationPermission, setLocationPermission] = useState<string>('');
  const [cameraPermission, setCameraPermission] = useState<string>('');
  const slideAnim = useSharedValue(0);

  // Busca a contagem inicial de ocorrências do usuário
  useEffect(() => {
    async function fetchIncidentsCount() {
      if (!user?.uid) return;

      try {
        const snapshot = await firestore()
          .collection('incidents')
          .where('author.uid', '==', user.uid)
          .get();
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

  async function handleOpenSettings() {
    setShowSettingsModal(true);
    await checkPermissions();
  }

  async function checkPermissions() {
    // Verifica permissão de localização
    const locationStatus = await Location.getForegroundPermissionsAsync();
    setLocationPermission(locationStatus.granted ? 'granted' : 'denied');

    // Verifica permissão de câmera
    const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
    setCameraPermission(cameraStatus.granted ? 'granted' : 'denied');
  }

  async function handleRequestLocationPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted' ? 'granted' : 'denied');

    if (status === 'denied') {
      Alert.alert(
        'Permissão Negada',
        'Para habilitar a localização, vá em Configurações do dispositivo > keep-alert > Permissões > Localização',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configurações', onPress: () => Linking.openSettings() },
        ]
      );
    } else {
      Alert.alert('Sucesso', 'Permissão de localização concedida!');
    }
  }

  async function handleRequestCameraPermission() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted' ? 'granted' : 'denied');

    if (status === 'denied') {
      Alert.alert(
        'Permissão Negada',
        'Para habilitar a câmera, vá em Configurações do dispositivo > keep-alert > Permissões > Câmera',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configurações', onPress: () => Linking.openSettings() },
        ]
      );
    } else {
      Alert.alert('Sucesso', 'Permissão de câmera concedida!');
    }
  }

  function handleDeleteAccount() {
    setShowDeleteAccountModal(true);
  }

  async function handleConfirmDeleteAccount() {
    if (!user?.uid) return;

    setIsDeletingAccount(true);
    try {
      // Atualiza o status do usuário para INACTIVE
      const userRef = firestore().collection('users').doc(user.uid);
      await userRef.update({
        status: UserStatus.INACTIVE,
        updated_at: firestore.FieldValue.serverTimestamp(),
      });

      // Busca todas as ocorrências do usuário
      const snapshot = await firestore()
        .collection('incidents')
        .where('author.uid', '==', user.uid)
        .get();

      // Atualiza todas as ocorrências para inativas usando batch
      const batch = firestore().batch();
      snapshot.docs.forEach((docSnapshot) => {
        batch.update(docSnapshot.ref, {
          status: 'inactive',
          updated_at: firestore.FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();

      // Fecha o modal
      setShowDeleteAccountModal(false);

      // Mostra toast de sucesso
      setToastMessage(`Conta encerrada com sucesso! ${snapshot.size} ocorrência(s) desativada(s).`);
      setShowToast(true);

      // Aguarda um pouco e desloga o usuário
      setTimeout(() => {
        signOut();
      }, 2000);
    } catch (error: any) {
      console.error('[Profile] Erro ao encerrar conta:', error);
      setToastMessage(error.message || 'Não foi possível encerrar a conta');
      setShowToast(true);
    } finally {
      setIsDeletingAccount(false);
    }
  }

  async function handleActivateAccount() {
    if (!user?.uid) return;

    setIsActivatingAccount(true);
    try {
      // Atualiza o status do usuário para ACTIVE
      const userRef = firestore().collection('users').doc(user.uid);
      await userRef.update({
        status: UserStatus.ACTIVE,
        updated_at: firestore.FieldValue.serverTimestamp(),
      });

      // Força atualização do estado local do usuário
      // Atualiza a propriedade status diretamente no objeto user (gambiarra temporária)
      if (user) {
        user.status = UserStatus.ACTIVE;
      }

      // Mostra toast de sucesso
      setToastMessage('Conta reativada com sucesso!');
      setShowToast(true);

      // Aguarda um pouco e redireciona para o mapa
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
    } catch (error: any) {
      console.error('[Profile] Erro ao reativar conta:', error);
      setToastMessage(error.message || 'Não foi possível reativar a conta');
      setShowToast(true);
    } finally {
      setIsActivatingAccount(false);
    }
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
      const snapshot = await firestore()
        .collection('incidents')
        .where('author.uid', '==', user.uid)
        .where('situtation.false_accusation', '>=', 3)
        .get();
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
      const defenceRef = firestore()
        .collection('incidents')
        .doc(selectedIncident.id)
        .collection('strike_defence');

      await defenceRef.add({
        user_id: user.uid,
        user_name: user.name,
        defence_text: defenceText.trim(),
        created_at: firestore.FieldValue.serverTimestamp(),
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

  const [lastMyIncidentDoc, setLastMyIncidentDoc] = useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
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
    setSelectedMyIncident(null);
    slideAnim.value = 0;

    try {
      // Busca a contagem total atualizada
      const countSnapshot = await firestore()
        .collection('incidents')
        .where('author.uid', '==', user.uid)
        .get();
      setIncidentsCount(countSnapshot.size);

      // Busca primeira página de ocorrências do usuário (ativas e inativas)
      const snapshot = await firestore()
        .collection('incidents')
        .where('author.uid', '==', user.uid)
        .orderBy('created_at', 'desc')
        .limit(MY_INCIDENTS_PAGE_SIZE)
        .get();
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
      const snapshot = await firestore()
        .collection('incidents')
        .where('author.uid', '==', user.uid)
        .orderBy('created_at', 'desc')
        .startAfter(lastMyIncidentDoc)
        .limit(MY_INCIDENTS_PAGE_SIZE)
        .get();
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

  function handleSelectMyIncident(incident: Incident) {
    setSelectedMyIncident(incident);
    setMyIncidentTab('infos');
    slideAnim.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }

  function handleBackToMyIncidentsList() {
    slideAnim.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
    setTimeout(() => setSelectedMyIncident(null), 300);
  }

  const listAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: slideAnim.value * -SCREEN_WIDTH }],
    };
  });

  const detailsAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: (1 - slideAnim.value) * SCREEN_WIDTH }],
    };
  });

  async function handleDeleteMyIncident() {
    if (!selectedMyIncident) return;

    setIsDeletingMyIncident(true);
    try {
      // Deleta permanentemente a ocorrência do Firestore
      const incidentRef = firestore().collection('incidents').doc(selectedMyIncident.id);
      await incidentRef.delete();

      // Atualiza a contagem
      setIncidentsCount((prev) => prev - 1);

      // Remove da lista local
      setMyIncidents((prev) => prev.filter((inc) => inc.id !== selectedMyIncident.id));

      // Fecha todos os modais/sheets primeiro
      setShowDeleteMyIncidentModal(false);
      handleBackToMyIncidentsList();

      // Aguarda um pouco para os modais fecharem completamente
      setTimeout(() => {
        setShowMyIncidentsSheet(false);
      }, 100);

      // Aguarda os sheets fecharem e então mostra o toast
      setTimeout(() => {
        setToastMessage('Ocorrência removida com sucesso!');
        setShowToast(true);
      }, 400);
    } catch (error: any) {
      console.error('[Profile] Erro ao deletar ocorrência:', error);

      // Fecha modais mesmo em caso de erro
      setShowDeleteMyIncidentModal(false);

      setTimeout(() => {
        setShowMyIncidentsSheet(false);
      }, 100);

      // Mostra toast de erro após fechar
      setTimeout(() => {
        setToastMessage(error.message || 'Não foi possível remover a ocorrência');
        setShowToast(true);
      }, 400);
    } finally {
      setIsDeletingMyIncident(false);
    }
  }

  async function uploadAvatarToStorage(uri: string): Promise<string> {
    try {
      if (!user?.uid) throw new Error('Usuário não autenticado');

      // Cria referência no Storage
      const filename = `${user.uid}.jpg`;
      const storageRef = storage().ref(`avatar-users/${filename}`);

      // Upload com progresso
      const uploadTask = storageRef.putFile(uri);

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
            const downloadURL = await storageRef.getDownloadURL();
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
              const storageRef = storage().ref(`avatar-users/${filename}`);
              await storageRef.delete();

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
            <View className="flex flex-row items-center gap-2">
              <View
                className={`flex flex-row items-center gap-2 rounded-full px-4 py-2 ${
                  user?.status === UserStatus.ACTIVE ? 'bg-green-100' : 'bg-red-100'
                }`}>
                <View
                  className={`h-2 w-2 rounded-full ${
                    user?.status === UserStatus.ACTIVE ? 'bg-green-600' : 'bg-red-600'
                  }`}
                />
                <Text
                  className={`text-sm font-semibold ${
                    user?.status === UserStatus.ACTIVE ? 'text-green-700' : 'text-red-700'
                  }`}>
                  {user?.status === UserStatus.ACTIVE ? 'Conta Ativa' : 'Conta Inativa'}
                </Text>
              </View>

              {/* Botão Ativar Conta */}
              {user?.status === UserStatus.INACTIVE && (
                <Pressable
                  onPress={handleActivateAccount}
                  disabled={isActivatingAccount}
                  className={`rounded-full px-4 py-2 ${
                    isActivatingAccount ? 'bg-neutral-300' : 'bg-green-600'
                  }`}>
                  <Text className="text-sm font-semibold text-white">
                    {isActivatingAccount ? 'Ativando...' : 'Ativar Conta'}
                  </Text>
                </Pressable>
              )}
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
                    : user?.strike_count <= 2
                      ? '#9ca3af'
                      : user?.strike_count <= 4
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
                      : user?.strike_count <= 2
                        ? 'text-gray-600'
                        : user?.strike_count <= 4
                          ? 'text-yellow-600'
                          : 'text-red-600'
                  }`}>
                  {user?.strike_count || 0} de 6
                </Text>
                {user?.strike_count === 5 && (
                  <Text className="mt-1 text-xs font-semibold text-red-600">
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

            {/* Configurações */}
            <Pressable
              onPress={handleOpenSettings}
              className="flex flex-row items-center gap-3 border-b border-neutral-100 p-4">
              <Ionicons name="settings-outline" size={20} color="#6b7280" />
              <Text className="flex-1 text-sm font-medium text-neutral-900">Configurações</Text>
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

            {/* Deslogar */}
            <Pressable
              onPress={signOut}
              className="flex flex-row items-center gap-3 border-b border-neutral-100 p-4">
              <Ionicons name="log-out-outline" size={20} color="#6b7280" />
              <Text className="flex-1 text-sm font-medium text-neutral-900">Deslogar</Text>
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
          <View className="h-[75%] rounded-t-3xl bg-white overflow-hidden">
            <View className="flex-1 flex-row">
              {/* Lista de ocorrências */}
              <Animated.View style={[{ width: '100%' }, listAnimatedStyle]}>
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
                        const incidentType = INCIDENT_TYPES.find((type) => type.id === incident.category);
                        const label = incidentType?.label || incident.category;

                        // Verifica se foi resolvida pelo autor
                        const isResolvedByAuthor = (incident.situtation?.situation_resolved ?? 0) > 0;

                        // Define status e estilo
                        const statusConfig = isResolvedByAuthor
                          ? { label: 'Resolvida', bgClass: 'bg-blue-100', textClass: 'text-blue-700' }
                          : incident.status === 'active'
                          ? { label: 'Ativa', bgClass: 'bg-green-100', textClass: 'text-green-700' }
                          : { label: 'Inativa', bgClass: 'bg-gray-100', textClass: 'text-gray-600' };

                        return (
                          <Pressable
                            key={incident.id}
                            onPress={() => handleSelectMyIncident(incident)}
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
                                    {label}
                                  </Text>
                                  <View className={`rounded-full px-2 py-1 ${statusConfig.bgClass}`}>
                                    <Text className={`text-xs font-semibold ${statusConfig.textClass}`}>
                                      {statusConfig.label}
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
                              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                            </View>
                          </Pressable>
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
              </Animated.View>

              {/* Detalhes da ocorrência */}
              {selectedMyIncident && (() => {
                const { icon, color } = getIncidentIcon(selectedMyIncident.category);
                const incidentType = INCIDENT_TYPES.find((type) => type.id === selectedMyIncident.category);
                const label = incidentType?.label || selectedMyIncident.category;

                // Calcula tempo desde criação
                const createdAt =
                  selectedMyIncident.created_at && 'seconds' in selectedMyIncident.created_at
                    ? new Date(selectedMyIncident.created_at.seconds * 1000)
                    : new Date();
                const timeAgo = getTimeAgo(createdAt);

                // Verifica se tem estatísticas
                const hasStats =
                  selectedMyIncident.situtation &&
                  (selectedMyIncident.situtation.police_on_way > 0 ||
                    selectedMyIncident.situtation.ambulance_on_way > 0 ||
                    selectedMyIncident.situtation.firemen_on_way > 0 ||
                    selectedMyIncident.situtation.police_on_site > 0 ||
                    selectedMyIncident.situtation.ambulance_on_site > 0 ||
                    selectedMyIncident.situtation.firemen_on_site > 0 ||
                    selectedMyIncident.situtation.situation_resolved > 0);

                return (
                  <Animated.View
                    style={[
                      {
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        backgroundColor: 'white',
                      },
                      detailsAnimatedStyle,
                    ]}>
                    {/* Header dos detalhes */}
                    <View className="border-b border-neutral-200 p-4">
                      <View className="flex flex-row items-center gap-3">
                        <Pressable onPress={handleBackToMyIncidentsList}>
                          <Ionicons name="arrow-back" size={24} color="#6b7280" />
                        </Pressable>
                        <Text className="flex-1 text-xl font-bold text-neutral-900">Detalhes</Text>
                        <Pressable onPress={() => setShowMyIncidentsSheet(false)}>
                          <Ionicons name="close" size={24} color="#6b7280" />
                        </Pressable>
                      </View>
                    </View>

                    <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                      {/* Header com ícone e status */}
                      <View className="mb-4 flex flex-row items-center justify-between">
                        <View className="flex flex-row items-center gap-3">
                          <View
                            className="h-12 w-12 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${color}20` }}>
                            <FontAwesome6 name={icon as any} size={20} color={color} />
                          </View>
                          <Text className="text-base font-bold" style={{ color }}>
                            {label}
                          </Text>
                        </View>

                        <View className="flex flex-row items-center gap-2">
                          <View
                            className={`rounded-lg px-3 py-1 ${
                              (selectedMyIncident.situtation?.situation_resolved ?? 0) > 0
                                ? 'bg-blue-600'
                                : selectedMyIncident.status === 'active'
                                ? 'bg-green-600'
                                : 'bg-gray-500'
                            }`}>
                            <Text className="text-xs font-bold text-white">
                              {(selectedMyIncident.situtation?.situation_resolved ?? 0) > 0
                                ? 'Resolvido'
                                : selectedMyIncident.status === 'active'
                                ? 'Ativo'
                                : 'Inativo'}
                            </Text>
                          </View>

                          {/* Botão Deletar */}
                          <Pressable
                            onPress={() => setShowDeleteMyIncidentModal(true)}
                            className="h-8 w-8 items-center justify-center rounded-full bg-red-100">
                            <Ionicons name="trash-outline" size={18} color="#dc2626" />
                          </Pressable>
                        </View>
                      </View>

                      <Separator className="mb-4" />

                      {/* Info: Tempo e Autor */}
                      <View className="mb-4 gap-1">
                        <View className="flex flex-row items-center gap-2">
                          <Ionicons name="time-outline" size={14} color="#6b7280" />
                          <Text className="text-sm text-neutral-600">
                            <Text className="font-semibold">{timeAgo}</Text>
                          </Text>
                        </View>
                        <View className="flex flex-row items-center gap-2">
                          {selectedMyIncident.author.avatar ? (
                            <Image
                              source={{ uri: selectedMyIncident.author.avatar }}
                              className="h-6 w-6 rounded-full"
                              resizeMode="cover"
                            />
                          ) : (
                            <View className="h-6 w-6 items-center justify-center rounded-full bg-neutral-200">
                              <Ionicons name="person-outline" size={14} color="#6b7280" />
                            </View>
                          )}
                          <Text className="text-sm text-neutral-600">
                            <Text className="font-semibold">
                              {selectedMyIncident.author.name || 'Usuário anônimo'}
                            </Text>
                          </Text>
                        </View>
                      </View>

                      <Separator className="mb-4" />

                      {/* Tabs */}
                      <Tabs value={myIncidentTab} onValueChange={setMyIncidentTab} className="w-full">
                        <TabsList>
                          <TabsTrigger value="infos">
                            <Text>Informações</Text>
                          </TabsTrigger>
                          <TabsTrigger value="messages">
                            <Text>Comentários</Text>
                          </TabsTrigger>
                          <TabsTrigger value="images">
                            <Text>Imagens</Text>
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="infos" className="mt-4 flex flex-col gap-4">
                          {/* Endereço */}
                          <View>
                            <Text className="text-sm font-semibold text-neutral-700">Endereço</Text>
                            <View className="mt-1 flex flex-row items-center gap-2 rounded-lg bg-neutral-50 p-3">
                              <Ionicons name="location-outline" size={16} color="#78716c" />
                              <Text className="flex-1 text-sm text-neutral-700">
                                {selectedMyIncident.adress || 'N/A'}
                              </Text>
                            </View>
                          </View>

                          {/* Descrição */}
                          <View>
                            <Text className="text-sm font-semibold text-neutral-700">Descrição</Text>
                            <View className="mt-1 rounded-lg bg-neutral-50 p-3">
                              <Text className="text-sm text-neutral-700">
                                {selectedMyIncident.description || 'N/A'}
                              </Text>
                            </View>
                          </View>

                          {/* Situação Atual */}
                          <View>
                            <Text className="text-sm font-semibold text-neutral-700">Situação atual</Text>
                            {hasStats ? (
                              <View className="mt-1 flex flex-row flex-wrap gap-2">
                                {/* Polícia a caminho */}
                                {(selectedMyIncident.situtation.police_on_way ?? 0) > 0 && (
                                  <View className="flex flex-row items-center gap-2 rounded-lg border border-blue-500 bg-blue-300 px-3 py-2">
                                    <Ionicons name="car-outline" size={16} color="#1d4ed8" />
                                    <Text className="text-sm font-medium text-blue-700">
                                      Polícia a caminho
                                    </Text>
                                    <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-blue-900">
                                      <Text className="text-xs font-bold text-white">
                                        {selectedMyIncident.situtation.police_on_way}
                                      </Text>
                                    </View>
                                  </View>
                                )}

                                {/* Polícia no local */}
                                {(selectedMyIncident.situtation.police_on_site ?? 0) > 0 && (
                                  <View className="flex flex-row items-center gap-2 rounded-lg border border-blue-900 bg-blue-500 px-3 py-2">
                                    <MaterialIcons name="local-police" size={16} color="#fff" />
                                    <Text className="text-sm font-medium text-white">
                                      Polícia no local
                                    </Text>
                                    <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-blue-900">
                                      <Text className="text-xs font-bold text-white">
                                        {selectedMyIncident.situtation.police_on_site}
                                      </Text>
                                    </View>
                                  </View>
                                )}

                                {/* Ambulância a caminho */}
                                {(selectedMyIncident.situtation.ambulance_on_way ?? 0) > 0 && (
                                  <View className="flex flex-row items-center gap-2 rounded-lg border border-red-700 bg-red-400 px-3 py-2">
                                    <FontAwesome5 name="ambulance" size={12} color="#b91c1c" />
                                    <Text className="text-sm font-medium text-red-700">
                                      Ambulância a caminho
                                    </Text>
                                    <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-red-700">
                                      <Text className="text-xs font-bold text-white">
                                        {selectedMyIncident.situtation.ambulance_on_way}
                                      </Text>
                                    </View>
                                  </View>
                                )}

                                {/* Ambulância no local */}
                                {(selectedMyIncident.situtation.ambulance_on_site ?? 0) > 0 && (
                                  <View className="flex flex-row items-center gap-2 rounded-lg border border-red-700 px-3 py-2">
                                    <Ionicons name="medkit-outline" size={16} color="#b91c1c" />
                                    <Text className="text-sm font-medium text-red-700">
                                      Ambulância no local
                                    </Text>
                                    <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-red-700">
                                      <Text className="text-xs font-bold text-white">
                                        {selectedMyIncident.situtation.ambulance_on_site}
                                      </Text>
                                    </View>
                                  </View>
                                )}

                                {/* Bombeiro a caminho */}
                                {(selectedMyIncident.situtation.firemen_on_way ?? 0) > 0 && (
                                  <View className="flex flex-row items-center gap-2 rounded-lg border border-orange-500 bg-orange-300 px-3 py-2">
                                    <Ionicons name="flame-outline" size={16} color="#ea580c" />
                                    <Text className="text-sm font-medium text-orange-800">
                                      Bombeiro a caminho
                                    </Text>
                                    <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-orange-900">
                                      <Text className="text-xs font-bold text-white">
                                        {selectedMyIncident.situtation.firemen_on_way}
                                      </Text>
                                    </View>
                                  </View>
                                )}

                                {/* Bombeiro no local */}
                                {(selectedMyIncident.situtation.firemen_on_site ?? 0) > 0 && (
                                  <View className="flex flex-row items-center gap-2 rounded-lg border border-orange-700 bg-orange-500 px-3 py-2">
                                    <Ionicons name="flame" size={16} color="#fed7aa" />
                                    <Text className="text-sm font-medium text-orange-50">
                                      Bombeiro no local
                                    </Text>
                                    <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-orange-950">
                                      <Text className="text-xs font-bold text-white">
                                        {selectedMyIncident.situtation.firemen_on_site}
                                      </Text>
                                    </View>
                                  </View>
                                )}

                                {/* Resolvido */}
                                {(selectedMyIncident.situtation.situation_resolved ?? 0) > 0 && (
                                  <View className="flex flex-row items-center gap-2 rounded-lg border border-green-500 bg-green-300 px-3 py-2">
                                    <Ionicons name="checkmark-circle-outline" size={16} color="#15803d" />
                                    <Text className="text-sm font-medium text-green-700">Resolvido</Text>
                                    <View className="ml-1 h-5 w-5 items-center justify-center rounded-full bg-green-900">
                                      <Text className="text-xs font-bold text-white">
                                        {selectedMyIncident.situtation.situation_resolved}
                                      </Text>
                                    </View>
                                  </View>
                                )}
                              </View>
                            ) : (
                              <Text className="mt-1 text-sm text-neutral-600">
                                Nenhuma situação atualizada.
                              </Text>
                            )}
                          </View>
                        </TabsContent>

                        <TabsContent value="messages" className="mt-4">
                          <Comments incident={selectedMyIncident} />
                        </TabsContent>

                        <TabsContent value="images" className="mt-4">
                          <Images incident={selectedMyIncident} />
                        </TabsContent>
                      </Tabs>
                    </ScrollView>
                  </Animated.View>
                );
              })()}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação de Deleção da Minha Ocorrência */}
      <Modal
        visible={showDeleteMyIncidentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteMyIncidentModal(false)}>
        <Pressable
          onPress={() => setShowDeleteMyIncidentModal(false)}
          className="flex-1 items-center justify-center bg-black/50">
          <View className="relative mx-auto w-[75%] rounded-2xl bg-white p-6 shadow-2xl">
            {/* Botão X */}
            <Pressable
              onPress={() => setShowDeleteMyIncidentModal(false)}
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
                onPress={() => setShowDeleteMyIncidentModal(false)}
                disabled={isDeletingMyIncident}
                className={`flex-1 items-center justify-center rounded-lg border-2 border-neutral-300 bg-white py-3 ${
                  isDeletingMyIncident ? 'opacity-50' : ''
                }`}>
                <Text className="text-base font-semibold text-neutral-700">Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteMyIncident}
                disabled={isDeletingMyIncident}
                className={`flex-1 items-center justify-center rounded-lg py-3 ${
                  isDeletingMyIncident ? 'bg-neutral-400' : 'bg-red-600'
                }`}>
                <Text className="text-base font-semibold text-white">
                  {isDeletingMyIncident ? 'Removendo...' : 'Sim, Remover'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
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

      {/* Modal de Configurações */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}>
        <Pressable
          onPress={() => setShowSettingsModal(false)}
          className="flex-1 items-center justify-center bg-black/50">
          <Pressable onPress={(e) => e.stopPropagation()} className="mx-4 w-full max-w-sm">
            <View className="rounded-2xl bg-white p-6">
              <Text className="mb-6 text-center text-xl font-bold text-neutral-900">
                Configurações de Permissões
              </Text>

              <View className="gap-4">
                {/* Permissão de Localização */}
                <View className="gap-2">
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center gap-2">
                      <Ionicons name="location-outline" size={24} color="#7c3aed" />
                      <Text className="text-base font-medium text-neutral-900">Localização</Text>
                    </View>
                    <View
                      className={`rounded-full px-3 py-1 ${
                        locationPermission === 'granted' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                      <Text
                        className={`text-xs font-semibold ${
                          locationPermission === 'granted' ? 'text-green-700' : 'text-red-700'
                        }`}>
                        {locationPermission === 'granted' ? 'Permitido' : 'Negado'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm text-neutral-600">
                    Necessária para criar e visualizar ocorrências no mapa
                  </Text>
                  {locationPermission !== 'granted' && (
                    <Pressable
                      onPress={handleRequestLocationPermission}
                      className="mt-2 rounded-lg bg-purple-600 p-3">
                      <Text className="text-center text-sm font-semibold text-white">
                        Solicitar Permissão
                      </Text>
                    </Pressable>
                  )}
                </View>

                <View className="my-2 h-px bg-neutral-200" />

                {/* Permissão de Câmera */}
                <View className="gap-2">
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center gap-2">
                      <Ionicons name="camera-outline" size={24} color="#7c3aed" />
                      <Text className="text-base font-medium text-neutral-900">Câmera</Text>
                    </View>
                    <View
                      className={`rounded-full px-3 py-1 ${
                        cameraPermission === 'granted' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                      <Text
                        className={`text-xs font-semibold ${
                          cameraPermission === 'granted' ? 'text-green-700' : 'text-red-700'
                        }`}>
                        {cameraPermission === 'granted' ? 'Permitido' : 'Negado'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm text-neutral-600">
                    Necessária para tirar fotos das ocorrências
                  </Text>
                  {cameraPermission !== 'granted' && (
                    <Pressable
                      onPress={handleRequestCameraPermission}
                      className="mt-2 rounded-lg bg-purple-600 p-3">
                      <Text className="text-center text-sm font-semibold text-white">
                        Solicitar Permissão
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Botão Fechar */}
              <Pressable
                onPress={() => setShowSettingsModal(false)}
                className="mt-6 rounded-lg bg-neutral-100 p-4">
                <Text className="text-center text-base font-medium text-neutral-700">Fechar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de Confirmação de Encerramento de Conta */}
      <Modal
        visible={showDeleteAccountModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteAccountModal(false)}>
        <Pressable
          onPress={() => setShowDeleteAccountModal(false)}
          className="flex-1 items-center justify-center bg-black/50">
          <View className="relative mx-auto w-[85%] rounded-2xl bg-white p-6 shadow-2xl">
            {/* Botão X */}
            <Pressable
              onPress={() => setShowDeleteAccountModal(false)}
              className="absolute right-2 top-2 z-10 h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
              <Ionicons name="close" size={20} color="#6b7280" />
            </Pressable>

            {/* Ícone de Alerta */}
            <View className="mb-4 items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <Ionicons name="warning" size={40} color="#dc2626" />
              </View>
            </View>

            {/* Título */}
            <Text className="mb-2 text-center text-xl font-bold text-neutral-900">
              Encerrar Conta?
            </Text>

            {/* Mensagem */}
            <Text className="mb-4 text-center text-base text-neutral-600">
              Tem certeza que deseja encerrar sua conta?
            </Text>

            {/* Lista de consequências */}
            <View className="mb-6 gap-2 rounded-lg bg-red-50 p-4">
              <Text className="text-sm font-semibold text-red-900">Esta ação irá:</Text>
              <View className="gap-1 pl-2">
                <Text className="text-sm text-red-800">• Desativar sua conta</Text>
                <Text className="text-sm text-red-800">
                  • Desativar todas as suas {incidentsCount} ocorrência(s)
                </Text>
                <Text className="text-sm text-red-800">• Desconectá-lo do aplicativo</Text>
              </View>
              <Text className="mt-2 text-xs font-medium text-red-700">
                ⚠️ Você poderá reativar sua conta fazendo login novamente
              </Text>
            </View>

            {/* Botões */}
            <View className="flex flex-row gap-3">
              <Pressable
                onPress={() => setShowDeleteAccountModal(false)}
                disabled={isDeletingAccount}
                className={`flex-1 items-center justify-center rounded-lg border-2 border-neutral-300 bg-white py-3 ${
                  isDeletingAccount ? 'opacity-50' : ''
                }`}>
                <Text className="text-base font-semibold text-neutral-700">Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmDeleteAccount}
                disabled={isDeletingAccount}
                className={`flex-1 items-center justify-center rounded-lg py-3 ${
                  isDeletingAccount ? 'bg-neutral-400' : 'bg-red-600'
                }`}>
                <Text className="text-base font-semibold text-white">
                  {isDeletingAccount ? 'Encerrando...' : 'Sim, Encerrar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Toast de notificação - fora dos modals */}
      <View style={{ position: 'absolute', top: insets.top + 60, left: 16, right: 16, zIndex: 9999 }}>
        <Toast message={toastMessage} visible={showToast} onHide={() => setShowToast(false)} />
      </View>
    </View>
  );
}
