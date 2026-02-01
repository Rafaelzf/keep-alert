import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import * as React from 'react';
import { TextInput, View } from 'react-native';

export default function Login() {
  const passwordInputRef = React.useRef<TextInput>(null);

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  function onSubmit() {
    // TODO: Submit form and navigate to protected screen if successful
  }

  return (
    <View className="h-full justify-center gap-6">
      <Card className="border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader className="flex flex-col items-center gap-3 text-center">
          <CardTitle>
            <Text className="text-2xl font-bold"> Criar Conta</Text>
          </CardTitle>
          <CardDescription className="text-center sm:text-left">
            Bem-vindo(a)! Preencha os dados para começar.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="m@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                onSubmitEditing={onEmailSubmitEditing}
                returnKeyType="next"
                submitBehavior="submit"
              />
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="password">Password</Label>
                <Button
                  variant="link"
                  size="sm"
                  className="ml-auto h-4 px-1 py-0 web:h-fit sm:h-4"
                  onPress={() => {
                    // TODO: Navigate to forgot password screen
                  }}></Button>
              </View>
              <Input
                ref={passwordInputRef}
                id="password"
                secureTextEntry
                returnKeyType="send"
                onSubmitEditing={onSubmit}
              />
            </View>
            <Button className="w-full" onPress={onSubmit}>
              <Text className="text-lg">Criar</Text>
            </Button>
          </View>
          <Text className="flex items-center justify-evenly gap-2 text-center text-sm">
            <Text>Já possui uma conta? &nbsp;</Text>
            <Link href="/login">
              <Text className="text-primary text-sm underline underline-offset-4">Fazer login</Text>
            </Link>
          </Text>
          <View className="flex-row items-center">
            <Separator className="flex-1" />
            <Text className="text-muted-foreground px-4 text-sm">ou</Text>
            <Separator className="flex-1" />
          </View>
          <Button className="w-full" size="icon" variant="outline">
            <Ionicons name="logo-google" size={24} color="black" />
            <Text>Entrar com Google</Text>
          </Button>
        </CardContent>
      </Card>
    </View>
  );
}
