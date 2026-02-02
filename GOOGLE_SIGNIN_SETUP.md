# Configurar Google Sign-In no Firebase + Expo

## ⚠️ IMPORTANTE: Expo Go vs Build Nativo

### ❌ Expo Go NÃO FUNCIONA
O Google Sign-In **não funciona no Expo Go** e você verá este erro:
```
ERROR [Invariant Violation: TurboModuleRegistry.getEnforcing(...):
'RNGoogleSignin' could not be found. Verify that a module by this name
is registered in the native binary.]
```

**Por quê?** Expo Go é um app genérico que não inclui módulos nativos personalizados.

### ✅ Build Nativo FUNCIONA
Para testar Google Sign-In, você DEVE usar:
```bash
npx expo run:android  # Android
npx expo run:ios      # iOS
```

Isso cria um build nativo do seu app com todos os módulos incluídos.

**Dica:** O app buildado suporta Fast Refresh. Você pode deixar rodando e fazer mudanças no código que ele recarrega automaticamente!

---

## Por que `signInWithPopup` não funciona?

`signInWithPopup` é um método **exclusivo para Web Browsers**. No React Native/Expo, você precisa usar uma abordagem diferente:

- ❌ `signInWithPopup(auth, provider)` - Só Web
- ❌ `signInWithRedirect(auth, provider)` - Só Web
- ✅ `signInWithCredential(auth, credential)` - Funciona no React Native

## Passos para Implementar Google Sign-In

### 1. Configurar Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione seu projeto Firebase ou crie um novo
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth 2.0 Client ID**

#### Para Android:
- **Application type**: Android
- **Package name**: `com.rafaelzf.keepalert` (do seu app.json)
- **SHA-1 certificate fingerprint**:
  ```bash
  # Debug (desenvolvimento)
  cd android && ./gradlew signingReport

  # Ou use o keytool
  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
  ```
- Copie o **Client ID** gerado

#### Para iOS:
- **Application type**: iOS
- **Bundle ID**: Use o mesmo do app.json
- Copie o **Client ID** gerado

#### Para Web (opcional):
- **Application type**: Web application
- **Authorized redirect URIs**: Adicione suas URLs

### 2. Habilitar Google Sign-In no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Authentication** > **Sign-in method**
3. Clique em **Google**
4. Ative o toggle
5. Configure o email de suporte
6. Salve

### 3. Instalar Dependências

```bash
npx expo install expo-auth-session expo-web-browser expo-crypto
npx expo install @react-native-google-signin/google-signin
```

### 4. Configurar app.json

Adicione no `app.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "config": {
        "googleSignIn": {
          "apiKey": "YOUR_ANDROID_API_KEY",
          "certificateHash": "YOUR_SHA1_FINGERPRINT"
        }
      }
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "config": {
        "googleSignIn": {
          "reservedClientId": "YOUR_IOS_CLIENT_ID"
        }
      }
    },
    "scheme": "keep-alert"
  }
}
```

### 5. Baixar Arquivos de Configuração

#### Android:
1. No Firebase Console, vá em **Project Settings**
2. Role até **Your apps** > Android
3. Clique em **google-services.json** para baixar
4. Coloque na raiz do projeto

#### iOS:
1. No Firebase Console, vá em **Project Settings**
2. Role até **Your apps** > iOS
3. Clique em **GoogleService-Info.plist** para baixar
4. Coloque na raiz do projeto

### 6. Implementar a Função (Opção 1: @react-native-google-signin)

Atualize `@components/auth/ctx.tsx`:

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

// Configure no início do arquivo
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID', // do Firebase Console
});

const signWithGoogle = async (): Promise<void> => {
  setIsAuthenticating(true);
  try {
    // Faz login com Google
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();

    // Cria credential do Firebase
    const googleCredential = GoogleAuthProvider.credential(idToken);

    // Faz login no Firebase
    const userCredential = await signInWithCredential(auth, googleCredential);
    const token = await userCredential.user.getIdToken();

    setSession(token);
    setFirebaseUser(userCredential.user);
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Login cancelado');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Login em progresso');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services não disponível');
    } else {
      throw new Error(error.message);
    }
  } finally {
    setIsAuthenticating(false);
  }
};
```

### 7. Implementar a Função (Opção 2: expo-auth-session)

Alternativa usando apenas Expo:

```typescript
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const signWithGoogle = async (): Promise<void> => {
  setIsAuthenticating(true);
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'keep-alert'
    });

    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    const request = await AuthSession.loadAsync(
      {
        clientId: 'YOUR_WEB_CLIENT_ID',
        redirectUri,
        scopes: ['profile', 'email'],
      },
      { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth' }
    );

    const result = await request.promptAsync({ useProxy: true });

    if (result.type === 'success') {
      const { id_token } = result.params;
      const credential = GoogleAuthProvider.credential(id_token);
      const userCredential = await signInWithCredential(auth, credential);
      const token = await userCredential.user.getIdToken();

      setSession(token);
      setFirebaseUser(userCredential.user);
    }
  } catch (error: any) {
    throw new Error(error.message);
  } finally {
    setIsAuthenticating(false);
  }
};
```

### 8. Testar

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

## Troubleshooting

### Erro: "DEVELOPER_ERROR"
- Verifique se o SHA-1 está correto
- Certifique-se de usar o SHA-1 do keystore correto (debug vs release)

### Erro: "API key not valid"
- Verifique se a API está habilitada no Google Cloud Console
- Certifique-se de que o package name está correto

### Erro: "idToken is null"
- Configure o Web Client ID no GoogleSignin.configure()
- Use o Client ID do tipo "Web" do Google Cloud Console

## Referências

- [Firebase Auth - Google Sign-In](https://firebase.google.com/docs/auth/android/google-signin)
- [Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [@react-native-google-signin](https://github.com/react-native-google-signin/google-signin)
