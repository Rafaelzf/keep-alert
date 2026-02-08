import { auth, db, storage } from '@/firebase/firebaseConfig';
import { Incident } from '@/types/incident';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { getTimeAgo } from '@/lib/date';

interface ImageItem {
  id: string;
  image_url: string;
  user_id: string;
  user_name: string;
  created_at: any;
}

interface ImagesProps {
  incident: Incident;
}

export function Images({ incident }: ImagesProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

  // Subscreve às imagens em tempo real
  useEffect(() => {
    if (!incident?.id) return;

    const imagesRef = collection(db, 'incidents', incident.id, 'images');
    const q = query(imagesRef, orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedImages: ImageItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedImages.push({
            id: doc.id,
            image_url: data.image_url,
            user_id: data.user_id,
            user_name: data.user_name,
            created_at: data.created_at,
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
    try {
      // Converte URI para Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Cria referência no Storage com timestamp único
      const timestamp = Date.now();
      const filename = `${timestamp}.jpg`;
      const storageRef = ref(storage, `incidents/${incident.id}/images/${filename}`);

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
            console.error('[Images] Erro no upload:', error);
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
  };

  const handlePickImage = async () => {
    try {
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
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('[Images] Erro ao escolher imagem:', error);
      Alert.alert('Erro', error.message || 'Não foi possível escolher a imagem');
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Solicita permissão da câmera
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permissão Necessária', 'Precisamos de permissão para usar a câmera.');
        return;
      }

      // Abre câmera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('[Images] Erro ao tirar foto:', error);
      Alert.alert('Erro', error.message || 'Não foi possível tirar a foto');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!auth.currentUser) {
      Alert.alert('Erro', 'Você precisa estar autenticado');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Faz upload para Storage
      const downloadURL = await uploadImageToStorage(uri);

      // Salva na subcoleção
      const imagesRef = collection(db, 'incidents', incident.id, 'images');
      await addDoc(imagesRef, {
        image_url: downloadURL,
        user_id: auth.currentUser.uid,
        user_name: auth.currentUser.displayName || auth.currentUser.email || 'Usuário anônimo',
        created_at: serverTimestamp(),
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

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    Alert.alert('Deletar Imagem', 'Tem certeza que deseja deletar esta imagem?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          try {
            // Deleta do Firestore
            const imageRef = doc(db, 'incidents', incident.id, 'images', imageId);
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

      {/* Lista de imagens */}
      {images.length > 0 ? (
        <ScrollView className="max-h-96" showsVerticalScrollIndicator={true}>
          <View className="gap-3">
            {images.map((imageItem) => {
              const createdAt =
                imageItem.created_at && 'seconds' in imageItem.created_at
                  ? new Date(imageItem.created_at.seconds * 1000)
                  : new Date();
              const timeAgo = getTimeAgo(createdAt);
              const isAuthor = auth.currentUser?.uid === imageItem.user_id;

              return (
                <View
                  key={imageItem.id}
                  className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                  {/* Imagem - clicável para zoom */}
                  <Pressable onPress={() => setSelectedImage(imageItem)}>
                    <Image
                      source={{ uri: imageItem.image_url }}
                      className="h-64 w-full"
                      resizeMode="cover"
                    />
                  </Pressable>

                  {/* Footer */}
                  <View className="p-3">
                    <View className="flex flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-neutral-900" numberOfLines={1}>
                          {imageItem.user_name}
                        </Text>
                        <Text className="text-xs text-neutral-500">{timeAgo}</Text>
                      </View>
                      {isAuthor && (
                        <Pressable
                          onPress={() => handleDeleteImage(imageItem.id, imageItem.image_url)}
                          className="h-8 w-8 items-center justify-center rounded-full bg-red-100">
                          <Ionicons name="trash-outline" size={16} color="#ef4444" />
                        </Pressable>
                      )}
                    </View>
                  </View>
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
                    {selectedImage.created_at && 'seconds' in selectedImage.created_at
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
              <Image
                source={{ uri: selectedImage.image_url }}
                className="h-96 w-full"
                resizeMode="contain"
              />

              {/* Botão deletar (apenas para autor) */}
              {auth.currentUser?.uid === selectedImage.user_id && (
                <View className="mt-4 px-4">
                  <Pressable
                    onPress={() => {
                      setSelectedImage(null);
                      handleDeleteImage(selectedImage.id, selectedImage.image_url);
                    }}
                    className="flex flex-row items-center justify-center gap-2 rounded-lg bg-red-600 py-3">
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                    <Text className="text-base font-semibold text-white">Deletar Imagem</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
