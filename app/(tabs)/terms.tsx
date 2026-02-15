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
          <Text className="text-lg font-bold text-neutral-900">
            4. Sistema de Penalizações e Banimento
          </Text>
          <View className="rounded-xl border border-neutral-200 bg-white p-4">
            <Text className="text-sm font-semibold leading-6 text-neutral-900">
              Sistema de 3 Strikes
            </Text>
            <Text className="mt-2 text-sm leading-6 text-neutral-700">
              O Keep Alert utiliza um sistema automático de penalizações para manter a qualidade e
              veracidade das informações. Funciona da seguinte forma:
            </Text>
            <View className="mt-3 gap-2">
              <Text className="text-sm text-neutral-700">
                • Quando um incidente reportado por você recebe{' '}
                <Text className="font-semibold">3 votos de "Falsa Acusação"</Text> por outros
                usuários, você recebe automaticamente{' '}
                <Text className="font-semibold">1 penalização</Text>
              </Text>
              <Text className="text-sm text-neutral-700">
                • O incidente marcado como falso é <Text className="font-semibold">desativado</Text>{' '}
                automaticamente
              </Text>
              <Text className="text-sm text-neutral-700">
                • Ao atingir <Text className="font-semibold text-red-600">3 penalizações</Text>, sua
                conta será <Text className="font-semibold text-red-600">BANIDA</Text>{' '}
                permanentemente
              </Text>
              <Text className="text-sm text-neutral-700">
                • Você pode verificar o número de penalizações recebidas no seu perfil
              </Text>
            </View>

            <View className="mt-4 rounded-lg bg-yellow-50 p-3">
              <View className="flex flex-row items-start gap-2">
                <Ionicons name="warning" size={20} color="#f59e0b" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-yellow-800">Atenção</Text>
                  <Text className="mt-1 text-xs leading-5 text-yellow-700">
                    Ao receber 2 penalizações, você será alertado de que apenas mais uma penalização
                    resultará no banimento permanente da sua conta. Certifique-se de reportar apenas
                    ocorrências reais e verificadas.
                  </Text>
                </View>
              </View>
            </View>

            <Text className="mt-4 text-sm font-semibold leading-6 text-neutral-900">
              Outras Violações
            </Text>
            <Text className="mt-2 text-sm leading-6 text-neutral-700">
              Também reservamos o direito de suspender ou encerrar contas que:
            </Text>
            <View className="mt-2 gap-2">
              <Text className="text-sm text-neutral-700">• Abusem do sistema de denúncias</Text>
              <Text className="text-sm text-neutral-700">• Assediem outros usuários</Text>
              <Text className="text-sm text-neutral-700">
                • Utilizem o aplicativo para fins ilegais
              </Text>
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
                <Text className="text-sm text-neutral-700">keepalert01@gmail.com</Text>
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
