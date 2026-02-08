import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="border-b border-neutral-200 bg-white px-4 pb-4">
        <Text className="mt-4 text-2xl font-bold text-neutral-900">Termos de Uso</Text>
        <Text className="mt-1 text-sm text-neutral-600">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-6">
        {/* Introdução */}
        <View className="rounded-xl border border-neutral-200 bg-white p-4">
          <View className="mb-3 flex flex-row items-center gap-2">
            <Ionicons name="information-circle" size={24} color="#7c3aed" />
            <Text className="text-lg font-bold text-neutral-900">Bem-vindo ao Keep Alert</Text>
          </View>
          <Text className="text-sm leading-6 text-neutral-700">
            Ao usar o Keep Alert, você concorda com os termos e condições descritos abaixo. Leia
            atentamente antes de prosseguir.
          </Text>
        </View>

        {/* Seção 1 */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-neutral-900">1. Uso do Aplicativo</Text>
          <View className="rounded-xl border border-neutral-200 bg-white p-4">
            <Text className="text-sm leading-6 text-neutral-700">
              O Keep Alert é uma plataforma comunitária para reportar e visualizar ocorrências em
              tempo real. Ao usar o aplicativo, você se compromete a:
            </Text>
            <View className="mt-3 gap-2">
              <Text className="text-sm text-neutral-700">• Reportar apenas ocorrências reais</Text>
              <Text className="text-sm text-neutral-700">
                • Não compartilhar informações falsas ou enganosas
              </Text>
              <Text className="text-sm text-neutral-700">
                • Respeitar a privacidade de outros usuários
              </Text>
              <Text className="text-sm text-neutral-700">
                • Usar o aplicativo de forma responsável
              </Text>
            </View>
          </View>
        </View>

        {/* Seção 2 */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-neutral-900">2. Privacidade e Dados</Text>
          <View className="rounded-xl border border-neutral-200 bg-white p-4">
            <Text className="text-sm leading-6 text-neutral-700">
              Coletamos e processamos dados de localização para fornecer alertas próximos a você.
              Suas informações são tratadas com segurança e não são compartilhadas com terceiros sem
              seu consentimento.
            </Text>
          </View>
        </View>

        {/* Seção 3 */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-neutral-900">3. Responsabilidades</Text>
          <View className="rounded-xl border border-neutral-200 bg-white p-4">
            <Text className="text-sm leading-6 text-neutral-700">
              O Keep Alert é uma ferramenta informativa. Não nos responsabilizamos por:
            </Text>
            <View className="mt-3 gap-2">
              <Text className="text-sm text-neutral-700">
                • Veracidade de reportes feitos por outros usuários
              </Text>
              <Text className="text-sm text-neutral-700">
                • Danos causados por informações incorretas
              </Text>
              <Text className="text-sm text-neutral-700">
                • Decisões tomadas com base nos alertas
              </Text>
            </View>
          </View>
        </View>

        {/* Seção 4 */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-neutral-900">4. Suspensão de Conta</Text>
          <View className="rounded-xl border border-neutral-200 bg-white p-4">
            <Text className="text-sm leading-6 text-neutral-700">
              Reservamos o direito de suspender ou encerrar contas que violem nossos termos de uso,
              incluindo usuários que:
            </Text>
            <View className="mt-3 gap-2">
              <Text className="text-sm text-neutral-700">• Criem reportes falsos repetidamente</Text>
              <Text className="text-sm text-neutral-700">• Abusem do sistema de denúncias</Text>
              <Text className="text-sm text-neutral-700">• Assediem outros usuários</Text>
            </View>
          </View>
        </View>

        {/* Seção 5 */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-neutral-900">5. Alterações nos Termos</Text>
          <View className="rounded-xl border border-neutral-200 bg-white p-4">
            <Text className="text-sm leading-6 text-neutral-700">
              Podemos atualizar estes termos periodicamente. Notificaremos você sobre mudanças
              significativas através do aplicativo. O uso continuado após as alterações constitui
              aceitação dos novos termos.
            </Text>
          </View>
        </View>

        {/* Contato */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-neutral-900">6. Contato</Text>
          <View className="rounded-xl border border-neutral-200 bg-white p-4">
            <Text className="text-sm leading-6 text-neutral-700">
              Para dúvidas ou questões sobre estes termos, entre em contato:
            </Text>
            <View className="mt-3 gap-2">
              <View className="flex flex-row items-center gap-2">
                <Ionicons name="mail-outline" size={16} color="#6b7280" />
                <Text className="text-sm text-neutral-700">contato@keepalert.com</Text>
              </View>
              <View className="flex flex-row items-center gap-2">
                <Ionicons name="globe-outline" size={16} color="#6b7280" />
                <Text className="text-sm text-neutral-700">www.keepalert.com</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Padding bottom para a tab bar */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}
