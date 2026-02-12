import { useSession } from '@/components/auth/ctx';
import { registerFCMToken } from '@/lib/fcm';
import { clearBadge, incrementBadge, registerForPushNotifications } from '@/lib/notifications';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Hook para gerenciar notificações push e badges
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

    // 3. Listener para quando uma notificação é RECEBIDA (app em foreground ou background)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[useNotifications] Notificação recebida:', notification);

        // Incrementa o badge quando recebe notificação
        incrementBadge();
      }
    );

    // 4. Listener para quando o usuário INTERAGE com a notificação (clica)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[useNotifications] Usuário interagiu com notificação:', response);

        // Quando o usuário clica na notificação, limpa o badge
        clearBadge();

        // Aqui você pode adicionar lógica para navegar para uma tela específica
        // baseado nos dados da notificação (response.notification.request.content.data)
      }
    );

    // 5. Listener para quando o app volta ao foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App voltou ao foreground - limpa o badge
        console.log('[useNotifications] App voltou ao foreground, limpando badge');
        clearBadge();
      }

      appState.current = nextAppState;
    });

    // 6. Cleanup
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      subscription.remove();
    };
  }, [user?.uid]);
}
