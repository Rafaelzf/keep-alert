import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      {/* Add more protected screens here */}
    </Stack>
  );
}
