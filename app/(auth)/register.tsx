import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function Register() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl text-foreground">register</Text>
      <Link href="/login" className="mt-4">
        <Text className="text-primary">Ir para Login</Text>
      </Link>
      <Link href="/" className="mt-2">
        <Text className="text-primary">Voltar para Home</Text>
      </Link>
    </View>
  );
}
