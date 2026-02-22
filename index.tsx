import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// =====================================================================
// BACKGROUND MESSAGE HANDLER
// Deve ser registrado aqui, no escopo global do módulo,
// ANTES de registerRootComponent(). Não tem acesso ao React Context.
// Lê localização e perímetro do AsyncStorage para filtrar notificações.
// =====================================================================

const LOCATION_KEY = 'user_last_location';
const PERIMETER_KEY = 'user_perimeter_radius';
const NOTIFICATIONS_KEY = 'user_alerts_notifications';

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[BG Handler] Mensagem recebida:', remoteMessage.messageId);

  const data = remoteMessage.data;
  if (!data) return;

  const [locationRaw, perimeterRaw, notificationsRaw] = await Promise.all([
    AsyncStorage.getItem(LOCATION_KEY),
    AsyncStorage.getItem(PERIMETER_KEY),
    AsyncStorage.getItem(NOTIFICATIONS_KEY),
  ]);

  if (notificationsRaw === 'false') {
    console.log('[BG Handler] Notificações desabilitadas, ignorando');
    return;
  }

  if (!locationRaw || !perimeterRaw) {
    console.log('[BG Handler] Localização ou perímetro indisponível, ignorando');
    return;
  }

  const { latitude, longitude } = JSON.parse(locationRaw);
  const perimeter = parseInt(perimeterRaw, 10);
  const incidentLat = parseFloat(String(data.lat));
  const incidentLng = parseFloat(String(data.lng));

  if (isNaN(incidentLat) || isNaN(incidentLng) || isNaN(perimeter)) {
    console.log('[BG Handler] Dados inválidos no payload, ignorando');
    return;
  }

  const distance = haversineMeters(latitude, longitude, incidentLat, incidentLng);
  console.log(`[BG Handler] Distância: ${Math.round(distance)}m / perímetro: ${perimeter}m`);

  if (distance > perimeter) {
    console.log('[BG Handler] Incidente fora do perímetro, descartando');
    return;
  }

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

  console.log('[BG Handler] Notificação local agendada para incidente:', data.incidentId);
});

// =====================================================================
// APP ROOT
// =====================================================================

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
