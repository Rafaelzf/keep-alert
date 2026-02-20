import messaging from '@react-native-firebase/messaging';
import { doc, getFirestore, updateDoc } from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

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
