import { SessionProvider, useSession } from '@/components/auth/ctx';
import { SplashScreenController } from '@/components/auth/splashScreenController';
import { IncidentProvider } from '@/components/incidents/ctx';
import '@/global.css';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useNotifications } from '@/hooks/useNotifications';
import { useEffect } from 'react';

export default function RootLayout() {
  // Set up the auth context and render your layout inside of it.
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <IncidentProvider>
          <SplashScreenController />
          <RootNavigator />
        </IncidentProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { session } = useSession();
  const colorScheme = useColorScheme() ?? 'light';

  // 🔔 Configurar notificações push FCM
  const { fcmToken, isLoading, hasPermission } = useNotifications();

  useEffect(() => {
    if (fcmToken && session) {
      console.log('✅ FCM Token registrado:', fcmToken);
      console.log('📱 User ID:', session);

      // TODO: Salvar token no Firestore
      // saveFCMTokenToFirestore(fcmToken, session.uid);
    }
  }, [fcmToken, session]);

  return (
    <ThemeProvider value={NAV_THEME[colorScheme]}>
      {/* 1. Define a cor da barra de status do celular */}
      <StatusBar style="dark" backgroundColor="#000" translucent={false} />

      {/* 2. Suas telas (navegação) - Expo Router gerencia automaticamente */}
      <Stack>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>

      {/* 3. O Host para Modais e Popovers (dentro do tema!) */}
      <PortalHost />
    </ThemeProvider>
  );
}
