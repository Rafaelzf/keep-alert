"use strict";
/**
 * Firebase Cloud Functions para Keep Alert
 *
 * sendIncidentAlerts      — dispara ao criar incidente, envia FCM para usuários no perímetro
 * handleFalseAccusationBan — dispara ao atualizar incidente, aplica banimento ao atingir 3 votos de falsa acusação
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
exports.handleFalseAccusationBan = exports.sendIncidentAlerts = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// ========================================
// FUNÇÕES AUXILIARES
// ========================================
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function getCategoryEmoji(category) {
    const map = {
        fire: '🔥', accident: '🚗', flood: '🌊',
        robbery: '🚨', violence: '⚠️', medical: '🏥', other: '📢',
    };
    return map[category] || '📢';
}
function getCategoryName(category) {
    const map = {
        fire: 'Incêndio', accident: 'Acidente', flood: 'Alagamento',
        robbery: 'Assalto', violence: 'Violência', medical: 'Emergência Médica', other: 'Outro',
    };
    return map[category] || 'Alerta';
}
async function findUsersInPerimeter(incident) {
    const snapshot = await admin.firestore()
        .collection('users')
        .where('alerts_notifications', '==', true)
        .get();
    const result = [];
    for (const docSnap of snapshot.docs) {
        const user = docSnap.data();
        user.uid = docSnap.id;
        if (user.uid === incident.author.uid)
            continue;
        if (!user.fcmToken || !user.last_location)
            continue;
        const distance = calculateDistance(incident.location.geopoint.lat, incident.location.geopoint.long, user.last_location.latitude, user.last_location.longitude);
        if (distance <= user.perimeter_radius) {
            result.push(user);
            console.log(`✓ Usuário ${user.uid} no perímetro (${Math.round(distance)}m / ${user.perimeter_radius}m)`);
        }
    }
    return result;
}
async function sendFCMNotification(user, incident, incidentId, distance) {
    if (!user.fcmToken)
        return;
    const emoji = getCategoryEmoji(incident.category);
    const categoryName = getCategoryName(incident.category);
    const distanceKm = (distance / 1000).toFixed(1);
    const message = {
        token: user.fcmToken,
        notification: {
            title: `${emoji} Alerta: ${categoryName}`,
            body: `${categoryName} detectado a ${distanceKm}km de você`,
        },
        data: {
            incidentId,
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
            headers: { 'apns-priority': '10' },
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
        await admin.firestore().collection('notifications_sent').add({
            userId: user.uid,
            incidentId,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'sent',
            messageId: response,
            distance: Math.round(distance),
        });
    }
    catch (error) {
        const err = error;
        console.error(`❌ Erro ao enviar para ${user.uid}:`, err);
        if (err.code === 'messaging/invalid-registration-token' ||
            err.code === 'messaging/registration-token-not-registered') {
            await admin.firestore().collection('users').doc(user.uid).update({
                fcmToken: admin.firestore.FieldValue.delete(),
            });
        }
        await admin.firestore().collection('notifications_sent').add({
            userId: user.uid,
            incidentId,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'failed',
            error: err.message,
            distance: Math.round(distance),
        });
        throw error;
    }
}
// ========================================
// CLOUD FUNCTION 1: Alertas de novo incidente
// ========================================
exports.sendIncidentAlerts = functions.firestore
    .document('incidents/{incidentId}')
    .onCreate(async (snap, context) => {
    const incidentId = context.params.incidentId;
    const incident = snap.data();
    console.log('='.repeat(60));
    console.log(`🚨 NOVO INCIDENTE: ${incidentId} — ${incident.category}`);
    console.log('='.repeat(60));
    try {
        const usersInPerimeter = await findUsersInPerimeter(incident);
        if (usersInPerimeter.length === 0) {
            console.log('ℹ️ Nenhum usuário no perímetro afetado');
            return null;
        }
        console.log(`📱 ${usersInPerimeter.length} usuário(s) no perímetro`);
        const notifications = usersInPerimeter.map((user) => {
            const distance = calculateDistance(incident.location.geopoint.lat, incident.location.geopoint.long, user.last_location.latitude, user.last_location.longitude);
            return sendFCMNotification(user, incident, incidentId, distance);
        });
        const results = await Promise.allSettled(notifications);
        const successful = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;
        console.log(`📊 Enviadas: ${successful} | Falhas: ${failed}`);
        return null;
    }
    catch (error) {
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
exports.handleFalseAccusationBan = functions.firestore
    .document('incidents/{incidentId}')
    .onUpdate(async (change, context) => {
    var _a, _b, _c, _d, _e, _f;
    const before = change.before.data();
    const after = change.after.data();
    const incidentId = context.params.incidentId;
    const falseBefore = (_b = (_a = before.situtation) === null || _a === void 0 ? void 0 : _a.false_accusation) !== null && _b !== void 0 ? _b : 0;
    const falseAfter = (_d = (_c = after.situtation) === null || _c === void 0 ? void 0 : _c.false_accusation) !== null && _d !== void 0 ? _d : 0;
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
        const authorData = authorDoc.data();
        const currentStrikes = authorData.strike_count || 0;
        const newStrikes = currentStrikes + 1;
        console.log(`[handleFalseAccusationBan] Autor ${(_e = authorData.name) !== null && _e !== void 0 ? _e : authorDoc.id}: strikes ${currentStrikes} → ${newStrikes}`);
        // 2. Incrementa strikes do autor
        const authorUpdate = {
            strike_count: newStrikes,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };
        // 3. Bane se atingiu 3 strikes
        if (newStrikes >= 3) {
            authorUpdate.status = 'Banned';
            console.log(`[handleFalseAccusationBan] Autor ${(_f = authorData.name) !== null && _f !== void 0 ? _f : authorDoc.id} BANIDO`);
        }
        await authorRef.update(authorUpdate);
        // 4. Marca incidente como inativo
        await db.collection('incidents').doc(incidentId).update({
            status: 'inactive',
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[handleFalseAccusationBan] Incidente ${incidentId} marcado como inativo`);
        return null;
    }
    catch (error) {
        console.error('[handleFalseAccusationBan] Erro:', error);
        throw error;
    }
});
//# sourceMappingURL=index.js.map