import { useSession } from '@/components/auth/ctx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { validateEmail, validatePassword } from '@/lib/validations';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { Alert, Pressable, useColorScheme, View } from 'react-native';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, isAuthenticating } = useSession();
  const colorScheme = useColorScheme();

  async function onSubmit() {
    if (!validateEmail(email)) {
      Alert.alert('Erro', 'Por favor, insira um email válido.');
      return;
    }

    // Validação completa da senha
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      Alert.alert('Erro', passwordValidation.message || 'Senha inválida');
      return;
    }

    try {
      await signIn(email, password);
      // Navegação acontece automaticamente via Protected Routes
    } catch (error: any) {
      Alert.alert('Erro ao fazer login', error.message);
    }
  }

  return (
    <View className="bg-background h-full justify-center gap-6 px-4">
      <Card>
        <CardHeader className="flex flex-col items-center gap-3 text-center">
          <AntDesign name="alert" size={54} color="red" />
          <CardTitle>
            <Text className="text-4xl font-bold"> Keep Alert</Text>
          </CardTitle>
          <CardDescription className="text-center sm:text-left">
            Sua segurança em primeiro lugar.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="seur@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="/forgot-password">
                  <Text className="text-primary font-normal leading-4">Esqueceu sua senha?</Text>
                </Link>
              </View>
              <View className="relative">
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Sua senha"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  className="pr-12"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full items-center justify-center px-3"
                  accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  accessibilityRole="button">
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colorScheme === 'dark' ? '#9ca3af' : '#6b7280'}
                  />
                </Pressable>
              </View>
            </View>
            <Button className="w-full" onPress={onSubmit} disabled={isAuthenticating}>
              <Text>{isAuthenticating ? 'Entrando...' : 'Continue'}</Text>
            </Button>
          </View>
          <Text className="flex items-center justify-evenly gap-2 text-center text-sm">
            <Text>Ainda não tem uma conta? &nbsp;</Text>
            <Link href="/register" disabled={isAuthenticating}>
              <Text className="text-primary text-sm underline underline-offset-4">Cadastrar</Text>
            </Link>
          </Text>
          <View className="flex-row items-center">
            <Separator className="flex-1" />
            <Text className="text-muted-foreground px-4 text-sm">ou</Text>
            <Separator className="flex-1" />
          </View>
          <Button className="w-full" size="icon" variant="outline" disabled={isAuthenticating}>
            <Ionicons name="logo-google" size={24} color="black" />
            <Text>Fazer login com Google</Text>
          </Button>
        </CardContent>
      </Card>
    </View>
  );
}
