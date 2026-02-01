import { CHAT_MESSAGE_MAX_LENGTH, MEDIA_MAX_PHOTOS, MEDIA_MAX_VIDEO_DURATION } from './constants';

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'A senha deve ter pelo menos 6 caracteres' };
  }
  return { valid: true };
}

export function validateDisplayName(name: string): { valid: boolean; message?: string } {
  if (name.length < 2) {
    return { valid: false, message: 'Nome deve ter pelo menos 2 caracteres' };
  }
  if (name.length > 50) {
    return { valid: false, message: 'Nome deve ter menos de 50 caracteres' };
  }
  return { valid: true };
}

export function validateIncidentDescription(description: string): {
  valid: boolean;
  message?: string;
} {
  if (description.length > 500) {
    return { valid: false, message: 'Descrição deve ter menos de 500 caracteres' };
  }
  return { valid: true };
}

export function validateMediaCount(count: number): { valid: boolean; message?: string } {
  if (count > MEDIA_MAX_PHOTOS) {
    return { valid: false, message: `Máximo ${MEDIA_MAX_PHOTOS} fotos permitidas` };
  }
  return { valid: true };
}

export function validateVideoDuration(durationSeconds: number): {
  valid: boolean;
  message?: string;
} {
  if (durationSeconds > MEDIA_MAX_VIDEO_DURATION) {
    return {
      valid: false,
      message: `Vídeo deve ter ${MEDIA_MAX_VIDEO_DURATION} segundos ou menos`,
    };
  }
  return { valid: true };
}

export function validateChatMessage(message: string): { valid: boolean; message?: string } {
  if (message.trim().length === 0) {
    return { valid: false, message: 'Message cannot be empty' };
  }
  if (message.length > CHAT_MESSAGE_MAX_LENGTH) {
    return {
      valid: false,
      message: `Mensagem deve ter menos de ${CHAT_MESSAGE_MAX_LENGTH} caracteres`,
    };
  }
  return { valid: true };
}

export function validateCoordinates(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}
