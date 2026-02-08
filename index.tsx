import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import messaging from '@react-native-firebase/messaging';

// ⚠️ Background Message Handler - DEVE ser configurado ANTES de registerRootComponent
// Este handler é chamado quando o app está em background ou fechado
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[Background] Mensagem FCM recebida:', remoteMessage);

  // Aqui você pode processar a mensagem
  // NÃO pode atualizar a UI aqui (app está em background)
  // Pode salvar no AsyncStorage, fazer requisições, etc

  // Para notificações críticas, o sistema Android/iOS já exibe automaticamente
  // se a mensagem tiver o campo "notification"
});

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
