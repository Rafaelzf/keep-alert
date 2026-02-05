import { SessionProvider, useSession } from '@/components/auth/ctx';
import { SplashScreenController } from '@/components/auth/splashScreenController';
import '@/global.css';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

export default function RootLayout() {
  // Set up the auth context and render your layout inside of it.
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <SplashScreenController />
        <RootNavigator />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { session } = useSession();
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <ThemeProvider value={NAV_THEME[colorScheme]}>
      {/* 1. Define a cor da barra de status do celular */}
      <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />

      {/* 2. Suas telas (navegação) - Expo Router gerencia automaticamente */}
      <Stack screenOptions={{ contentStyle: { backgroundColor: '#ffffff' } }}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
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
