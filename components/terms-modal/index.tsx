import { useSession } from '@/components/auth/ctx';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TermsModalProps {
  visible: boolean;
}

export function TermsModal({ visible }: TermsModalProps) {
  const { acceptTerms, rejectTerms } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleAccept = async () => {
    try {
      setIsLoading(true);
      await acceptTerms();
    } catch (error) {
      console.error('[TermsModal] Erro ao aceitar termos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsLoading(true);
      await rejectTerms();
    } catch (error) {
      console.error('[TermsModal] Erro ao rejeitar termos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="border-b border-neutral-200 bg-purple-600 px-6 pb-6 pt-16">
          <View className="mb-4 flex flex-row items-center justify-center">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <Ionicons name="document-text" size={32} color="#ffffff" />
            </View>
          </View>
          <Text className="text-center text-2xl font-bold text-white">
            Termos de Responsabilidade
          </Text>
          <Text className="mt-2 text-center text-sm text-purple-100">
            Leia atentamente antes de continuar
          </Text>
        </View>

        {/* Conteúdo dos Termos */}
        <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={true}>
          <Text className="mb-4 text-base leading-6 text-neutral-800">
            Ao utilizar o aplicativo <Text className="font-bold">Keep Alert</Text>, você concorda
            com os seguintes termos de responsabilidade:
          </Text>

          <View className="mb-4">
            <Text className="mb-2 text-lg font-bold text-neutral-900">
              1. Natureza das Informações
            </Text>
            <Text className="text-base leading-6 text-neutral-700">
              As informações e alertas disponibilizados no Keep Alert são fornecidos por usuários da
              comunidade e não foram verificados oficialmente. O aplicativo não garante a precisão,
              completude ou atualidade das informações publicadas.
            </Text>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-lg font-bold text-neutral-900">
              2. Responsabilidade do Usuário
            </Text>
            <Text className="text-base leading-6 text-neutral-700">
              Você é responsável por verificar a veracidade das informações antes de tomar qualquer
              ação. O Keep Alert não se responsabiliza por decisões tomadas com base nas informações
              disponibilizadas no aplicativo.
            </Text>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-lg font-bold text-neutral-900">3. Uso Adequado</Text>
            <Text className="text-base leading-6 text-neutral-700">
              Você se compromete a utilizar o aplicativo de forma responsável, publicando apenas
              informações verdadeiras e relevantes. O uso indevido, incluindo publicação de
              informações falsas, pode resultar no banimento da sua conta.
            </Text>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-lg font-bold text-neutral-900">4. Emergências</Text>
            <Text className="text-base leading-6 text-neutral-700">
              Em situações de emergência, sempre contate as autoridades competentes através dos
              números oficiais (190 para Polícia, 193 para Bombeiros, 192 para SAMU). O Keep Alert é
              uma ferramenta complementar de alerta comunitário e não substitui os serviços de
              emergência.
            </Text>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-lg font-bold text-neutral-900">
              5. Limitação de Responsabilidade
            </Text>
            <Text className="text-base leading-6 text-neutral-700">
              O Keep Alert e seus desenvolvedores não se responsabilizam por quaisquer danos
              diretos, indiretos, incidentais ou consequenciais resultantes do uso ou
              impossibilidade de uso do aplicativo.
            </Text>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-lg font-bold text-neutral-900">6. Privacidade e Dados</Text>
            <Text className="text-base leading-6 text-neutral-700">
              Ao utilizar o aplicativo, você concorda com a coleta e uso de dados de localização
              para fornecer alertas relevantes à sua região. Suas informações pessoais serão
              tratadas de acordo com nossa Política de Privacidade.
            </Text>
          </View>

          <View className="mb-24 rounded-lg bg-amber-50 p-4">
            <View className="mb-2 flex flex-row items-center gap-2">
              <Ionicons name="warning" size={20} color="#d97706" />
              <Text className="text-base font-bold text-amber-800">Importante</Text>
            </View>
            <Text className="text-sm leading-5 text-amber-700">
              Se você não aceitar estes termos de responsabilidade, não poderá navegar no aplicativo
              e sua conta será marcada como inativa. Você poderá reativar sua conta a qualquer
              momento aceitando os termos.
            </Text>
          </View>
        </ScrollView>

        {/* Botões de Ação */}
        <View
          className="border-t border-neutral-200 bg-white px-6 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}>
          <Pressable
            onPress={handleAccept}
            disabled={isLoading}
            className="mb-3 rounded-lg bg-purple-600 py-4"
            style={{ opacity: isLoading ? 0.5 : 1 }}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-center text-base font-bold text-white">
                Aceito os Termos de Responsabilidade
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleReject}
            disabled={isLoading}
            className="rounded-lg border-2 border-neutral-300 bg-white py-4"
            style={{ opacity: isLoading ? 0.5 : 1 }}>
            <Text className="text-center text-base font-semibold text-neutral-700">
              Não Aceito os Termos
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
