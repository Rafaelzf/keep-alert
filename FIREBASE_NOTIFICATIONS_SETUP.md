# 🔔 Firebase Cloud Messaging - Setup Completo

## ✅ O QUE FOI CONFIGURADO

### 1. **Dependências Instaladas**
- ✅ `@react-native-firebase/messaging@23.8.5`
- ✅ Removido: `expo-notifications` (substituído por FCM puro)

### 2. **Arquivos Configurados**

#### `app.json`
- ✅ Adicionado plugin `@react-native-firebase/messaging`
- ✅ Permissão `POST_NOTIFICATIONS` (Android 13+)
- ✅ Referências para `google-services.json` e `GoogleService-Info.plist`

#### `firebase.json` (NOVO)
```json
{
  "react-native": {
    "messaging_android_notification_channel_id": "critical-alerts",
    "messaging_android_headless_task_timeout": 60000,
    "messaging_ios_auto_register_for_remote_messages": true
  }
}
```

#### `index.tsx`
- ✅ Background message handler configurado
- ⚠️ **CRÍTICO**: Deve estar ANTES de `registerRootComponent()`

#### `hooks/useNotifications.ts` (NOVO)
- ✅ Hook completo para gerenciar notificações FCM
- ✅ Solicitar permissões (Android 13+ e iOS)
- ✅ Obter token FCM
- ✅ Listeners para mensagens (foreground/background/quit)
- ✅ Deep linking ao clicar em notificação
- ✅ Auto-refresh de token

---

## 🚀 COMO USAR NO SEU APP

### 1. **Integrar no Layout Principal**

Edite `app/_layout.tsx`:

```typescript
import { useNotifications } from '@/hooks/useNotifications';
import { useEffect } from 'react';

export default function RootLayout() {
  const { fcmToken, isLoading, hasPermission } = useNotifications();

  useEffect(() => {
    if (fcmToken) {
      console.log('✅ Token FCM registrado:', fcmToken);
      // TODO: Salvar token no Firestore junto com userId e perímetro
      // saveFCMTokenToFirestore(fcmToken);
    }
  }, [fcmToken]);

  if (isLoading) {
    return <Text>Configurando notificações...</Text>;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? NAV_THEME.dark : NAV_THEME.light}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="index" />
        {/* ... outras rotas */}
      </Stack>
      <PortalHost />
    </ThemeProvider>
  );
}
```

### 2. **Salvar Token no Firestore**

Quando usuário fizer login ou definir perímetro:

```typescript
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

async function saveFCMTokenToFirestore(token: string, perimeter: any) {
  const userId = auth().currentUser?.uid;
  if (!userId) return;

  await firestore()
    .collection('users')
    .doc(userId)
    .set({
      fcmToken: token,
      perimeter: {
        center: { lat: perimeter.lat, lng: perimeter.lng },
        radius: perimeter.radius, // em metros
      },
      notificationPreferences: {
        enabled: true,
        types: ['fire', 'flood', 'accident', 'storm'], // tipos de incidentes
      },
      updatedAt: firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}
```

---

## 📱 COMPORTAMENTO POR ESTADO DO APP

| Estado do App | Comportamento |
|--------------|---------------|
| **Foreground (aberto)** | `messaging().onMessage()` dispara → Você controla exibição |
| **Background (minimizado)** | Sistema exibe notificação automaticamente → Clique chama `onNotificationOpenedApp()` |
| **Quit (fechado)** | Sistema exibe notificação automaticamente → Clique chama `getInitialNotification()` |

---

## 🔥 FORMATO DA MENSAGEM FCM (Para enviar do servidor)

### Mensagem Híbrida (Notification + Data) - RECOMENDADO

```json
{
  "token": "fcm_device_token_aqui",
  "notification": {
    "title": "🚨 Alerta: Incêndio",
    "body": "Incêndio detectado a 500m de você"
  },
  "data": {
    "incidentId": "abc123",
    "type": "fire",
    "severity": "critical",
    "lat": "-23.550520",
    "lng": "-46.633308",
    "screen": "/incidents/abc123"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channelId": "critical-alerts",
      "sound": "default",
      "priority": "max",
      "defaultSound": true,
      "defaultVibrateTimings": false,
      "vibrateTimingsMillis": [0, 250, 250, 250],
      "color": "#DC2626"
    }
  },
  "apns": {
    "headers": {
      "apns-priority": "10"
    },
    "payload": {
      "aps": {
        "sound": "default",
        "badge": 1,
        "alert": {
          "title": "🚨 Alerta: Incêndio",
          "body": "Incêndio detectado a 500m de você"
        },
        "interruption-level": "critical"
      }
    }
  }
}
```

---

## 🔧 CANAL DE NOTIFICAÇÃO ANDROID (Avançado)

Para controle total sobre canais Android (som, vibração, LED, bypass DND), instale **Notifee**:

```bash
npm install @notifee/react-native
```

Depois, crie o canal programaticamente:

```typescript
import notifee, { AndroidImportance } from '@notifee/react-native';

async function createNotificationChannel() {
  await notifee.createChannel({
    id: 'critical-alerts',
    name: 'Alertas Críticos',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [300, 500],
    lights: true,
    lightColor: '#DC2626',
    bypassDnd: true, // Bypass "Não Perturbe"
  });
}
```

**⚠️ Isso é OPCIONAL** - O Android já cria um canal padrão automaticamente.

---

## 🔄 PRÓXIMOS PASSOS

### ✅ FASE 1: Configuração (CONCLUÍDA)
- ✅ Dependências instaladas
- ✅ `app.json` configurado
- ✅ `firebase.json` criado
- ✅ Background handler configurado
- ✅ Hook `useNotifications` criado

### ⏳ FASE 2: Integração no App (VOCÊ PRECISA FAZER)
- [ ] Integrar `useNotifications` no `_layout.tsx`
- [ ] Salvar FCM token no Firestore quando usuário logar
- [ ] Atualizar token quando usuário definir perímetro
- [ ] **REBUILD do app** (obrigatório!)

### ⏳ FASE 3: Cloud Functions (Backend)
- [ ] Criar Cloud Function `onIncidentCreate`
- [ ] Buscar usuários no perímetro afetado
- [ ] Enviar notificações via Firebase Admin SDK
- [ ] Lidar com tokens inválidos

---

## 🛠️ REBUILD OBRIGATÓRIO

Como adicionamos plugin nativo, você **DEVE fazer rebuild**:

```bash
# Opção 1: Rebuild local
npx expo prebuild --clean
npm run android  # ou npm run ios

# Opção 2: EAS Build (recomendado)
eas build --platform android --profile development
eas build --platform ios --profile development
```

**⚠️ SEM REBUILD, AS NOTIFICAÇÕES NÃO FUNCIONARÃO!**

---

## 🧪 TESTAR

### 1. **Obter FCM Token**
- Rodar app em device físico
- Verificar console: `📱 FCM Token obtido: ...`
- Copiar o token

### 2. **Enviar Notificação de Teste**

Usar Firebase Console:
1. Firebase Console → Cloud Messaging
2. "Send your first message"
3. Colar o token FCM
4. Enviar

Ou via cURL:
```bash
curl -X POST https://fcm.googleapis.com/v1/projects/keep-alert-799b5/messages:send \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "SEU_FCM_TOKEN_AQUI",
      "notification": {
        "title": "Teste",
        "body": "Funcionou!"
      }
    }
  }'
```

---

## 📚 REFERÊNCIAS

- [React Native Firebase Messaging](https://rnfirebase.io/messaging/usage)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Notifee (Notificações locais avançadas)](https://notifee.app/)
