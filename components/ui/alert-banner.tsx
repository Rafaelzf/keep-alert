import Ionicons from '@expo/vector-icons/Ionicons';
import { Portal } from '@rn-primitives/portal';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface AlertBannerData {
  title: string;
  distanceText: string;
  incidentId: string;
  screen: string;
  category: string;
}

interface AlertBannerProps {
  data: AlertBannerData | null;
  onDismiss: () => void;
  onPress: (data: AlertBannerData) => void;
}

/**
 * Banner de alerta em foreground.
 * Aparece no topo da tela com animação e permanece visível
 * até o usuário interagir (ao contrário do Toast que some sozinho).
 */
export function AlertBanner({ data, onDismiss, onPress }: AlertBannerProps) {
  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (data) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(-200, { duration: 250 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [data]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!data) return null;

  return (
    <Portal name="alert-banner">
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingTop: insets.top + 8,
          paddingHorizontal: 12,
          zIndex: 99999,
          pointerEvents: 'box-none',
        }}>
        <Animated.View style={animatedStyle}>
          <Pressable
            onPress={() => onPress(data)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#B91C1C' : '#DC2626',
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 12,
            })}>
            {/* Ícone de alerta */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="warning" size={22} color="#fff" />
            </View>

            {/* Textos */}
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 18 }}
                numberOfLines={1}>
                {data.title}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 }}>
                Reportado a {data.distanceText} de você · Toque para ver
              </Text>
            </View>

            {/* Botão fechar */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              hitSlop={12}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="close" size={16} color="#fff" />
            </Pressable>
          </Pressable>
        </Animated.View>
      </View>
    </Portal>
  );
}
