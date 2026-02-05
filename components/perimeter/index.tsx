import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Toast } from '@/components/ui/toast';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export function PerimeterControl() {
  const [notifications, setNotifications] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  function handleNotificationToggle() {
    const newValue = !notifications;
    setNotifications(newValue);
    setToastMessage(newValue ? 'Notificações ativadas' : 'Notificações desativadas');
    setShowToast(true);
  }

  return (
    <>
      <Card className="mx-3 mt-3 bg-white px-0 py-4 shadow-md">
        <CardContent className="flex flex-row items-center justify-between px-3">
          <View className="flex flex-row gap-2">
            <View className="flex items-center rounded-xl bg-yellow-500 p-2">
              <Ionicons name="location" size={24} color="white" />
            </View>
            <View>
              <Text className="font-semibold">Keep Alert</Text>
              <Text className="text-neutral-600">1 alerta(s) no perímetro</Text>
            </View>
          </View>
          <View className="flex flex-row gap-4 rounded-xl p-2">
            <Pressable onPress={handleNotificationToggle}>
              {notifications ? (
                <Ionicons name="notifications-outline" size={20} color="#78716c" />
              ) : (
                <Ionicons name="notifications-off-outline" size={20} color="#78716c" />
              )}
            </Pressable>
            <Pressable onPress={() => setShowSettings(true)}>
              <Ionicons name="settings-outline" size={20} color="#78716c" />
            </Pressable>
          </View>
        </CardContent>
      </Card>

      {/* Toast de notificação */}
      <Toast message={toastMessage} visible={showToast} onHide={() => setShowToast(false)} />

      {/* Bottom Sheet de configurações */}
      <BottomSheet visible={showSettings} onClose={() => setShowSettings(false)}>
        <View className="gap-6 py-4">
          <Text className="text-2xl font-bold text-neutral-900">Configurações</Text>

          <Separator />

          <View className="gap-4">
            <Pressable className="flex flex-row items-center gap-3 py-2">
              <Ionicons name="locate-outline" size={24} color="#71717a" />
              <View className="flex-1">
                <Text className="text-base font-semibold text-neutral-900">Raio do Perímetro</Text>
                <Text className="text-sm text-neutral-600">Ajustar distância de alerta</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
            </Pressable>

            <Pressable className="flex flex-row items-center gap-3 py-2">
              <Ionicons name="notifications-outline" size={24} color="#71717a" />
              <View className="flex-1">
                <Text className="text-base font-semibold text-neutral-900">
                  Preferências de Notificação
                </Text>
                <Text className="text-sm text-neutral-600">Som, vibração e alertas</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
            </Pressable>

            <Pressable className="flex flex-row items-center gap-3 py-2">
              <Ionicons name="map-outline" size={24} color="#71717a" />
              <View className="flex-1">
                <Text className="text-base font-semibold text-neutral-900">Estilo do Mapa</Text>
                <Text className="text-sm text-neutral-600">Personalizar aparência</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
            </Pressable>
          </View>

          <Separator />

          <Button className="w-full" onPress={() => setShowSettings(false)}>
            <Text className="text-base font-semibold">Fechar</Text>
          </Button>
        </View>
      </BottomSheet>
    </>
  );
}
