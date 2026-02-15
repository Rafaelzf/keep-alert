# 🔔 Firebase Cloud Functions - Keep Alert

Sistema automático de notificações FCM baseadas em perímetro para alertas de incidentes.

## 📋 O QUE FAZ

Quando um novo incidente é criado no Firestore:
1. ✅ Busca todos os usuários com notificações ativadas
2. ✅ Calcula distância entre incidente e localização de cada usuário
3. ✅ Se usuário estiver dentro do perímetro configurado, envia notificação FCM
4. ✅ Registra logs de sucesso/falha
5. ✅ Remove tokens FCM inválidos automaticamente

## 🚀 SETUP

### 1. Instalar Dependências

```bash
cd functions
npm install
```

### 2. Configurar Firebase CLI

```bash
# Instalar Firebase Tools globalmente
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto (se ainda não foi feito)
firebase init functions
# Selecione:
# - Use an existing project: keep-alert-799b5
# - TypeScript
# - ESLint: No (já temos)
# - Install dependencies: Yes
```

### 3. Configurar Service Account (Necessário)

A Cloud Function precisa das permissões corretas para enviar notificações FCM.

**Opção A: Automático (usa permissões padrão)**
- Nada a fazer! O Firebase Admin SDK já tem permissões quando rodando no Firebase.

**Opção B: Local/Development**
- Baixar Service Account Key do Firebase Console
- Definir variável de ambiente:
  ```bash
  export GOOGLE_APPLICATION_CREDENTIALS="../firebase/keep-alert-799b5-firebase-adminsdk-fbsvc-1be01044c5.json"
  ```

## 📦 BUILD E DEPLOY

### Build

```bash
cd functions
npm run build
```

### Deploy para Produção

```bash
cd functions
npm run deploy
```

Ou deploy de tudo (hosting + functions):
```bash
# Na raiz do projeto
firebase deploy
```

### Deploy apenas de uma função específica

```bash
firebase deploy --only functions:sendIncidentAlerts
```

## 🧪 TESTAR

### 1. Testar Localmente (Emulador)

```bash
cd functions
npm run serve
```

Depois, criar um incidente manualmente via app ou Firestore Console.

### 2. Testar em Produção

1. **Fazer rebuild do app:**
   ```bash
   npx expo prebuild --clean
   npm run android
   ```

2. **Verificar que FCM token foi salvo:**
   - Abrir app
   - Verificar logs: `📱 FCM Token obtido: ...`
   - Verificar Firestore: `users/{userId}` deve ter campo `fcmToken`

3. **Definir perímetro e ativar notificações:**
   - No app, ir em Perfil/Configurações
   - Definir raio (ex: 2km)
   - Ativar notificações

4. **Criar incidente dentro do perímetro:**
   - Criar incidente próximo à sua localização (no app ou manualmente no Firestore)

5. **Verificar logs da Cloud Function:**
   ```bash
   firebase functions:log
   ```

## 📊 ESTRUTURA DA FUNÇÃO

### Trigger
- **Tipo:** `onDocumentCreate`
- **Coleção:** `incidents`
- **Dispara:** Quando novo documento é criado

### Fluxo

```
Novo Incidente Criado
  ↓
Buscar usuários (alerts_notifications: true)
  ↓
Para cada usuário:
  ├─ Tem FCM token? ❌ → Pular
  ├─ Tem localização? ❌ → Pular
  └─ Calcular distância
       ├─ Dentro do perímetro? ✅ → Enviar FCM
       └─ Fora do perímetro? ❌ → Pular
  ↓
Registrar logs em notifications_sent
```

### Estrutura do Payload FCM

```json
{
  "notification": {
    "title": "🔥 Alerta: Incêndio",
    "body": "Incêndio detectado a 1.5km de você"
  },
  "data": {
    "incidentId": "abc123",
    "type": "fire",
    "lat": "-23.550520",
    "lng": "-46.633308",
    "distance": "1500",
    "screen": "/incidents/abc123"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channelId": "critical-alerts",
      "sound": "default",
      "priority": "max"
    }
  }
}
```

