import { useSession } from '@/components/auth/ctx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { validateEmail } from '@/lib/validations';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const { forgotPassword, isAuthenticating } = useSession();

  async function onSubmit() {
    if (!validateEmail(email)) {
      Alert.alert('Erro', 'Por favor, insira um email válido.');
      return;
    }

    try {
      await forgotPassword(email);
      setEmailSent(true);
    } catch (error: any) {
      Alert.alert('Erro ao enviar email', error.message);
    }
  }

  // Tela de sucesso após envio do email
  if (emailSent) {
    return (
      <View className="bg-background h-full justify-center gap-6 px-4">
        <Card>
          <CardHeader className="flex flex-col items-center gap-3">
            <AntDesign name="checkcircle" size={54} color="green" />
            <CardTitle>
              <Text className="text-center text-2xl font-bold">Email Enviado!</Text>
            </CardTitle>
            <CardDescription className="text-center">
              Enviamos um link de recuperação para {email}. Verifique sua caixa de SPAM e siga as
              instruções.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" asChild>
              <Button className="w-full">
                <Text>Voltar ao Login</Text>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </View>
    );
  }

  // Formulário para digitar email
  return (
    <View className="bg-background h-full justify-center gap-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <Text className="text-xl font-bold">Esqueceu sua senha?</Text>
          </CardTitle>
          <CardDescription>Digite seu email para receber um link de recuperação.</CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            <Button className="w-full" onPress={onSubmit} disabled={isAuthenticating}>
              <Text>{isAuthenticating ? 'Enviando...' : 'Enviar link de recuperação'}</Text>
            </Button>
            <Link href="/login" asChild>
              <Button variant="ghost" className="w-full">
                <Text>Voltar ao Login</Text>
              </Button>
            </Link>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
