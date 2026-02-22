import { useSession } from '@/components/auth/ctx';
import type { AlertBannerData } from '@/components/ui/alert-banner';
import { registerFCMToken } from '@/lib/fcm';
import { calculateDistance } from '@/lib/locations';
import { clearBadge, incrementBadge, registerForPushNotifications } from '@/lib/notifications';
import { playSuccessSound } from '@/lib/sound';
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Hook para gerenciar notificações push e badges.
 *
 * Foreground: toca a sirene + exibe AlertBanner customizado (sem system notification).
 * Background: tratado em index.tsx via setBackgroundMessageHandler.
 *
 * Retorna os dados do alerta em foreground para o _layout.tsx renderizar o AlertBanner.
 */
export function useNotifications() {
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const { user } = useSession();

  const [foregroundAlert, setForegroundAlert] = useState<AlertBannerData | null>(null);

  const clearForegroundAlert = () => setForegroundAlert(null);

  useEffect(() => {
    // 1. Registra permissões e configura canais (Expo Notifications)
    registerForPushNotifications();

    // 2. Registra FCM token se usuário estiver autenticado
    if (user?.uid) {
      registerFCMToken(user.uid);
    }

    // 3. Handler para mensagens FCM recebidas em FOREGROUND (data-only)
    // Em vez de exibir system notification, toca sirene + mostra AlertBanner customizado.
    const unsubscribeFCM = messaging().onMessage(async (remoteMessage) => {
      console.log('[useNotifications] FCM foreground message:', remoteMessage.messageId);

      const data = remoteMessage.data;
      if (!data) return;

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

      const distanceText =
        distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`;

      // Toca o mesmo som de sirene usado ao postar um incidente
      playSuccessSound();

      // Exibe o AlertBanner customizado (persiste até o usuário fechar)
      setForegroundAlert({
        title: String(data.title ?? '📢 Alerta Keep Alert'),
        distanceText,
        incidentId: String(data.incidentId ?? ''),
        screen: String(data.screen ?? ''),
        category: String(data.category ?? ''),
      });

      incrementBadge();
    });

    // 4. Listener para quando o usuário INTERAGE com a notificação (clica — vinda do background)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[useNotifications] Interação com notificação de background:', response);
        clearBadge();
        // TODO: navegar para response.notification.request.content.data.screen
      }
    );

    // 5. Listener para quando o app volta ao foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[useNotifications] App voltou ao foreground, limpando badge');
        clearBadge();
      }
      appState.current = nextAppState;
    });

    // 6. Cleanup
    return () => {
      unsubscribeFCM();
      notificationListener.current?.remove();
      responseListener.current?.remove();
      subscription.remove();
    };
  }, [user?.uid, user?.last_location, user?.perimeter_radius, user?.alerts_notifications]);

  return { foregroundAlert, clearForegroundAlert };
}
