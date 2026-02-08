import { auth, db } from '@/firebase/firebaseConfig';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { router } from 'expo-router';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

export interface NotificationHook {
  fcmToken: string | null;
  isLoading: boolean;
  hasPermission: boolean;
  notification: FirebaseMessagingTypes.RemoteMessage | null;
  requestPermission: () => Promise<boolean>;
  refreshToken: () => Promise<void>;
}

export function useNotifications(): NotificationHook {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [notification, setNotification] = useState<FirebaseMessagingTypes.RemoteMessage | null>(
    null
  );

  // Solicitar permissões
  const requestPermission = async (): Promise<boolean> => {
    try {
      // Android 13+ requer permissão POST_NOTIFICATIONS
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('❌ Permissão de notificações negada (Android)');
          return false;
        }
      }

      // iOS requer requestPermission()
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log('❌ Permissão de notificações negada (iOS)');
          return false;
        }
      }

      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      return false;
    }
  };

  // Obter FCM Token
  const getToken = async (): Promise<string | null> => {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('❌ Erro ao obter FCM token:', error);
      return null;
    }
  };

  // Atualizar token
  const refreshToken = async () => {
    const token = await getToken();
    if (token) {
      setFcmToken(token);
      // TODO: Salvar token no Firestore
      // await saveFCMTokenToFirestore(token);
    }
  };

  // Criar canal de notificação Android (alta prioridade)
  const createNotificationChannel = async () => {
    if (Platform.OS === 'android') {
      // A partir do Android 8.0, canais são obrigatórios
      // Você pode criar via código nativo ou usar uma biblioteca auxiliar
      console.log('📢 Canal de notificação será criado via código nativo');
      // TODO: Implementar criação de canal via módulo nativo se necessário
    }
  };

  // Inicialização
  useEffect(() => {
    let unsubscribeOnMessage: (() => void) | undefined;
    let unsubscribeOnTokenRefresh: (() => void) | undefined;

    const initialize = async () => {
      setIsLoading(true);

      // 1. Solicitar permissões
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      // 2. Criar canal de notificação (Android)
      await createNotificationChannel();

      // 3. Obter token FCM
      const token = await getToken();
      if (token) {
        setFcmToken(token);
        // Salvar token no Firestore
        await saveFCMTokenToFirestore(token);
      }

      // 4. Listener: quando notificação chega (app em FOREGROUND)
      unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
        console.log('[Foreground] Mensagem FCM recebida:', remoteMessage);
        setNotification(remoteMessage);

        // Exibir alerta customizado ou usar biblioteca de notificação local
        if (remoteMessage.notification) {
          Alert.alert(
            remoteMessage.notification.title || 'Nova Notificação',
            remoteMessage.notification.body || ''
          );
        }
      });

      // 5. Listener: quando token é atualizado
      unsubscribeOnTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
        console.log('🔄 Token FCM atualizado:', newToken);
        setFcmToken(newToken);
        // Atualizar token no Firestore
        await updateFCMTokenInFirestore(newToken);
      });

      // 6. Verificar se app abriu de uma notificação (app estava fechado)
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        console.log('[Cold Start] App aberto via notificação:', initialNotification);
        handleNotificationOpen(initialNotification);
      }

      // 7. Listener: quando usuário clica na notificação (app em background)
      messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('[Background] App aberto via notificação:', remoteMessage);
        handleNotificationOpen(remoteMessage);
      });

      setIsLoading(false);
    };

    initialize();

    // Cleanup
    return () => {
      if (unsubscribeOnMessage) unsubscribeOnMessage();
      if (unsubscribeOnTokenRefresh) unsubscribeOnTokenRefresh();
    };
  }, []);

  // Lidar com clique em notificação (deep linking)
  const handleNotificationOpen = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    const { data } = remoteMessage;

    if (data?.incidentId) {
      // Navegar para a tela do incidente
      router.push(`/incidents/${data.incidentId}`);
    } else if (data?.screen) {
      // Ou usar campo "screen" genérico
      router.push(data.screen as any);
    }
  };

  return {
    fcmToken,
    isLoading,
    hasPermission,
    notification,
    requestPermission,
    refreshToken,
  };
}

/**
 * Salvar FCM Token no Firestore
 * Salva o token junto com o perfil do usuário para receber notificações
 */
async function saveFCMTokenToFirestore(token: string) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('[saveFCMToken] Usuário não autenticado');
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);

    await setDoc(
      userRef,
      {
        fcmToken: token,
        fcmTokenUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log('✅ FCM Token salvo no Firestore');
  } catch (error) {
    console.error('❌ Erro ao salvar FCM token:', error);
  }
}

/**
 * Atualizar FCM Token no Firestore (quando token é renovado)
 */
async function updateFCMTokenInFirestore(newToken: string) {
  await saveFCMTokenToFirestore(newToken);
}
