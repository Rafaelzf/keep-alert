import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuração padrão de como as notificações devem ser exibidas
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true, // Importante: permite atualizar o badge
  }),
});

/**
 * Solicita permissões de notificação
 */
export async function registerForPushNotifications() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Permissão de notificação não concedida');
      return null;
    }

    // Configurar canal de notificação para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('critical-alerts', {
        name: 'Alertas Críticos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#DC2626',
        sound: 'default',
      });
    }

    // Obter o token de push
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    console.log('[Notifications] Push token obtido:', token.data);
    return token.data;
  } catch (error) {
    console.error('[Notifications] Erro ao registrar notificações:', error);
    return null;
  }
}

/**
 * Define o número do badge no ícone do app
 */
export async function setBadgeCount(count: number) {
  try {
    await Notifications.setBadgeCountAsync(count);
    console.log(`[Notifications] Badge atualizado para: ${count}`);
  } catch (error) {
    console.error('[Notifications] Erro ao definir badge:', error);
  }
}

/**
 * Incrementa o badge em 1
 */
export async function incrementBadge() {
  try {
    const currentCount = await Notifications.getBadgeCountAsync();
    await setBadgeCount(currentCount + 1);
  } catch (error) {
    console.error('[Notifications] Erro ao incrementar badge:', error);
  }
}

/**
 * Limpa o badge (define como 0)
 */
export async function clearBadge() {
  try {
    await setBadgeCount(0);
  } catch (error) {
    console.error('[Notifications] Erro ao limpar badge:', error);
  }
}

/**
 * Limpa todas as notificações da central
 */
export async function clearAllNotifications() {
  try {
    await Notifications.dismissAllNotificationsAsync();
    await clearBadge();
    console.log('[Notifications] Notificações e badge limpos');
  } catch (error) {
    console.error('[Notifications] Erro ao limpar notificações:', error);
  }
}

/**
 * Obtém o número atual do badge
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('[Notifications] Erro ao obter badge count:', error);
    return 0;
  }
}
