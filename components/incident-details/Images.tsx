import { getAuth } from '@react-native-firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { Incident } from '@/types/incident';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { getTimeAgo } from '@/lib/date';

const { width } = Dimensions.get('window');

interface ImageItem {
  id: string;
  image_url: string;
  user_id: string;
  user_name: string;
  created_at: any;
  strike_count: number;
}

interface ImagesProps {
  incident: Incident;
  disabled?: boolean;
}

export function Images({ incident, disabled = false }: ImagesProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

  // Subscreve às imagens em tempo real
  useEffect(() => {
    if (!incident?.id) return;

    const db = getFirestore();
    const imagesRef = collection(db, 'incidents', incident.id, 'images');
    const q = query(imagesRef, orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedImages: ImageItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedImages.push({
            id: docSnap.id,
            image_url: data.image_url,
            user_id: data.user_id,
            user_name: data.user_name,
            created_at: data.created_at,
            strike_count: data.strike_count || 0,
          });
        });
        setImages(fetchedImages);
      },
      (error) => {
        console.error('[Images] Erro ao buscar imagens:', error);
      }
    );

    return () => unsubscribe();
  }, [incident?.id]);

  const uploadImageToStorage = async (uri: string): Promise<string> => {
    // Cria referência no Storage com timestamp único
    const timestamp = Date.now();
    const filename = `${timestamp}.jpg`;
    const storageRef = storage().ref(`incidents/${incident.id}/images/${filename}`);

    // Upload com progresso
    const uploadTask = storageRef.putFile(uri);

    uploadTask.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      setUploadProgress(Math.round(progress));
    });

    await uploadTask;

    const downloadURL = await storageRef.getDownloadURL();
    return downloadURL;
  };

  const handlePickImage = async () => {
    try {
      // Verifica status da permissão primeiro
      const permissionStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
      console.log('[Images] Status da permissão da galeria:', permissionStatus);

      // Solicita permissão
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[Images] Resultado da solicitação:', permissionResult);

      if (!permissionResult.granted) {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para acessar suas fotos. Por favor, habilite nas configurações do dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir Configurações',
              onPress: () => {
                Alert.alert('Info', 'Vá em Configurações > keep-alert > Permissões > Fotos');
              },
            },
          ]
        );
        return;
      }

      // Abre galeria
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('[Images] Erro ao escolher imagem:', error);
      console.error('[Images] Stack trace:', error.stack);
      Alert.alert('Erro', error.message || 'Não foi possível escolher a imagem');
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Verifica status da permissão primeiro
      const permissionStatus = await ImagePicker.getCameraPermissionsAsync();
      console.log('[Images] Status da permissão da câmera:', permissionStatus);

      // Solicita permissão da câmera
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('[Images] Resultado da solicitação:', permissionResult);

      if (!permissionResult.granted) {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para usar a câmera. Por favor, habilite nas configurações do dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir Configurações',
              onPress: () => {
                // No iOS/Android, o usuário pode ser direcionado às configurações
                Alert.alert('Info', 'Vá em Configurações > keep-alert > Permissões > Câmera');
              },
            },
          ]
        );
        return;
      }

      // Abre câmera
      console.log('[Images] Tentando abrir a câmera...');

      // Configuração mínima para evitar problemas de compatibilidade
      const cameraOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: false,
        exif: false,
      };

      console.log('[Images] Opções da câmera:', cameraOptions);
      const result = await ImagePicker.launchCameraAsync(cameraOptions);

      console.log('[Images] Resultado da câmera:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('[Images] Foto capturada, iniciando upload...');
        await uploadImage(result.assets[0].uri);
      } else {
        console.log('[Images] Captura cancelada pelo usuário');
      }
    } catch (error: any) {
      console.error('[Images] ====== ERRO DETALHADO ======');
      console.error('[Images] Tipo do erro:', typeof error);
      console.error('[Images] Erro completo:', error);
      console.error('[Images] Error name:', error?.name);
      console.error('[Images] Error message:', error?.message);
      console.error('[Images] Error code:', error?.code);
      console.error('[Images] Stack trace:', error?.stack);
      console.error('[Images] ============================');

      const errorDetails = `
Tipo: ${typeof error}
Nome: ${error?.name || 'N/A'}
Mensagem: ${error?.message || 'N/A'}
Código: ${error?.code || 'N/A'}
      `.trim();

      Alert.alert(
        'Erro ao abrir câmera',
        `${error?.message || 'Não foi possível abrir a câmera'}\n\nDetalhes:\n${errorDetails}\n\nVerifique se:\n• A câmera não está sendo usada por outro app\n• O app de câmera padrão está instalado\n• Reinicie o dispositivo`,
        [
          {
            text: 'Copiar erro',
            onPress: () => console.log('[Images] Erro para debug:', JSON.stringify(error, null, 2)),
          },
          { text: 'OK' },
        ]
      );
    }
  };

  const uploadImage = async (uri: string) => {
    if (!getAuth().currentUser) {
      Alert.alert('Erro', 'Você precisa estar autenticado');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Faz upload para Storage
      const downloadURL = await uploadImageToStorage(uri);

      // Salva na subcoleção
      const db = getFirestore();
      const imagesRef = collection(db, 'incidents', incident.id, 'images');
      await addDoc(imagesRef, {
        image_url: downloadURL,
        user_id: getAuth().currentUser!.uid,
        user_name: getAuth().currentUser!.displayName || getAuth().currentUser!.email || 'Usuário anônimo',
        created_at: serverTimestamp(),
        strike_count: 0,
      });

      // Não mostra Alert - a imagem aparecendo na lista já é feedback suficiente
    } catch (error: any) {
      console.error('[Images] Erro ao enviar imagem:', error);
      Alert.alert('Erro', error.message || 'Não foi possível enviar a imagem');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Agrupa imagens por usuário
  const groupedImages = useMemo(() => {
    const groups: { [userId: string]: ImageItem[] } = {};

    images.forEach((image) => {
      if (!groups[image.user_id]) {
        groups[image.user_id] = [];
      }
      groups[image.user_id].push(image);
    });

    // Converte para array e ordena pela imagem mais recente de cada grupo
    return Object.entries(groups)
      .map(([userId, userImages]) => ({
        userId,
        userName: userImages[0].user_name,
        images: userImages.sort((a, b) => {
          const timeA =
            a.created_at && typeof a.created_at === 'object' && 'seconds' in a.created_at
              ? a.created_at.seconds
              : 0;
          const timeB =
            b.created_at && typeof b.created_at === 'object' && 'seconds' in b.created_at
              ? b.created_at.seconds
              : 0;
          return timeB - timeA; // Mais recente primeiro
        }),
      }))
      .sort((a, b) => {
        // Ordena grupos pela imagem mais recente
        const timeA =
          a.images[0].created_at &&
          typeof a.images[0].created_at === 'object' &&
          'seconds' in a.images[0].created_at
            ? a.images[0].created_at.seconds
            : 0;
        const timeB =
          b.images[0].created_at &&
          typeof b.images[0].created_at === 'object' &&
          'seconds' in b.images[0].created_at
            ? b.images[0].created_at.seconds
            : 0;
        return timeB - timeA;
      });
  }, [images]);

  const handleReportImage = async (imageId: string) => {
    if (!getAuth().currentUser) {
      Alert.alert('Erro', 'Você precisa estar autenticado');
      return;
    }

    try {
      const db = getFirestore();
      // Verifica se o usuário já denunciou esta imagem
      const strikeRef = doc(db, 'incidents', incident.id, 'images', imageId, 'image_strikes', getAuth().currentUser!.uid);
      const strikesRef = collection(db, 'incidents', incident.id, 'images', imageId, 'image_strikes');

      const strikeSnapshot = await getDocs(strikesRef);

      const hasVoted = strikeSnapshot.docs.some((docSnap) => docSnap.id === getAuth().currentUser!.uid);

      if (hasVoted) {
        Alert.alert('Aviso', 'Você já denunciou esta imagem como inapropriada');
        return;
      }

      // Confirma a denúncia
      Alert.alert(
        'Denunciar Imagem',
        'Tem certeza que deseja marcar esta imagem como inapropriada?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Denunciar',
            style: 'destructive',
            onPress: async () => {
              try {
                // Adiciona o voto do usuário
                await setDoc(strikeRef, {
                  user_id: getAuth().currentUser!.uid,
                  created_at: serverTimestamp(),
                });

                // Incrementa o contador de strikes na imagem
                const imageRef = doc(getFirestore(), 'incidents', incident.id, 'images', imageId);
                await updateDoc(imageRef, {
                  strike_count: increment(1),
                });

                Alert.alert('Sucesso', 'Imagem denunciada como inapropriada');
              } catch (error: any) {
                console.error('[Images] Erro ao denunciar imagem:', error);
                Alert.alert('Erro', error.message || 'Não foi possível denunciar a imagem');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('[Images] Erro ao verificar denúncia:', error);
      Alert.alert('Erro', error.message || 'Não foi possível processar a denúncia');
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    Alert.alert('Deletar Imagem', 'Tem certeza que deseja deletar esta imagem?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          try {
            // Deleta do Firestore
            const imageRef = doc(getFirestore(), 'incidents', incident.id, 'images', imageId);
            await deleteDoc(imageRef);

            // TODO: Deletar do Storage também se necessário
            // const storageRef = ref(storage, imageUrl);
            // await deleteObject(storageRef);

            Alert.alert('Sucesso', 'Imagem deletada com sucesso!');
          } catch (error: any) {
            console.error('[Images] Erro ao deletar imagem:', error);
            Alert.alert('Erro', error.message || 'Não foi possível deletar a imagem');
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1">
      {/* Header com contador */}
      <View className="mb-3 flex flex-row items-center justify-between">
        <View className="flex flex-row items-center gap-2">
          <Text className="text-base font-semibold text-neutral-900">Imagens</Text>
          <View className="h-5 w-5 items-center justify-center rounded-full bg-neutral-200">
            <Text className="text-xs font-bold text-neutral-700">{images.length}</Text>
          </View>
        </View>

        {/* Botões de ação */}
        {!disabled && (
          <View className="flex flex-row gap-2">
            <Pressable
              onPress={handlePickImage}
              disabled={isUploading}
              className={`flex flex-row items-center gap-1 rounded-lg px-3 py-2 ${
                isUploading ? 'bg-neutral-300' : 'bg-primary'
              }`}>
              <Ionicons name="images-outline" size={16} color="#fff" />
              <Text className="text-xs font-medium text-white">Galeria</Text>
            </Pressable>
            <Pressable
              onPress={handleTakePhoto}
              disabled={isUploading}
              className={`flex flex-row items-center gap-1 rounded-lg px-3 py-2 ${
                isUploading ? 'bg-neutral-300' : 'bg-primary'
              }`}>
              <Ionicons name="camera-outline" size={16} color="#fff" />
              <Text className="text-xs font-medium text-white">Câmera</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Progress bar durante upload */}
      {isUploading && (
        <View className="mb-3 rounded-lg bg-blue-50 p-3">
          <View className="mb-2 flex flex-row items-center justify-between">
            <Text className="text-sm font-medium text-blue-900">Enviando imagem...</Text>
            <Text className="text-sm font-bold text-blue-900">{uploadProgress}%</Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-blue-200">
            <View
              className="h-full bg-primary"
              style={{ width: `${uploadProgress}%` }}
            />
          </View>
        </View>
      )}

      {/* Mensagem quando desabilitado */}
      {disabled && images.length === 0 && (
        <View className="mb-3 rounded-lg bg-neutral-100 p-4">
          <Text className="text-center text-sm text-neutral-500">
            Envio de imagens desabilitado - ocorrência resolvida
          </Text>
        </View>
      )}

      {/* Lista de imagens agrupadas por usuário */}
      {groupedImages.length > 0 ? (
        <ScrollView className="max-h-96" showsVerticalScrollIndicator={true}>
          <View className="gap-4">
            {groupedImages.map((group) => {
              const isAuthor = getAuth().currentUser?.uid === group.userId;

              return (
                <View
                  key={group.userId}
                  className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                  {/* Header do grupo - Nome do usuário */}
                  <View className="border-b border-neutral-200 bg-white px-3 py-2">
                    <Text className="text-sm font-semibold text-neutral-900" numberOfLines={1}>
                      {group.userName}
                    </Text>
                    <Text className="text-xs text-neutral-500">
                      {group.images.length} {group.images.length === 1 ? 'imagem' : 'imagens'}
                    </Text>
                  </View>

                  {/* Carrossel horizontal de imagens */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-row"
                    contentContainerClassName="gap-0">
                    {group.images.map((imageItem, index) => {
                      const createdAt =
                        imageItem.created_at &&
                        typeof imageItem.created_at === 'object' &&
                        'seconds' in imageItem.created_at
                          ? new Date(imageItem.created_at.seconds * 1000)
                          : new Date();
                      const timeAgo = getTimeAgo(createdAt);

                      return (
                        <View
                          key={imageItem.id}
                          className={`${index > 0 ? 'border-l border-neutral-200' : ''}`}
                          style={{ width: (width - 40) / 2 }}>
                          {/* Imagem - clicável para zoom */}
                          <Pressable onPress={() => setSelectedImage(imageItem)}>
                            {imageItem.strike_count > 0 ? (
                              // Placeholder para imagem denunciada
                              <View
                                style={{ width: (width - 40) / 2, height: 160 }}
                                className="items-center justify-center bg-neutral-300">
                                <Ionicons name="eye-off-outline" size={32} color="#6b7280" />
                                <Text className="mt-2 px-4 text-center text-xs font-medium text-neutral-600">
                                  Imagem marcada como inapropriada
                                </Text>
                              </View>
                            ) : (
                              // Imagem normal
                              <Image
                                source={{ uri: imageItem.image_url }}
                                style={{ width: (width - 40) / 2, height: 160 }}
                                resizeMode="cover"
                              />
                            )}
                          </Pressable>

                          {/* Footer de cada imagem */}
                          <View className="border-t border-neutral-200 bg-neutral-50 p-2">
                            {/* Primeira linha: tempo e ações */}
                            <View className="flex flex-row items-center justify-between">
                              <Text className="flex-1 text-xs text-neutral-500" numberOfLines={1}>
                                {timeAgo}
                              </Text>
                              <View className="flex flex-row gap-1">
                                {/* Botão de denúncia - só para não-autores */}
                                {!isAuthor && (
                                  <Pressable
                                    onPress={() => handleReportImage(imageItem.id)}
                                    className="h-6 w-6 items-center justify-center rounded-full bg-orange-100">
                                    <Ionicons name="flag-outline" size={12} color="#f97316" />
                                  </Pressable>
                                )}
                                {/* Botão de deletar - só para autores */}
                                {isAuthor && (
                                  <Pressable
                                    onPress={() =>
                                      handleDeleteImage(imageItem.id, imageItem.image_url)
                                    }
                                    className="h-6 w-6 items-center justify-center rounded-full bg-red-100">
                                    <Ionicons name="trash-outline" size={12} color="#ef4444" />
                                  </Pressable>
                                )}
                              </View>
                            </View>
                            {/* Segunda linha: contador de strikes (se houver) */}
                            {imageItem.strike_count > 0 && (
                              <View className="mt-1 flex flex-row items-center gap-1">
                                <Ionicons name="flag" size={10} color="#f97316" />
                                <Text className="text-xs font-semibold text-orange-600">
                                  {imageItem.strike_count} denúncia{imageItem.strike_count !== 1 ? 's' : ''}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <View className="mb-3 rounded-lg bg-neutral-50 p-4">
          <Text className="text-center text-sm text-neutral-500">
            Nenhuma imagem ainda. Seja o primeiro a adicionar!
          </Text>
        </View>
      )}

      {/* Modal de Zoom da Imagem */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}>
        <Pressable
          onPress={() => setSelectedImage(null)}
          className="flex-1 items-center justify-center bg-black/90">
          {selectedImage && (
            <View className="w-full">
              {/* Header do Modal */}
              <View className="mb-4 flex flex-row items-center justify-between px-4">
                <View>
                  <Text className="text-base font-semibold text-white">
                    {selectedImage.user_name}
                  </Text>
                  <Text className="text-sm text-neutral-300">
                    {selectedImage.created_at &&
                    typeof selectedImage.created_at === 'object' &&
                    'seconds' in selectedImage.created_at
                      ? getTimeAgo(new Date(selectedImage.created_at.seconds * 1000))
                      : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedImage(null)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Ionicons name="close" size={24} color="#fff" />
                </Pressable>
              </View>

              {/* Imagem em tamanho maior */}
              {selectedImage.strike_count > 0 ? (
                // Placeholder para imagem denunciada
                <View className="h-96 w-full items-center justify-center bg-neutral-700">
                  <Ionicons name="eye-off-outline" size={64} color="#9ca3af" />
                  <Text className="mt-4 px-8 text-center text-lg font-semibold text-neutral-300">
                    Imagem marcada como inapropriada
                  </Text>
                  <Text className="mt-2 px-8 text-center text-sm text-neutral-400">
                    Esta imagem recebeu {selectedImage.strike_count} denúncia
                    {selectedImage.strike_count !== 1 ? 's' : ''}
                  </Text>
                </View>
              ) : (
                // Imagem normal
                <Image
                  source={{ uri: selectedImage.image_url }}
                  className="h-96 w-full"
                  resizeMode="contain"
                />
              )}

              {/* Indicador de strikes */}
              {selectedImage.strike_count > 0 && (
                <View className="mt-3 px-4">
                  <View className="flex flex-row items-center justify-center gap-2 rounded-lg bg-orange-100 py-2">
                    <Ionicons name="flag" size={16} color="#f97316" />
                    <Text className="text-sm font-semibold text-orange-700">
                      {selectedImage.strike_count} denúncia{selectedImage.strike_count !== 1 ? 's' : ''} de conteúdo inapropriado
                    </Text>
                  </View>
                </View>
              )}

              {/* Ações */}
              <View className="mt-4 gap-3 px-4">
                {/* Botão denunciar (apenas para não-autores) */}
                {getAuth().currentUser?.uid !== selectedImage.user_id && (
                  <Pressable
                    onPress={() => {
                      setSelectedImage(null);
                      handleReportImage(selectedImage.id);
                    }}
                    className="flex flex-row items-center justify-center gap-2 rounded-lg bg-orange-600 py-3">
                    <Ionicons name="flag-outline" size={18} color="#fff" />
                    <Text className="text-base font-semibold text-white">Denunciar Imagem</Text>
                  </Pressable>
                )}

                {/* Botão deletar (apenas para autor) */}
                {getAuth().currentUser?.uid === selectedImage.user_id && (
                  <Pressable
                    onPress={() => {
                      setSelectedImage(null);
                      handleDeleteImage(selectedImage.id, selectedImage.image_url);
                    }}
                    className="flex flex-row items-center justify-center gap-2 rounded-lg bg-red-600 py-3">
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                    <Text className="text-base font-semibold text-white">Deletar Imagem</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
