import { useSession } from '@/components/auth/ctx';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, signOut } = useSession();
  const insets = useSafeAreaInsets();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  }

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="border-b border-neutral-200 bg-white px-4 pb-4">
        <Text className="mt-4 text-2xl font-bold text-neutral-900">Perfil</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4">
        {/* Card do usuário */}
        <View className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <View className="items-center gap-4 p-6">
            {/* Avatar */}
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                className="h-24 w-24 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-24 w-24 items-center justify-center rounded-full bg-purple-100">
                <Ionicons name="person" size={48} color="#7c3aed" />
              </View>
            )}

            {/* Nome */}
            <View className="items-center gap-1">
              <Text className="text-xl font-bold text-neutral-900">{user?.name}</Text>
              <Text className="text-sm text-neutral-600">{user?.email}</Text>
            </View>

            {/* Status */}
            <View className="flex flex-row items-center gap-2 rounded-full bg-green-100 px-4 py-2">
              <View className="h-2 w-2 rounded-full bg-green-600" />
              <Text className="text-sm font-semibold text-green-700">Conta Ativa</Text>
            </View>
          </View>
        </View>

        {/* Informações da conta */}
        <View className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <View className="border-b border-neutral-100 p-4">
            <Text className="font-semibold text-neutral-900">Informações da Conta</Text>
          </View>

          <View className="gap-0">
            {/* Telefone */}
            {user?.phoneNumber && (
              <View className="flex flex-row items-center gap-3 border-b border-neutral-100 p-4">
                <Ionicons name="call-outline" size={20} color="#6b7280" />
                <View className="flex-1">
                  <Text className="text-xs text-neutral-500">Telefone</Text>
                  <Text className="text-sm font-medium text-neutral-900">{user.phoneNumber}</Text>
                </View>
              </View>
            )}

            {/* Perímetro */}
            <View className="flex flex-row items-center gap-3 border-b border-neutral-100 p-4">
              <Ionicons name="location-outline" size={20} color="#6b7280" />
              <View className="flex-1">
                <Text className="text-xs text-neutral-500">Raio de Alerta</Text>
                <Text className="text-sm font-medium text-neutral-900">
                  {user?.perimeter_radius ? `${user.perimeter_radius}m` : 'Não definido'}
                </Text>
              </View>
            </View>

            {/* Notificações */}
            <View className="flex flex-row items-center gap-3 p-4">
              <Ionicons name="notifications-outline" size={20} color="#6b7280" />
              <View className="flex-1">
                <Text className="text-xs text-neutral-500">Notificações</Text>
                <Text className="text-sm font-medium text-neutral-900">
                  {user?.alerts_notifications ? 'Ativadas' : 'Desativadas'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ações */}
        <View className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <View className="border-b border-neutral-100 p-4">
            <Text className="font-semibold text-neutral-900">Ações</Text>
          </View>

          <View className="gap-0">
            {/* Editar Perfil */}
            <Pressable className="flex flex-row items-center gap-3 border-b border-neutral-100 p-4">
              <Ionicons name="create-outline" size={20} color="#6b7280" />
              <Text className="flex-1 text-sm font-medium text-neutral-900">Editar Perfil</Text>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </Pressable>

            {/* Configurações */}
            <Pressable className="flex flex-row items-center gap-3 border-b border-neutral-100 p-4">
              <Ionicons name="settings-outline" size={20} color="#6b7280" />
              <Text className="flex-1 text-sm font-medium text-neutral-900">Configurações</Text>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </Pressable>

            {/* Sair */}
            <Pressable onPress={handleSignOut} className="flex flex-row items-center gap-3 p-4">
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text className="flex-1 text-sm font-medium text-red-600">Sair da Conta</Text>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </Pressable>
          </View>
        </View>

        {/* Padding bottom para a tab bar */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}
