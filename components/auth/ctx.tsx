import { auth } from '@/firebase/firebaseConfig';
import { useStorageState } from '@/hooks/useStorageState';
import * as WebBrowser from 'expo-web-browser';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  type UserCredential,
} from 'firebase/auth';
import { createContext, use, useState, type PropsWithChildren } from 'react';

WebBrowser.maybeCompleteAuthSession();

// Detecta se está rodando no Expo Go (storeClient = Expo Go app)
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Import condicional do Google Sign-In (só carrega se não for Expo Go)
let GoogleSignin: any = null;
let statusCodes: any = null;

if (!isExpoGo) {
  try {
    const googleSignInModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSignInModule.GoogleSignin;
    statusCodes = googleSignInModule.statusCodes;

    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_OAUTH_WEB,
      offlineAccess: false,
    });
  } catch (error) {
    console.warn('Google Sign-In não disponível:', error);
  }
}

interface AuthContextType {
  signIn: (email: string, password: string) => Promise<void>;
  signWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  session?: string | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  firebaseUser?: UserCredential['user'] | null;
  isGoogleSignInAvailable: boolean;
}

const AuthContext = createContext<AuthContextType>({
  signIn: async () => {},
  signWithGoogle: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  session: null,
  isLoading: false,
  isAuthenticating: false,
  firebaseUser: null,
  isGoogleSignInAvailable: !isExpoGo,
});

// Use this hook to access the user info.
export function useSession() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }

  return value;
}

// Firebase error messages em português
function getFirebaseErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Este email já está cadastrado',
    'auth/invalid-email': 'Email inválido',
    'auth/operation-not-allowed': 'Operação não permitida',
    'auth/weak-password': 'Senha muito fraca',
    'auth/user-disabled': 'Usuário desabilitado',
    'auth/user-not-found': 'Usuário não encontrado ou credenciais inválidas',
    'auth/wrong-password': 'Senha incorreta',
    'auth/invalid-credential': 'Usuário não existente',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
  };

  return errorMessages[errorCode] || 'Erro ao autenticar. Tente novamente';
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<UserCredential['user'] | null>(null);

  const signIn = async (email: string, password: string): Promise<void> => {
    setIsAuthenticating(true);
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const token = await userCredential.user.getIdToken();
      setSession(token);
      setFirebaseUser(userCredential.user);
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signWithGoogle = async (): Promise<void> => {
    // Verifica se está no Expo Go ou se GoogleSignin não foi carregado
    if (isExpoGo || !GoogleSignin) {
      throw new Error(
        'Google Sign-In não está disponível no Expo Go. Use "npx expo run:android" ou "npx expo run:ios" para testar.'
      );
    }

    setIsAuthenticating(true);
    try {
      // Verifica se Google Play Services está disponível (Android)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Faz login com Google e obtém o ID token
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.data?.idToken) {
        throw new Error('Não foi possível obter o token de autenticação do Google');
      }

      // Cria credential do Firebase com o ID token
      const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);

      // Faz login no Firebase com a credential do Google
      const userCredential = await signInWithCredential(auth, googleCredential);

      // Obtém o token do Firebase e armazena na sessão
      const token = await userCredential.user.getIdToken();
      setSession(token);
      setFirebaseUser(userCredential.user);
    } catch (error: any) {
      // Tratamento de erros específicos do Google Sign-In
      let errorMessage = 'Erro ao fazer login com Google';

      if (statusCodes) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          errorMessage = 'Login cancelado pelo usuário';
        } else if (error.code === statusCodes.IN_PROGRESS) {
          errorMessage = 'Login já em progresso';
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          errorMessage = 'Google Play Services não disponível neste dispositivo';
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    setIsAuthenticating(true);
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const token = await userCredential.user.getIdToken();
      setSession(token);
      setFirebaseUser(userCredential.user);
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsAuthenticating(true);
    try {
      await firebaseSignOut(auth);
      setSession(null);
    } catch (error: any) {
      throw new Error('Erro ao fazer logout. Tente novamente');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signWithGoogle,
        signUp,
        signOut,
        session,
        isLoading,
        isAuthenticating,
        firebaseUser,
        isGoogleSignInAvailable: !isExpoGo,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
