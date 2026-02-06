import { useSession } from '@/components/auth/ctx';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { UserPerimeterRadius } from '@/types/user';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

export function PerimeterControl({
  perimeter,
  setPerimeter,
}: {
  perimeter: UserPerimeterRadius | null;
  setPerimeter: React.Dispatch<React.SetStateAction<UserPerimeterRadius | null>>;
}) {
  const { updateUserPerimeter, updateUserNotifications, user } = useSession();
  const [notifications, setNotifications] = useState(user?.alerts_notifications ?? true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  async function handleNotificationToggle() {
    const newValue = !notifications;
    try {
      setNotifications(newValue);
      await updateUserNotifications(newValue);
      setToastMessage(newValue ? 'Notificações ativadas' : 'Notificações desativadas');
      setShowToast(true);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
      // Reverte a mudança local se falhar
      setNotifications(!newValue);
    }
  }

  async function handlePerimeterChange(newPerimeter: UserPerimeterRadius) {
    try {
      setPerimeter(newPerimeter);
      await updateUserPerimeter(newPerimeter);
      setToastMessage(`Perímetro atualizado para ${newPerimeter}m`);
      setShowToast(true);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
      // Reverte a mudança local se falhar
      if (perimeter) {
        setPerimeter(perimeter);
      }
    }
  }

  useEffect(() => {
    if (user?.alerts_notifications !== undefined) {
      setNotifications(user.alerts_notifications);
    }
  }, [user?.alerts_notifications]);

  return (
    <>
      <Card className="mx-3 mt-3 bg-white px-0 py-4 shadow-md">
        <CardContent className="flex flex-row items-center justify-between px-3">
          <View className="flex flex-row gap-2">
            <View className="flex items-center rounded-xl bg-yellow-500 p-2">
              <MaterialCommunityIcons name="map-marker-radius" size={24} color="white" />
            </View>
            <View>
              <Text className="font-semibold">Keep Alert</Text>
              <Text className="text-neutral-600">1 alerta(s) no perímetro</Text>
            </View>
          </View>
          <View className="flex flex-row gap-4 rounded-xl p-2">
            <Pressable onPress={handleNotificationToggle}>
              {notifications ? (
                <Ionicons name="notifications-outline" size={20} color="#007AFF" />
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
        <View className="gap-6 py-4 pb-10">
          <Text className="text-xl font-bold text-neutral-600">Raio de Alerta</Text>

          <View className="gap-4">
            <Pressable
              className={cn(
                'flex flex-row items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3',
                perimeter === UserPerimeterRadius.R500 && 'border-blue-700 bg-blue-50'
              )}
              onPress={() => handlePerimeterChange(UserPerimeterRadius.R500)}>
              <Ionicons name="locate-outline" size={24} color="#71717a" />
              <View className="flex-1">
                <Text className="text-base font-semibold text-neutral-600">500 metros</Text>
                <Text className="text-sm text-neutral-600">Área próxima</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
            </Pressable>

            <Pressable
              className={cn(
                'flex flex-row items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3',
                perimeter === UserPerimeterRadius.R1000 && 'border-blue-700 bg-blue-50'
              )}
              onPress={() => handlePerimeterChange(UserPerimeterRadius.R1000)}>
              <Ionicons name="locate-outline" size={24} color="#71717a" />
              <View className="flex-1">
                <Text className="text-base font-semibold text-neutral-600">1 km</Text>
                <Text className="text-sm text-neutral-600">Vizinhança</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
            </Pressable>

            <Pressable
              className={cn(
                'flex flex-row items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3',
                perimeter === UserPerimeterRadius.R2000 && 'border-blue-700 bg-blue-50'
              )}
              onPress={() => handlePerimeterChange(UserPerimeterRadius.R2000)}>
              <Ionicons name="locate-outline" size={24} color="#71717a" />
              <View className="flex-1">
                <Text className="text-base font-semibold text-neutral-600">2 km</Text>
                <Text className="text-sm text-neutral-600">Bairro</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
            </Pressable>

            <Pressable
              className={cn(
                'flex flex-row items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3',
                perimeter === UserPerimeterRadius.R5000 && 'border-blue-700 bg-blue-50'
              )}
              onPress={() => handlePerimeterChange(UserPerimeterRadius.R5000)}>
              <Ionicons name="locate-outline" size={24} color="#71717a" />
              <View className="flex-1">
                <Text className="text-base font-semibold text-neutral-600">5 km</Text>
                <Text className="text-sm text-neutral-600">Região</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    </>
  );
}
