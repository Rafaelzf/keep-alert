# FCM Topic Messaging por Geohash — Documentação de Implementação

## Visão Geral

Este documento descreve a arquitetura de notificações de alertas implementada no Keep Alert.
O objetivo é servir de guia para futuras implementações (ex: ajustes para iOS).

---

## Problema que resolvemos

### Sistema anterior (legado)
```
Incidente criado
    ↓
Cloud Function busca TODOS os usuários no Firestore (full-scan)
    ↓
Para cada usuário: calcula distância individualmente
    ↓
Envia N requisições FCM (uma por usuário)
```

**Problemas:**
- Não escalável: com 10.000 usuários, são 10.000 chamadas FCM por incidente
- Notificações `notification` messages podiam ser suprimidas pelo Android em Doze mode
- Sem garantia de entrega quando o app estava em background

### Sistema novo
```
Incidente criado
    ↓
Cloud Function envia 1 mensagem para tópico FCM "alerts_{geohash5}"
    ↓
FCM distribui para todos os devices inscritos no tópico
    ↓
Cada device filtra: distância ≤ perímetro do usuário?
    ├── SIM → exibe notificação local
    └── NÃO → descarta silenciosamente
```

**Vantagens:**
- 1 chamada FCM independente do número de usuários
- `data-only messages` com high-priority: acordam o app mesmo em Doze mode (Android)
- Filtro de perímetro preciso feito no cliente
- Escalável para milhões de usuários

---

## Conceitos Fundamentais

### Geohash
O geohash divide o planeta em células retangulares usando uma string de caracteres.
Quanto maior a string, menor (mais precisa) a célula.

| Precisão | Dimensão aprox. | Uso no projeto |
|---|---|---|
| 4 chars | ~40x20 km | — |
| 5 chars | ~5x5 km | **Tópicos FCM** |
| 9 chars | ~5x5 m | Armazenamento do incidente |

O incidente salva geohash de **precisão 9** no Firestore (gerado pelo cliente).
A Cloud Function usa `geohash9.substring(0, 5)` para obter o geohash5 do tópico.

### Células vizinhas (neighbors)
Um incidente pode ocorrer **na borda** de uma célula geohash5.
Um usuário a 400m de distância pode estar em uma célula **adjacente**.

Solução: o usuário se inscreve em **9 tópicos** = célula atual + 8 vizinhos.

```
┌─────────┬─────────┬─────────┐
│  NW     │   N     │   NE    │
├─────────┼─────────┼─────────┤
│   W     │ CENTRO  │    E    │  ← usuário aqui
├─────────┼─────────┼─────────┤
│  SW     │   S     │   SE    │
└─────────┴─────────┴─────────┘
```

### FCM Data-Only Messages vs Notification Messages

| | Notification Message | Data-Only Message |
|---|---|---|
| Exibição | FCM exibe automaticamente | App exibe manualmente |
| Android Doze mode | Pode ser suprimida | Acorda o app (high-priority) |
| Controle no cliente | Limitado | Total |
| Filtro de perímetro | Impossível antes de exibir | Possível antes de exibir |

**Usamos Data-Only** para ter controle total: o app recebe, calcula a distância, decide se mostra.

---

## Arquitetura Completa

### Fluxo de inscrição nos tópicos

```
Usuário faz login
    ↓
onAuthStateChanged → getUserFromFirestore
    ↓
Hidrata AsyncStorage:
  - user_last_location = { latitude, longitude }
  - user_perimeter_radius = "500" (ou 1000, 2000, 5000)
  - user_alerts_notifications = "true"
    ↓
subscribeToGeohashTopics(lat, lng)
  → encode(lat, lng, 5) = geohash5
  → neighbors(geohash5) = [N, NE, E, SE, S, SW, W, NW]
  → subscribeToTopic("alerts_XXXXX") × 9
  → AsyncStorage.setItem("fcm_subscribed_geohash5", geohash5)
```

### Fluxo quando a localização muda

```
updateUserLocation(latitude, longitude)
    ↓
Salva no Firestore
    ↓
AsyncStorage.setItem("user_last_location", { latitude, longitude })
    ↓
subscribeToGeohashTopics(latitude, longitude)
  → Novo geohash5 === geohash5 anterior? → skip (sem mudança de célula)
  → Diferente? → unsubscribeFromGeohashTopics(anterior) → subscribe nos 9 novos
```

### Fluxo de emissão de alerta

```
reportIncident() → salva incidente no Firestore
    ↓
Cloud Function sendIncidentAlerts (onCreate)
    ↓
incident.location.geohash.substring(0, 5) = geohash5
    ↓
admin.messaging().send({
  topic: "alerts_{geohash5}",
  data: { title, body, incidentId, category, lat, lng, screen },
  android: { priority: 'high' },
  apns: { headers: { 'apns-priority': '10', 'apns-push-type': 'background' },
           payload: { aps: { 'content-available': 1 } } }
})
```

### Fluxo de recebimento — App em background

```
FCM entrega data message ao device
    ↓
index.tsx → setBackgroundMessageHandler (registrado antes do React montar)
    ↓
Lê do AsyncStorage:
  - user_last_location
  - user_perimeter_radius
  - user_alerts_notifications
    ↓
alerts_notifications === false? → return (descarta)
locationRaw === null? → return (sem localização conhecida)
    ↓
Calcula distância Haversine:
  distance = haversineMeters(userLat, userLng, incidentLat, incidentLng)
    ↓
distance > perimeter_radius? → return (descarta)
    ↓
Notifications.scheduleNotificationAsync({ trigger: null }) → exibe imediatamente
```

### Fluxo de recebimento — App em foreground

