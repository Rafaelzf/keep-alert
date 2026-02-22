/**
 * Firebase Cloud Functions para Keep Alert
 *
 * sendIncidentAlerts      — dispara ao criar incidente, envia FCM via topic para a área do incidente
 * handleFalseAccusationBan — dispara ao atualizar incidente, aplica banimento ao atingir 3 votos de falsa acusação
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// ========================================
// INTERFACES
// ========================================

interface IncidentLocation {
  geopoint: { lat: number; long: number };
  geohash: string;
}

interface IncidentSituation {
  police_on_way: number;
  ambulance_on_way: number;
  police_on_site: number;
  ambulance_on_site: number;
  firemen_on_way: number;
  firemen_on_site: number;
  situation_resolved: number;
  false_accusation: number;
}

interface Incident {
  category: string;
  description: string;
  location: IncidentLocation;
  status: string;
  author: { uid: string; name: string };
  author_ref?: admin.firestore.DocumentReference;
  situtation?: IncidentSituation;
  created_at: admin.firestore.Timestamp;
}

interface UserProfile {
  uid: string;
  name?: string;
  strike_count: number;
  status: string;
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    fire: '🔥',
    accident: '🚗',
    flood: '🌊',
    robbery: '🚨',
    violence: '⚠️',
    medical: '🏥',
    other: '📢',
  };
  return map[category] || '📢';
}

function getCategoryName(category: string): string {
  const map: Record<string, string> = {
    fire: 'Incêndio',
    accident: 'Acidente',
    flood: 'Alagamento',
    robbery: 'Assalto',
    violence: 'Violência',
    medical: 'Emergência Médica',
    other: 'Outro',
  };
  return map[category] || 'Alerta';
}

/**
 * Envia uma única mensagem FCM data-only para o tópico geohash5 do incidente.
 * O cliente é responsável por calcular a distância e exibir a notificação local.
 */
async function sendTopicAlert(incident: Incident, incidentId: string): Promise<void> {
  const emoji = getCategoryEmoji(incident.category);
  const categoryName = getCategoryName(incident.category);

  // Trunca o geohash precision-9 (salvo pelo cliente) para precision-5 (~5x5km)
  const geohash5 = incident.location.geohash.substring(0, 5);
  const topic = `alerts_${geohash5}`;

  // Payload data-only: sem campo "notification"
  // O cliente exibe a notificação local após filtrar pelo perímetro do usuário
  const message: admin.messaging.Message = {
    topic,
    data: {
      title: `${emoji} Alerta: ${categoryName}`,
      body: `Novo alerta de ${categoryName} na sua área`,
      incidentId,
      category: incident.category,
      lat: String(incident.location.geopoint.lat),
      lng: String(incident.location.geopoint.long),
      screen: `/incidents/${incidentId}`,
    },
    android: {
      priority: 'high',
    },
    apns: {
      headers: { 'apns-priority': '10', 'apns-push-type': 'background' },
      payload: { aps: { 'content-available': 1 } },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`✅ Topic message enviado para "${topic}": ${response}`);

    await admin.firestore().collection('notifications_sent').add({
      incidentId,
      topic,
      geohash5,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'sent',
      messageId: response,
    });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error(`❌ Erro ao enviar para topic "${topic}":`, err);

    await admin.firestore().collection('notifications_sent').add({
      incidentId,
      topic,
      geohash5,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'failed',
      error: err.message,
    });

    throw error;
  }
}

// ========================================
// CLOUD FUNCTION 1: Alertas de novo incidente
// ========================================

export const sendIncidentAlerts = functions.firestore
  .document('incidents/{incidentId}')
  .onCreate(async (snap, context) => {
    const incidentId = context.params.incidentId;
    const incident = snap.data() as Incident;

    console.log('='.repeat(60));
    console.log(`🚨 NOVO INCIDENTE: ${incidentId} — ${incident.category}`);
    console.log('='.repeat(60));

    if (!incident.location?.geohash || incident.location.geohash.length < 5) {
      console.error('❌ Incidente sem geohash válido:', incidentId);
      return null;
    }

    try {
      await sendTopicAlert(incident, incidentId);
      console.log(`📡 Alerta enviado via topic para geohash5: ${incident.location.geohash.substring(0, 5)}`);
      return null;
    } catch (error) {
      console.error('❌ Erro ao processar incidente:', error);
      throw error;
    }
  });

// ========================================
// CLOUD FUNCTION 2: Banimento por falsa acusação
// ========================================

/**
 * Dispara ao atualizar um incidente.
 * Quando false_accusation cruza o threshold de 3 votos pela primeira vez:
 *   1. Incrementa strike_count do autor
 *   2. Bane o autor se strike_count >= 3
 *   3. Marca o incidente como inativo
 */
export const handleFalseAccusationBan = functions.firestore
  .document('incidents/{incidentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as Incident;
    const after = change.after.data() as Incident;
    const incidentId = context.params.incidentId;

    const falseBefore = before.situtation?.false_accusation ?? 0;
    const falseAfter = after.situtation?.false_accusation ?? 0;

    // Só age ao cruzar o threshold de 3 pela primeira vez
    if (falseBefore >= 3 || falseAfter < 3) {
      return null;
    }

    console.log('='.repeat(60));
    console.log(`⚠️ [handleFalseAccusationBan] Incidente ${incidentId}: ${falseBefore} → ${falseAfter} votos`);
    console.log('='.repeat(60));

    try {
      const db = admin.firestore();

      // 1. Valida referência do autor
      const authorRef = after.author_ref;
      if (!authorRef) {
        console.error('[handleFalseAccusationBan] author_ref ausente no incidente');
        return null;
      }

      const authorDoc = await authorRef.get();
      if (!authorDoc.exists) {
        console.error('[handleFalseAccusationBan] Documento do autor não encontrado');
        return null;
      }

      const authorData = authorDoc.data() as UserProfile;
      const currentStrikes = authorData.strike_count || 0;
      const newStrikes = currentStrikes + 1;

      console.log(
        `[handleFalseAccusationBan] Autor ${authorData.name ?? authorDoc.id}: strikes ${currentStrikes} → ${newStrikes}`
      );

      // 2. Incrementa strikes do autor
      const authorUpdate: Record<string, unknown> = {
        strike_count: newStrikes,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      // 3. Bane se atingiu 3 strikes
      if (newStrikes >= 3) {
        authorUpdate.status = 'Banned';
        console.log(`[handleFalseAccusationBan] Autor ${authorData.name ?? authorDoc.id} BANIDO`);
      }

      await authorRef.update(authorUpdate);

      // 4. Marca incidente como inativo
      await db.collection('incidents').doc(incidentId).update({
        status: 'inactive',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`[handleFalseAccusationBan] Incidente ${incidentId} marcado como inativo`);
      return null;
    } catch (error) {
      console.error('[handleFalseAccusationBan] Erro:', error);
      throw error;
    }
  });
