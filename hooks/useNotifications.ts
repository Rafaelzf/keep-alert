import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { clearBadge, incrementBadge, registerForPushNotifications } from '@/lib/notifications';

/**
 * Hook para gerenciar notificações push e badges
 */
export function useNotifications() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // 1. Registra para receber notificações
    registerForPushNotifications();

    // 2. Listener para quando uma notificação é RECEBIDA (app em foreground ou background)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[useNotifications] Notificação recebida:', notification);

        // Incrementa o badge quando recebe notificação
        incrementBadge();
      }
    );

    // 3. Listener para quando o usuário INTERAGE com a notificação (clica)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[useNotifications] Usuário interagiu com notificação:', response);

        // Quando o usuário clica na notificação, limpa o badge
        clearBadge();

        // Aqui você pode adicionar lógica para navegar para uma tela específica
        // baseado nos dados da notificação (response.notification.request.content.data)
      }
    );

    // 4. Listener para quando o app volta ao foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App voltou ao foreground - limpa o badge
        console.log('[useNotifications] App voltou ao foreground, limpando badge');
        clearBadge();
      }

      appState.current = nextAppState;
    });

    // 5. Cleanup
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      subscription.remove();
    };
  }, []);
}
