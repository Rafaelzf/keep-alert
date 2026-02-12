import { auth, db } from '@/firebase/firebaseConfig';
import { useStorageState } from '@/hooks/useStorageState';
import { UserLocation, UserProfile, UserStatus } from '@/types/user';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  type UserCredential,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

WebBrowser.maybeCompleteAuthSession();

// Detecta se está rodando no Expo Go (storeClient = Expo Go app)
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Import condicional do Google Sign-In (só carrega se não for Expo Go)
let GoogleSignin: any = null;
let statusCodes: any = null;

if (!isExpoGo) {
  try {
    // @ts-expect-error - require dinâmico não é totalmente suportado pelo TypeScript
    const googleSignInModule = require('@react-native-google-signin/google-signin') as any;
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
  forgotPassword: (email: string) => Promise<void>;
  updateUserLocation: (latitude: number, longitude: number) => Promise<void>;
  updateUserPerimeter: (perimeter: number) => Promise<void>;
  updateUserNotifications: (enabled: boolean) => Promise<void>;
  updateUserAvatar: (photoURL: string) => Promise<void>;
  updateUserProfile: (name: string, phoneNumber: string) => Promise<void>;
  session?: string | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  firebaseUser?: UserCredential['user'] | null; // Usuário do Firebase Auth
  user: UserProfile | null; // Usuário do Firestore (banco de dados)
  isGoogleSignInAvailable: boolean;
}

const AuthContext = createContext<AuthContextType>({
  signIn: async () => {},
  signWithGoogle: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  forgotPassword: async () => {},
  updateUserLocation: async () => {},
  updateUserPerimeter: async () => {},
  updateUserNotifications: async () => {},
  updateUserAvatar: async () => {},
  updateUserProfile: async () => {},
  session: null,
  isLoading: false,
  isAuthenticating: false,
  firebaseUser: null,
  user: null,
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
    'auth/user-not-found': 'Nenhuma conta encontrada com este email',
    'auth/wrong-password': 'Senha incorreta',
    'auth/invalid-credential': 'Usuário não existente',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
  };

  return errorMessages[errorCode] || 'Erro ao autenticar. Tente novamente';
}

// Salvar dados do usuário no Firestore
async function saveUserToFirestore(user: UserCredential['user']): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        name: user.displayName || '',
        email: user.email,
        alerts_notifications: true,
        phoneNumber: user.phoneNumber || '',
        terms_accepted: false,
        photoURL: user.photoURL || '',
        perimeter_radius: 500,
        strike_count: 0,
        status: UserStatus.ACTIVE,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      },
      { merge: true } // Não sobrescreve dados existentes
    );
    console.log('[saveUserToFirestore] Usuário salvo no Firestore:', user.uid);
  } catch (error) {
    console.error('[saveUserToFirestore] Erro ao salvar usuário:', error);
    // Não lança erro para não interromper o fluxo de autenticação
  }
}

