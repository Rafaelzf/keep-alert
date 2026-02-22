import messaging from '@react-native-firebase/messaging';
import { doc, getFirestore, updateDoc } from '@react-native-firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encode, neighbors } from 'ngeohash';

/**
 * Solicita permissão de notificações e obtém o FCM token
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('[FCM] Permissão de notificação não concedida no iOS');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('[FCM] Erro ao solicitar permissão:', error);
    return false;
  }
}

/**
 * Obtém o FCM token do device
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    console.log('[FCM] Token obtido:', token);
    return token;
  } catch (error) {
    console.error('[FCM] Erro ao obter FCM token:', error);
    return null;
  }
}

/**
 * Salva o FCM token no Firestore para o usuário
 */
export async function saveFCMTokenToFirestore(userId: string, token: string): Promise<void> {
  try {
    const db = getFirestore();
    await updateDoc(doc(db, 'users', userId), { fcmToken: token });
    console.log('[FCM] Token salvo no Firestore para o usuário:', userId);
  } catch (error) {
    console.error('[FCM] Erro ao salvar token no Firestore:', error);
    throw error;
  }
}

/**
 * Registra o FCM token para o usuário autenticado
 */
export async function registerFCMToken(userId: string): Promise<boolean> {
  try {
    // 1. Solicita permissão
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return false;
    }

    // 2. Obtém o token
    const token = await getFCMToken();
    if (!token) {
      return false;
    }

    // 3. Salva no Firestore
    await saveFCMTokenToFirestore(userId, token);

    // 4. Listener para atualizar se o token mudar
    messaging().onTokenRefresh(async (newToken) => {
      console.log('[FCM] Token atualizado:', newToken);
      await saveFCMTokenToFirestore(userId, newToken);
    });

    return true;
  } catch (error) {
    console.error('[FCM] Erro ao registrar FCM token:', error);
    return false;
  }
}

/**
 * Remove o FCM token do Firestore (logout)
 */
export async function removeFCMToken(userId: string): Promise<void> {
  try {
    const db = getFirestore();
    await updateDoc(doc(db, 'users', userId), { fcmToken: null });
    console.log('[FCM] Token removido do Firestore');
  } catch (error) {
    console.error('[FCM] Erro ao remover token:', error);
  }
}

// ========================================
// TOPIC MESSAGING POR GEOHASH
// ========================================

const SUBSCRIBED_GEOHASH_KEY = 'fcm_subscribed_geohash5';

function getGeohashTopics(lat: number, lng: number): string[] {
  const geohash5 = encode(lat, lng, 5);
  const neighborList: string[] = neighbors(geohash5); // 8 vizinhos cardeais/diagonais
  return [geohash5, ...neighborList].map((gh) => `alerts_${gh}`); // 9 tópicos no total
}

/**
 * Inscreve o dispositivo nos 9 tópicos FCM correspondentes ao geohash precision-5
 * da localização fornecida (célula central + 8 vizinhos).
 * Desinscreve automaticamente dos tópicos anteriores se o geohash mudou.
 */
export async function subscribeToGeohashTopics(lat: number, lng: number): Promise<void> {
  try {
    const newGeohash5 = encode(lat, lng, 5);
    const previousGeohash5 = await AsyncStorage.getItem(SUBSCRIBED_GEOHASH_KEY);

    // Sem mudança de célula → nada a fazer
    if (previousGeohash5 === newGeohash5) {
      return;
    }

    // Desinscreve dos tópicos anteriores
    if (previousGeohash5) {
      await unsubscribeFromGeohashTopics(previousGeohash5);
    }

    // Inscreve nos 9 novos tópicos
    const topics = getGeohashTopics(lat, lng);
    console.log('[FCM] Inscrevendo em tópicos geohash:', topics);

    await Promise.all(
      topics.map((topic) =>
        messaging()
          .subscribeToTopic(topic)
          .then(() => console.log('[FCM] Inscrito em:', topic))
          .catch((err) => console.error('[FCM] Erro ao inscrever em', topic, err))
      )
    );

    await AsyncStorage.setItem(SUBSCRIBED_GEOHASH_KEY, newGeohash5);
    console.log('[FCM] Subscrição concluída para geohash5:', newGeohash5);
  } catch (error) {
    console.error('[FCM] Erro em subscribeToGeohashTopics:', error);
  }
}

/**
 * Desinscreve dos 9 tópicos FCM de um geohash5 específico.
 * Se geohash5 não for informado, usa o valor salvo no AsyncStorage.
 */
export async function unsubscribeFromGeohashTopics(geohash5?: string): Promise<void> {
  try {
    const target = geohash5 ?? (await AsyncStorage.getItem(SUBSCRIBED_GEOHASH_KEY));
    if (!target) {
      return;
    }

    const topics = [target, ...neighbors(target)].map((gh) => `alerts_${gh}`);
    console.log('[FCM] Desinscrevendo de tópicos geohash:', topics);

    await Promise.all(
      topics.map((topic) =>
        messaging()
          .unsubscribeFromTopic(topic)
          .then(() => console.log('[FCM] Desinscrito de:', topic))
          .catch((err) => console.error('[FCM] Erro ao desinscrever de', topic, err))
      )
    );

    await AsyncStorage.removeItem(SUBSCRIBED_GEOHASH_KEY);
    console.log('[FCM] Desinscriçao concluída');
  } catch (error) {
    console.error('[FCM] Erro em unsubscribeFromGeohashTopics:', error);
  }
}