## 🔍 LOGS E DEBUGGING

### Ver logs em tempo real

```bash
firebase functions:log --only sendIncidentAlerts
```

### Ver logs no Console Firebase

https://console.firebase.google.com/project/keep-alert-799b5/functions/logs

### Estrutura dos Logs

```
=============================================================
🚨 NOVO INCIDENTE DETECTADO: abc123
📍 Categoria: fire
📍 Localização: -23.550520, -46.633308
=============================================================
🔍 Buscando usuários no perímetro...
✓ Usuário xyz está no perímetro (1200m de 2000m)
📱 2 usuário(s) no perímetro afetado
✅ Notificação enviada para xyz: projects/.../messages/123
📊 RESULTADOS:
✅ Enviadas com sucesso: 2
❌ Falhas: 0
=============================================================
```

## 📚 COLEÇÕES FIRESTORE

### `users/{userId}`
```typescript
{
  fcmToken: string,  // Token FCM do dispositivo
  last_location: {
    latitude: number,
    longitude: number
  },
  perimeter_radius: number,  // 500 | 1000 | 2000 | 5000
  alerts_notifications: boolean
}
```

### `incidents/{incidentId}`
```typescript
{
  category: string,  // "fire" | "accident" | "flood" etc
  location: {
    geopoint: { lat: number, long: number },
    geohash: string
  },
  status: string,  // "active" | "inactive"
  created_at: Timestamp
}
```

### `notifications_sent/{notificationId}` (criada automaticamente)
```typescript
{
  userId: string,
  incidentId: string,
  sentAt: Timestamp,
  status: "sent" | "failed",
  messageId?: string,
  error?: string,
  distance: number  // em metros
}
```

## ⚙️ CONFIGURAÇÕES

### Timeout (padrão: 60s)

Editar `functions/src/index.ts`:
```typescript
export const sendIncidentAlerts = functions
  .runWith({
    timeoutSeconds: 120, // 2 minutos
    memory: '256MB'
  })
  .firestore
  .document('incidents/{incidentId}')
  .onCreate(async (snap, context) => {
    // ...
  });
```

### Região (padrão: us-central1)

Para mudar região:
```typescript
export const sendIncidentAlerts = functions
  .region('southamerica-east1') // São Paulo
  .firestore
  .document('incidents/{incidentId}')
  .onCreate(async (snap, context) => {
    // ...
  });
```

## 🐛 TROUBLESHOOTING

### Notificações não estão sendo enviadas

1. **Verificar se função foi deployada:**
   ```bash
   firebase functions:list
   ```

2. **Verificar logs de erro:**
   ```bash
   firebase functions:log --only sendIncidentAlerts
   ```

3. **Verificar se usuário tem FCM token:**
   - Ir no Firestore Console
   - Abrir `users/{userId}`
   - Verificar se campo `fcmToken` existe

4. **Verificar se usuário está no perímetro:**
   - Calcular distância manualmente: https://www.movable-type.co.uk/scripts/latlong.html
   - Verificar se `perimeter_radius` está correto

### Token FCM inválido

A função remove automaticamente tokens inválidos. Logs:
```
🗑️ Removendo token inválido do usuário xyz
```

### Função com timeout

Aumentar timeout nas configurações (ver seção Configurações).

## 📈 CUSTOS

### Firebase Functions (Spark Plan - Grátis)
- ✅ 2M invocações/mês grátis
- ✅ 400.000 GB-segundos grátis
- ✅ 200.000 CPU-segundos grátis

### Blaze Plan (Pay-as-you-go)
- 💰 $0.40 por milhão de invocações
- 💰 $0.0000025 por GB-segundo
- 💰 $0.0000100 por GHz-segundo

**Estimativa para 1000 incidentes/mês:**
- Invocações: 1000
- Custo estimado: < $1/mês

## 🔐 SEGURANÇA

- ✅ Service Account tem permissões mínimas necessárias
- ✅ Tokens FCM inválidos são removidos automaticamente
- ✅ Logs registram todas as operações
- ✅ Dados sensíveis não são logados

## 📚 REFERÊNCIAS

- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events)