// Buscar dados do usuário no Firestore
async function getUserFromFirestore(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      console.log('[getUserFromFirestore] Usuário encontrado no Firestore:', uid);
      return userDoc.data() as UserProfile;
    } else {
      console.log('[getUserFromFirestore] Usuário não encontrado no Firestore:', uid);
      return null;
    }
  } catch (error) {
    console.error('[getUserFromFirestore] Erro ao buscar usuário:', error);
    return null;
  }
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<UserCredential['user'] | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Observa mudanças no estado de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('[onAuthStateChanged] Usuário autenticado:', firebaseUser.uid);

        // IMPORTANTE: Busca dados do usuário no Firestore ANTES de atualizar a sessão
        // Isso evita race condition onde o redirect acontece antes do user carregar
        const userProfile = await getUserFromFirestore(firebaseUser.uid);

        // Obtém o token para verificar se precisa atualizar
        const token = await firebaseUser.getIdToken();

        // Atualiza o estado na ordem correta: firebaseUser → user → session
        setFirebaseUser(firebaseUser);
        setUser(userProfile);

        // Atualiza a sessão apenas depois que o user foi carregado
        // Usa setSession com callback para ter acesso ao valor atual
        setSession((currentSession) => {
          if (currentSession !== token) {
            console.log('[onAuthStateChanged] Sessão atualizada após carregar user');
            return token;
          }
          return currentSession;
        });
      } else {
        console.log('[onAuthStateChanged] Usuário não autenticado');
        setFirebaseUser(null);
        setUser(null);
        setSession(null);
      }
    });

    // Cleanup do listener quando o componente desmonta
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setIsAuthenticating(true);
    try {
      // Apenas faz login no Firebase Auth
      // O listener onAuthStateChanged cuidará de atualizar session, firebaseUser e user
      await signInWithEmailAndPassword(auth, email, password);
      console.log('[signIn] Login realizado, aguardando onAuthStateChanged atualizar o estado');
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

      // Verifica se é um novo usuário e salva no Firestore
      const additionalUserInfo = getAdditionalUserInfo(userCredential);
      if (additionalUserInfo?.isNewUser) {
        await saveUserToFirestore(userCredential.user);
      }

      // O listener onAuthStateChanged cuidará de atualizar session, firebaseUser e user
      console.log('[signWithGoogle] Login realizado, aguardando onAuthStateChanged atualizar o estado');
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

      // Salvar dados do usuário no Firestore (necessário para novos usuários)
      await saveUserToFirestore(userCredential.user);

      // O listener onAuthStateChanged cuidará de atualizar session, firebaseUser e user
      console.log('[signUp] Cadastro realizado, aguardando onAuthStateChanged atualizar o estado');
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
      setFirebaseUser(null);
      setUser(null);
    } catch (error: any) {
      throw new Error('Erro ao fazer logout. Tente novamente');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    setIsAuthenticating(true);
    try {
      console.log('[forgotPassword] Enviando email para:', email);
      await sendPasswordResetEmail(auth, email);
      console.log('[forgotPassword] Email enviado com sucesso!');
      // Email de reset enviado com sucesso
    } catch (error: any) {
      console.error('[forgotPassword] Erro ao enviar email:', error);
      const errorMessage = getFirebaseErrorMessage(error.code);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const updateUserLocation = async (latitude: number, longitude: number): Promise<void> => {
    try {
      if (!firebaseUser) {
        console.log('[updateUserLocation] Usuário não autenticado');
        return;
      }

      const userRef = doc(db, 'users', firebaseUser.uid);
      const locationData: UserLocation = {
        latitude,
        longitude,
        timestamp: serverTimestamp(),
      };

      await setDoc(
        userRef,
        {
          last_location: locationData,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      // Atualiza o estado local do user
      if (user) {
        setUser({
          ...user,
          last_location: locationData,
        });
      }
    } catch (error) {
      console.error('[updateUserLocation] Erro ao atualizar localização:', error);
      // Não lança erro para não interromper o fluxo do app
    }
  };

  const updateUserPerimeter = async (perimeter: number): Promise<void> => {
    try {
      if (!firebaseUser) {
        return;
      }

      const userRef = doc(db, 'users', firebaseUser.uid);

      await setDoc(
        userRef,
        {
          perimeter_radius: perimeter,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      // Atualiza o estado local do user
      if (user) {
        setUser({
          ...user,
          perimeter_radius: perimeter as 500 | 1000 | 2000 | 5000,
        });
      }
    } catch (error) {
      throw new Error('Erro ao salvar perímetro. Tente novamente');
    }
  };

  const updateUserNotifications = async (enabled: boolean): Promise<void> => {
    try {
      if (!firebaseUser) {
        console.log('[updateUserNotifications] Usuário não autenticado');
        return;
      }

      const userRef = doc(db, 'users', firebaseUser.uid);

      await setDoc(
        userRef,
        {
          alerts_notifications: enabled,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('[updateUserNotifications] Notificações atualizadas:', enabled);

      // Atualiza o estado local do user
      if (user) {
        setUser({
          ...user,
          alerts_notifications: enabled,
        });
      }
    } catch (error) {
      console.error('[updateUserNotifications] Erro ao atualizar notificações:', error);
      throw new Error('Erro ao salvar configuração de notificações. Tente novamente');
    }
  };

  const updateUserAvatar = async (photoURL: string): Promise<void> => {
    try {
      if (!firebaseUser) {
        console.log('[updateUserAvatar] Usuário não autenticado');
        return;
      }

      const userRef = doc(db, 'users', firebaseUser.uid);

      await setDoc(
        userRef,
        {
          photoURL,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('[updateUserAvatar] Avatar atualizado:', photoURL);

      // Atualiza o estado local do user
      if (user) {
        setUser({
          ...user,
          photoURL,
        });
      }
    } catch (error) {
      console.error('[updateUserAvatar] Erro ao atualizar avatar:', error);
      throw new Error('Erro ao salvar foto de perfil. Tente novamente');
    }
  };

  const updateUserProfile = async (name: string, phoneNumber: string): Promise<void> => {
    try {
      if (!firebaseUser) {
        console.log('[updateUserProfile] Usuário não autenticado');
        return;
      }

      const userRef = doc(db, 'users', firebaseUser.uid);

      await setDoc(
        userRef,
        {
          name,
          phoneNumber,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('[updateUserProfile] Perfil atualizado:', { name, phoneNumber });

      // Atualiza o estado local do user
      if (user) {
        setUser({
          ...user,
          name,
          phoneNumber,
        });
      }
    } catch (error) {
      console.error('[updateUserProfile] Erro ao atualizar perfil:', error);
      throw new Error('Erro ao salvar perfil. Tente novamente');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signWithGoogle,
        signUp,
        signOut,
        forgotPassword,
        updateUserLocation,
        updateUserPerimeter,
        updateUserNotifications,
        updateUserAvatar,
        updateUserProfile,
        session,
        isLoading,
        isAuthenticating,
        firebaseUser,
        user,
        isGoogleSignInAvailable: !isExpoGo,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
