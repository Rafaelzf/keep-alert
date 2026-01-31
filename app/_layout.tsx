import { NAV_THEME } from '@/lib/theme'; // Ou onde seus temas estiverem definidos
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <ThemeProvider value={NAV_THEME[colorScheme]}>
      {/* 1. Define a cor da barra de status do celular */}
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* 2. Suas telas (navegação) */}
      <Stack />

      {/* 3. O Host para Modais e Popovers (dentro do tema!) */}
      <PortalHost />
    </ThemeProvider>
  );
}
