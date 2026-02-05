import { SessionProvider, useSession } from '@/components/auth/ctx';
import { SplashScreenController } from '@/components/auth/splashScreenController';
import '@/global.css';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';

export default function RootLayout() {
  // Set up the auth context and render your layout inside of it.
  return (
    <SessionProvider>
      <SplashScreenController />
      <RootNavigator />
    </SessionProvider>
  );
}

function RootNavigator() {
  const { session } = useSession();
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <ThemeProvider value={NAV_THEME[colorScheme]}>
      {/* 1. Define a cor da barra de status do celular */}
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor="#ffffff" />

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
