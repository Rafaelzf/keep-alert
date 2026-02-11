"use strict";
/**
 * Firebase Cloud Functions para Keep Alert
 *
 * Função principal: sendIncidentAlerts
 * - Dispara quando novo incidente é criado no Firestore
 * - Busca usuários com notificações ativadas
 * - Calcula distância entre incidente e localização do usuário
 * - Envia notificação FCM se usuário estiver no perímetro
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendIncidentAlerts = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Inicializar Firebase Admin SDK
admin.initializeApp();
// ========================================
// FUNÇÕES AUXILIARES
// ========================================
/**
 * Calcula distância entre dois pontos usando fórmula de Haversine
 * @returns distância em metros
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distância em metros
}
/**
 * Retorna emoji baseado na categoria do incidente
 */
function getCategoryEmoji(category) {
    const emojiMap = {
        fire: '🔥',
        accident: '🚗',
        flood: '🌊',
        robbery: '🚨',
        violence: '⚠️',
        medical: '🏥',
        other: '📢',
    };
    return emojiMap[category] || '📢';
}
/**
 * Retorna nome legível da categoria
 */
function getCategoryName(category) {
    const nameMap = {
        fire: 'Incêndio',
        accident: 'Acidente',
        flood: 'Alagamento',
        robbery: 'Assalto',
        violence: 'Violência',
        medical: 'Emergência Médica',
        other: 'Outro',
    };
    return nameMap[category] || 'Alerta';
}
/**
 * Busca usuários que estão no perímetro do incidente
 */
async function findUsersInPerimeter(incident) {
    const usersSnapshot = await admin
        .firestore()
        .collection('users')
        .where('alerts_notifications', '==', true)
        .get();
    const usersInPerimeter = [];
    for (const doc of usersSnapshot.docs) {
        const user = doc.data();
        user.uid = doc.id;
        // ⚠️ IMPORTANTE: Não enviar notificação para o autor do incidente
        if (user.uid === incident.author.uid) {
            console.log(`⏭️ Pulando autor do incidente: ${user.uid}`);
            continue;
        }
        // Verificar se usuário tem FCM token
        if (!user.fcmToken) {
            continue;
        }
        // Verificar se usuário tem localização registrada
        if (!user.last_location) {
            continue;
        }
        // Calcular distância entre incidente e localização do usuário
        const distance = calculateDistance(incident.location.geopoint.lat, incident.location.geopoint.long, user.last_location.latitude, user.last_location.longitude);
        // Se dentro do perímetro, adiciona à lista
        if (distance <= user.perimeter_radius) {
            usersInPerimeter.push(user);
            console.log(`✓ Usuário ${user.uid} está no perímetro (${Math.round(distance)}m de ${user.perimeter_radius}m)`);
        }
    }
    return usersInPerimeter;
}
/**
 * Envia notificação FCM para um usuário
 */
async function sendFCMNotification(user, incident, incidentId, distance) {
    if (!user.fcmToken) {
        console.warn(`❌ Usuário ${user.uid} não tem FCM token`);
        return;
    }
    const emoji = getCategoryEmoji(incident.category);
    const categoryName = getCategoryName(incident.category);
    const distanceKm = (distance / 1000).toFixed(1);
    // Construir payload da mensagem
    const message = {
        token: user.fcmToken,
        notification: {
            title: `${emoji} Alerta: ${categoryName}`,
            body: `${categoryName} detectado a ${distanceKm}km de você`,
        },
        data: {
            incidentId: incidentId,
            type: incident.category,
            lat: String(incident.location.geopoint.lat),
            lng: String(incident.location.geopoint.long),
            distance: String(Math.round(distance)),
            screen: `/incidents/${incidentId}`,
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
            },
        },
        apns: {
            headers: {
                'apns-priority': '10',
            },
            payload: {
                aps: {
                    sound: 'default',
                    badge: 1,
                    alert: {
                        title: `${emoji} Alerta: ${categoryName}`,
                        body: `${categoryName} detectado a ${distanceKm}km de você`,
                    },
                },
            },
        },
    };
    try {
        const response = await admin.messaging().send(message);
        console.log(`✅ Notificação enviada para ${user.uid}: ${response}`);
        // Salvar log da notificação enviada
        await admin
            .firestore()
            .collection('notifications_sent')
            .add({
            userId: user.uid,
            incidentId: incidentId,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'sent',
            messageId: response,
            distance: Math.round(distance),
        });
    }
    catch (error) {
        console.error(`❌ Erro ao enviar para ${user.uid}:`, error);
        // Se token inválido, remover do usuário
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            console.log(`🗑️ Removendo token inválido do usuário ${user.uid}`);
            await admin
                .firestore()
                .collection('users')
                .doc(user.uid)
                .update({
                fcmToken: admin.firestore.FieldValue.delete(),
            });
        }
        // Salvar log de erro
        await admin
            .firestore()
            .collection('notifications_sent')
            .add({
            userId: user.uid,
            incidentId: incidentId,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'failed',
            error: error.message,
            distance: Math.round(distance),
        });
        throw error;
    }
}
// ========================================
// CLOUD FUNCTION PRINCIPAL
// ========================================
/**
 * Cloud Function que dispara quando novo incidente é criado
 * Envia notificações para usuários no perímetro afetado
 */
exports.sendIncidentAlerts = functions.firestore
    .document('incidents/{incidentId}')
    .onCreate(async (snap, context) => {
    const incidentId = context.params.incidentId;
    const incident = snap.data();
    console.log('');
    console.log('='.repeat(60));
    console.log(`🚨 NOVO INCIDENTE DETECTADO: ${incidentId}`);
    console.log(`📍 Categoria: ${incident.category}`);
    console.log(`📍 Localização: ${incident.location.geopoint.lat}, ${incident.location.geopoint.long}`);
    console.log('='.repeat(60));
    try {
        // 1. Buscar usuários no perímetro
        console.log('🔍 Buscando usuários no perímetro...');
        const usersInPerimeter = await findUsersInPerimeter(incident);
        if (usersInPerimeter.length === 0) {
            console.log('ℹ️ Nenhum usuário no perímetro afetado');
            return null;
        }
        console.log(`📱 ${usersInPerimeter.length} usuário(s) no perímetro afetado`);
        // 2. Enviar notificações
        const notifications = usersInPerimeter.map((user) => {
            const distance = calculateDistance(incident.location.geopoint.lat, incident.location.geopoint.long, user.last_location.latitude, user.last_location.longitude);
            return sendFCMNotification(user, incident, incidentId, distance);
        });
        const results = await Promise.allSettled(notifications);
        // 3. Log de resultados
        const successful = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;
        console.log('');
        console.log('📊 RESULTADOS:');
        console.log(`✅ Enviadas com sucesso: ${successful}`);
        console.log(`❌ Falhas: ${failed}`);
        console.log('='.repeat(60));
        console.log('');
        return null;
    }
    catch (error) {
        console.error('❌ Erro ao processar incidente:', error);
        throw error;
    }
});
//# sourceMappingURL=index.js.map