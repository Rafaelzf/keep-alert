import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import AntDesign from '@expo/vector-icons/AntDesign';
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
              <View className="flex-row items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="/forgot-password">
                  <Text className="text-primary font-normal leading-4">Esqueceu sua senha?</Text>
                </Link>
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
              <Text>Continue</Text>
            </Button>
          </View>
          <Text className="flex items-center justify-evenly gap-2 text-center text-sm">
            <Text>Ainda não tem uma conta? &nbsp;</Text>
            <Link href="/register">
              <Text className="text-primary text-sm underline underline-offset-4">Cadastrar</Text>
            </Link>
          </Text>
          <View className="flex-row items-center">
            <Separator className="flex-1" />
            <Text className="text-muted-foreground px-4 text-sm">ou</Text>
            <Separator className="flex-1" />
          </View>
          <Button className="w-full" size="icon" variant="outline">
            <Ionicons name="logo-google" size={24} color="black" />
            <Text>Fazer login com Google</Text>
          </Button>
        </CardContent>
      </Card>
    </View>
  );
}
