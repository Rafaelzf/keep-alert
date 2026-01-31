import { Button } from '@/components/ui/button';
import '@/global.css';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';
export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">Hello world!</Text>
      <Button>
        <Text className="text-xl font-bold text-blue-500">Button</Text>
      </Button>
      <FontAwesome name="fonticons" size={24} color="black" />
    </View>
  );
}
