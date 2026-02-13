import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/components/auth/ctx';
import { UserStatus } from '@/types/user';
import { useEffect, useState } from 'react';
import { Toast } from '@/components/ui/toast';
import { Pressable, View } from 'react-native';

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const router = useRouter();
  const segments = useSegments();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Redireciona para perfil se a conta estiver inativa
  useEffect(() => {
    if (!user) return;

    const currentTab = segments[1]; // '(tabs)' é o primeiro, a tab atual é o segundo

    // Se o usuário está inativo e não está na tela de perfil, redireciona
    if (user.status === UserStatus.INACTIVE && currentTab !== 'profile') {
      router.replace('/(tabs)/profile');
    }
  }, [user?.status, segments]);

  // Função para interceptar cliques quando inativo
  const handleTabPress = (route: string) => (e: any) => {
    if (user?.status === UserStatus.INACTIVE && route !== 'profile') {
      e.preventDefault();
      setToastMessage('Ative sua conta para navegar no aplicativo');
      setShowToast(true);
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#7c3aed',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}>
      {/* Mapa como tela inicial */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
        listeners={{
          tabPress: handleTabPress('index'),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress('feed'),
        }}
      />
      <Tabs.Screen
        name="following"
        options={{
          title: 'Seguindo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="eye-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress('following'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress('profile'),
        }}
      />
      <Tabs.Screen
        name="terms"
        options={{
          title: 'Termos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress('terms'),
        }}
      />
      </Tabs>

      {/* Toast de aviso */}
      <View style={{ position: 'absolute', top: 60, left: 16, right: 16, zIndex: 9999 }}>
        <Toast message={toastMessage} visible={showToast} onHide={() => setShowToast(false)} />
      </View>
    </>
  );
}
