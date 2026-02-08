import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

/**
 * Toca um som de sucesso + feedback háptico quando uma ação é completada
 */
export async function playSuccessSound() {
  try {
    // Vibração de sucesso
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Tenta tocar o som (se o arquivo existir)
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Usa um tom simples gerado por oscillator
      // Nota: Para adicionar som customizado, coloque um arquivo MP3 em assets/sounds/success.mp3
      const { sound } = await Audio.Sound.createAsync(
        // Você pode substituir por: require('../assets/sounds/success.mp3')
        // Por enquanto, usando o som de notificação do sistema
        { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
        { shouldPlay: true, volume: 0.4 }
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
