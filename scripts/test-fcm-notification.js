/**
 * Script de Teste: Enviar Notificação FCM via HTTP v1 API
 *
 * Como usar:
 * 1. Fazer rebuild do app: npx expo prebuild --clean && npm run android
 * 2. Copiar o FCM Token do console (quando app rodar)
 * 3. Executar: node scripts/test-fcm-notification.js SEU_FCM_TOKEN_AQUI
 */

const { GoogleAuth } = require('google-auth-library');
const path = require('path');

// Configurações
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../firebase/keep-alert-799b5-firebase-adminsdk-fbsvc-1be01044c5.json');
const PROJECT_ID = 'keep-alert-799b5';
const FCM_ENDPOINT = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

/**
 * Obter Access Token OAuth 2.0 usando Service Account
 */
async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });

  const client = await auth.getClient();
  const accessTokenResponse = await client.getAccessToken();

  return accessTokenResponse.token;
}

/**
 * Enviar notificação FCM
 */
async function sendFCMNotification(fcmToken, options = {}) {
  try {
    console.log('🔐 Obtendo access token OAuth 2.0...');
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtido!');

    // Payload da mensagem FCM
    const message = {
      message: {
        token: fcmToken,
        notification: {
          title: options.title || '🚨 Teste Keep Alert',
          body: options.body || 'Esta é uma notificação de teste do Firebase Cloud Messaging!',
        },
        data: {
          incidentId: options.incidentId || 'test-123',
          type: options.type || 'test',
          severity: options.severity || 'high',
          screen: '/incidents/test-123',
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'critical-alerts',
            sound: 'default',
            priority: 'max',
            defaultSound: true,
            defaultVibrateTimings: false,
            vibrateTimingsMillis: [0, 250, 250, 250],
            color: '#DC2626',
            icon: 'ic_launcher',
          },
        },
      },
    };

    console.log('📤 Enviando notificação FCM...');
    console.log('📱 Token:', fcmToken.substring(0, 20) + '...');

    const response = await fetch(FCM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Notificação enviada com sucesso!');
      console.log('📨 Message ID:', result.name);
      return result;
    } else {
      console.error('❌ Erro ao enviar notificação:');
      console.error('Status:', response.status);
      console.error('Erro:', JSON.stringify(result, null, 2));
      throw new Error(result.error?.message || 'Erro desconhecido');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

/**
 * Função principal
 */
async function main() {
  const fcmToken = process.argv[2];

  if (!fcmToken) {
    console.error('❌ Erro: FCM Token não fornecido!');
    console.log('');
    console.log('📖 Como usar:');
    console.log('   node scripts/test-fcm-notification.js SEU_FCM_TOKEN_AQUI');
    console.log('');
    console.log('💡 Como obter o FCM Token:');
    console.log('   1. Fazer rebuild: npx expo prebuild --clean && npm run android');
    console.log('   2. Verificar console do app');
    console.log('   3. Copiar o token que aparece: "📱 FCM Token obtido: ..."');
    process.exit(1);
  }

  console.log('');
  console.log('🚀 Iniciando teste de notificação FCM...');
  console.log('═══════════════════════════════════════════');

  await sendFCMNotification(fcmToken, {
    title: '🚨 Alerta: Incêndio',
    body: 'Incêndio detectado a 500m de você no Centro',
    incidentId: 'test-incident-123',
    type: 'fire',
    severity: 'critical',
  });

  console.log('═══════════════════════════════════════════');
  console.log('✅ Teste concluído!');
  console.log('');
}

// Executar
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { sendFCMNotification, getAccessToken };
