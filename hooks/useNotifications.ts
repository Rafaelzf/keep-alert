import { useSession } from '@/components/auth/ctx';
import { registerFCMToken } from '@/lib/fcm';
import { calculateDistance } from '@/lib/locations';
import { clearBadge, incrementBadge, registerForPushNotifications } from '@/lib/notifications';
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Hook para gerenciar notificações push e badges.
 * Trata mensagens FCM data-only recebidas em foreground,
 * aplicando filtro de perímetro antes de exibir a notificação local.
 */
export function useNotifications() {
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const { user } = useSession();

  useEffect(() => {
    // 1. Registra permissões e configura canais (Expo Notifications)
    registerForPushNotifications();

    // 2. Registra FCM token se usuário estiver autenticado
    if (user?.uid) {
      registerFCMToken(user.uid);
    }

    // 3. Handler para mensagens FCM recebidas em FOREGROUND (data-only)
    // O background handler está registrado em index.tsx via setBackgroundMessageHandler
    const unsubscribeFCM = messaging().onMessage(async (remoteMessage) => {
      console.log('[useNotifications] FCM foreground message:', remoteMessage.messageId);

      const data = remoteMessage.data;
      if (!data) return;

      // Sem localização ou perímetro configurados, não há como filtrar
      if (!user?.last_location || !user?.perimeter_radius) {
        console.log('[useNotifications] Localização/perímetro indisponível, ignorando');
        return;
      }

      if (user.alerts_notifications === false) {
        console.log('[useNotifications] Notificações desabilitadas, ignorando');
        return;
      }

      const incidentLat = parseFloat(String(data.lat));
      const incidentLng = parseFloat(String(data.lng));

      if (isNaN(incidentLat) || isNaN(incidentLng)) return;

      const distance = calculateDistance(
        user.last_location.latitude,
        user.last_location.longitude,
        incidentLat,
        incidentLng
      );

      console.log(
        `[useNotifications] Distância: ${Math.round(distance)}m / perímetro: ${user.perimeter_radius}m`
      );

      if (distance > user.perimeter_radius) {
        console.log('[useNotifications] Incidente fora do perímetro, descartando');
        return;
      }

      // Exibe notificação local com os dados do payload
      await Notifications.scheduleNotificationAsync({
        content: {
          title: String(data.title ?? 'Alerta Keep Alert'),
          body: String(data.body ?? 'Novo incidente próximo a você'),
          data: {
            incidentId: data.incidentId,
            screen: data.screen,
            category: data.category,
          },
          sound: 'default',
        },
        trigger: null,
      });

      incrementBadge();
    });

    // 4. Listener para quando uma notificação local é RECEBIDA (agendada pelo handler acima)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[useNotifications] Notificação local recebida:', notification);
      }
    );

    // 5. Listener para quando o usuário INTERAGE com a notificação (clica)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[useNotifications] Usuário interagiu com notificação:', response);

        // Quando o usuário clica na notificação, limpa o badge
        clearBadge();

        // Aqui você pode adicionar lógica para navegar para uma tela específica
        // baseado nos dados da notificação (response.notification.request.content.data)
      }
    );

    // 6. Listener para quando o app volta ao foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[useNotifications] App voltou ao foreground, limpando badge');
        clearBadge();
      }

      appState.current = nextAppState;
    });

    // 7. Cleanup
    return () => {
      unsubscribeFCM();
      notificationListener.current?.remove();
      responseListener.current?.remove();
      subscription.remove();
    };
  }, [user?.uid, user?.last_location, user?.perimeter_radius, user?.alerts_notifications]);
}
