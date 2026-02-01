import { useSession } from '@/components/auth/ctx';
import { Redirect } from 'expo-router';

export default function Index() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return null; // or a loading spinner
  }

  // Redirect to appropriate screen based on auth state
  if (session) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