```
FCM entrega data message ao device
    ↓
hooks/useNotifications.ts → messaging().onMessage()
    ↓
Lê do React Context (useSession):
  - user.last_location
  - user.perimeter_radius
  - user.alerts_notifications
    ↓
alerts_notifications === false? → return (descarta)
    ↓
Calcula distância via calculateDistance() de lib/locations.ts
    ↓
distance > user.perimeter_radius? → return (descarta)
    ↓
Notifications.scheduleNotificationAsync({ trigger: null }) → exibe imediatamente
incrementBadge()
```

### Fluxo de logout

```
signOut()
    ↓
unsubscribeFromGeohashTopics()
  → Lê geohash5 do AsyncStorage
  → unsubscribeFromTopic("alerts_XXXXX") × 9
  → AsyncStorage.removeItem("fcm_subscribed_geohash5")
    ↓
AsyncStorage.removeItem(user_last_location)
AsyncStorage.removeItem(user_perimeter_radius)
AsyncStorage.removeItem(user_alerts_notifications)
    ↓
firebaseSignOut()
```

---

## Arquivos Modificados

| Arquivo | Responsabilidade |
|---|---|
| `functions/src/index.ts` | Cloud Function: envia 1 mensagem para tópico geohash5 |
| `lib/fcm.ts` | `subscribeToGeohashTopics` e `unsubscribeFromGeohashTopics` |
| `index.tsx` | Background message handler (antes do React montar) |
| `components/auth/ctx.tsx` | Sincroniza AsyncStorage; aciona subscribe/unsubscribe |
| `hooks/useNotifications.ts` | Foreground message handler com filtro de perímetro |

---

## Chaves AsyncStorage

Estas chaves são compartilhadas entre o React Context (`ctx.tsx`) e o background handler (`index.tsx`).
**O nome deve ser idêntico nos dois arquivos.**

| Chave | Tipo | Exemplo |
|---|---|---|
| `user_last_location` | JSON string | `{"latitude":-23.55,"longitude":-46.63}` |
| `user_perimeter_radius` | string numérica | `"500"` |
| `user_alerts_notifications` | `"true"` ou `"false"` | `"true"` |
| `fcm_subscribed_geohash5` | string geohash | `"6gyf4"` |

---

## Configuração FCM por Plataforma

### Android (implementado)

```typescript
android: {
  priority: 'high',  // acorda o app em Doze mode
}
```

No `AndroidManifest.xml` (gerado pelo Expo), o serviço FCM já está registrado.
O canal de notificação `critical-alerts` é criado em `lib/notifications.ts`.

### iOS (a implementar)

```typescript
apns: {
  headers: {
    'apns-priority': '10',           // prioridade máxima
    'apns-push-type': 'background',  // indica background processing
  },
  payload: {
    aps: {
      'content-available': 1,  // acorda o app em background (Background App Refresh)
    },
  },
}
```

**Requisitos adicionais para iOS:**
1. **Capability** — ativar `Background Modes > Remote notifications` no Xcode
2. **Entitlement** — `aps-environment: production` no `.entitlements` (EAS configura automaticamente)
3. **Background App Refresh** — o usuário precisa ter habilitado nas configurações do iPhone
4. **APNs key** — configurada no Firebase Console (projeto > Cloud Messaging > APNs)
5. O `setBackgroundMessageHandler` em `index.tsx` **já funciona para iOS** — nenhuma mudança necessária
6. No iOS, `content-available: 1` sem `alert` no payload é um **silent push** — o handler executa mas sem notificação visual automática (exatamente o que queremos, pois usamos `scheduleNotificationAsync`)

**Limitação iOS:** o sistema pode throttle silent pushes se o app for usado raramente. Não há solução de app-level para isso — é uma restrição do sistema operacional.

---

## Biblioteca ngeohash

Usada no cliente para calcular geohash e vizinhos.

```typescript
import { encode, neighbors } from 'ngeohash';

const geohash5 = encode(-23.5505, -46.6333, 5); // "6gyf4"
const neighborList = neighbors(geohash5);
// Retorna array de 8 strings: [N, NE, E, SE, S, SW, W, NW]
// Combinando com o centro: 9 tópicos no total
```

**Nas Cloud Functions:** não instalar `ngeohash`. Usar `substring(0, 5)` do geohash9 que já vem no documento do incidente.

---

## Pontos de Atenção

### O background handler deve ser o primeiro código a rodar
Em `index.tsx`, o `messaging().setBackgroundMessageHandler()` deve estar **fora de qualquer função React**, no escopo global do módulo, **antes** de `registerRootComponent`. Caso contrário, o Firebase não consegue registrá-lo para execução em background.

### Sem acesso ao React Context no background
O handler de background roda em um contexto JavaScript separado (sem React). Por isso usamos `AsyncStorage` como ponte de dados entre o React (`ctx.tsx`) e o handler (`index.tsx`).

### Re-subscribe é idempotente
`subscribeToGeohashTopics` verifica se o `geohash5` mudou antes de executar. Se o usuário se moveu dentro da mesma célula de ~5km, nenhuma chamada FCM é feita. Isso evita subscrições desnecessárias a cada update de GPS.

### O autor do incidente também recebe a notificação
Com topic messaging, não é possível excluir o autor na Cloud Function (diferente do modelo anterior). O cliente poderia verificar `data.authorUid !== user.uid` antes de exibir — a Cloud Function precisaria incluir `authorUid` no payload `data`.

### Degradação graciosa
Se `subscribeToTopic` falhar (ex: FCM token não registrado ainda), o erro é capturado silenciosamente. Na próxima atualização de localização, uma nova tentativa será feita.
