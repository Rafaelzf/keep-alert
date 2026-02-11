import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

// ⚠️ Background Message Handler - DEVE ser configurado ANTES de registerRootComponent
// Este handler é chamado quando o app está em background ou fechado
try {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[Background] Mensagem FCM recebida:', remoteMessage);

    // Exibir notificação usando Notifee
    if (remoteMessage.data?.notifee) {
      // Se Cloud Function enviar payload Notifee completo
      await notifee.displayNotification(JSON.parse(remoteMessage.data.notifee));
    } else if (remoteMessage.notification) {
      // Fallback: construir notificação a partir de notification payload
      await notifee.displayNotification({
        title: remoteMessage.notification.title || 'Nova Notificação',
        body: remoteMessage.notification.body || '',
        data: remoteMessage.data,
        android: {
          channelId: 'critical-alerts',
          pressAction: {
            id: 'default',
          },
        },
      });
    }
  });
} catch (error) {
  console.error('❌ Erro ao configurar background message handler:', error);
  console.log('⚠️ App continuará funcionando, mas notificações em background podem não funcionar');
}

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
