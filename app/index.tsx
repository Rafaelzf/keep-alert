import '@/global.css';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';
export default function App() {
  return (
    <View className="bg-background flex-1 items-center justify-center">
      <Text className="text-foreground text-xl font-bold">Hello world!</Text>
      <Link href="/login" className="mt-4">
        <Text className="text-primary">Login</Text>
      </Link>
      <Link href="/register" className="mt-2">
        <Text className="text-primary">Register</Text>
      </Link>
    </View>
  );
}
