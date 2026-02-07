import { Portal } from '@rn-primitives/portal';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const translateY = useSharedValue(1000);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setHasBeenVisible(true);
      translateY.value = withSpring(0, {
        stiffness: 300,
      });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(1000, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Só renderiza se já foi visível pelo menos uma vez
  if (!hasBeenVisible && !visible) return null;

  return (
    <Portal name="bottom-sheet">
      <View
        pointerEvents={visible ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
        }}>
        {/* Backdrop */}
        <Pressable onPress={onClose} style={{ flex: 1 }}>
          <Animated.View
            style={[
              {
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
              },
              backdropStyle,
            ]}
          />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 8,
              paddingBottom: 32,
              paddingHorizontal: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 12,
            },
            sheetStyle,
          ]}>
          {/* Handle */}
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#d4d4d8',
                borderRadius: 2,
              }}
            />
          </View>

          {/* Content */}
          {children}
        </Animated.View>
      </View>
    </Portal>
  );
}
