import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

/**
 * Toca um som de sucesso + feedback háptico quando uma ação é completada
 */
export async function playSuccessSound() {
  try {
    // Vibração de alerta (mais intensa para incidentes)
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    // Tenta tocar o som (se o arquivo existir)
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Som de sirene de emergência
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://actions.google.com/sounds/v1/emergency/emergency_siren_short_burst.ogg' },
        { shouldPlay: true, volume: 1.0 }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (audioError) {
      // Se falhar ao tocar som, apenas o haptic já foi executado
      console.log('[Sound] Usando apenas haptic feedback');
    }
  } catch (error) {
    console.error('[Sound] Erro ao reproduzir feedback de sucesso:', error);
  }
}

/**
 * Toca um som de notificação/alerta + feedback háptico
 */
export async function playNotificationSound() {
  try {
    // Vibração de notificação
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' },
        { shouldPlay: true, volume: 0.5 }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (audioError) {
      console.log('[Sound] Usando apenas haptic feedback');
    }
  } catch (error) {
    console.error('[Sound] Erro ao reproduzir feedback de notificação:', error);
  }
}

/**
 * Feedback háptico leve (para interações simples)
 */
export async function playLightHaptic() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    console.error('[Sound] Erro ao reproduzir haptic leve:', error);
  }
}
