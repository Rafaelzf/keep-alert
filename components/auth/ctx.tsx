import { useStorageState } from '@/hooks/useStorageState';
import { subscribeToGeohashTopics, unsubscribeFromGeohashTopics } from '@/lib/fcm';
import { UserLocation, UserProfile, UserStatus } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  FirebaseAuthTypes,
  signOut as firebaseSignOut,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
} from '@react-native-firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

WebBrowser.maybeCompleteAuthSession();

// Chaves AsyncStorage compartilhadas com o background handler (index.tsx)
const LOCATION_KEY = 'user_last_location';
const PERIMETER_KEY = 'user_perimeter_radius';
const NOTIFICATIONS_KEY = 'user_alerts_notifications';

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
  acceptTerms: () => Promise<void>;
  rejectTerms: () => Promise<void>;
  session?: string | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  firebaseUser?: FirebaseAuthTypes.User | null;
  user: UserProfile | null;
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
  acceptTerms: async () => {},
  rejectTerms: async () => {},
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
    'auth/invalid-credential': 'Credenciais inválidas. Verifique seu email e senha',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
  };

  return errorMessages[errorCode] || 'Erro ao autenticar. Tente novamente';
}

// Salvar dados do usuário no Firestore
async function saveUserToFirestore(user: FirebaseAuthTypes.User): Promise<void> {
  try {
    const db = getFirestore();
    await setDoc(
      doc(db, 'users', user.uid),
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
      { merge: true }
    );
    console.log('[saveUserToFirestore] Usuário salvo no Firestore:', user.uid);
  } catch (error) {
    console.error('[saveUserToFirestore] Erro ao salvar usuário:', error);
    // Não lança erro para não interromper o fluxo de autenticação
  }
}

// Buscar dados do usuário no Firestore
async function getUserFromFirestore(uid: string): Promise<UserProfile | null> {
  console.log('[getUserFromFirestore] Buscando uid:', uid);
  const t0 = Date.now();
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', uid));
    console.log(
      `[getUserFromFirestore] Resposta do Firestore em ${Date.now() - t0}ms — exists:`,
      userDoc.exists
    );

    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile;
      console.log('[getUserFromFirestore] ✅ Usuário encontrado:', JSON.stringify(data));
      return data;
    } else {
      console.log('[getUserFromFirestore] ⚠️ Documento não encontrado para uid:', uid);
      return null;
    }
  } catch (error: any) {
    console.error('[getUserFromFirestore] ❌ Erro ao buscar usuário:', error.code, error.message);
    return null;
  }
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Observa mudanças no estado de autenticação do Firebase
  useEffect(() => {
    console.log('[SessionProvider] Registrando listener onAuthStateChanged...');
    const unsubscribe = onAuthStateChanged(getAuth(), async (firebaseUser) => {
      console.log('[onAuthStateChanged] Disparado — uid:', firebaseUser?.uid ?? 'null');
      if (firebaseUser) {
        console.log('[onAuthStateChanged] Usuário autenticado:', firebaseUser.uid);

        // IMPORTANTE: Busca dados do usuário no Firestore ANTES de atualizar a sessão
        // Isso evita race condition onde o redirect acontece antes do user carregar
        let userProfile = await getUserFromFirestore(firebaseUser.uid);

        // Recuperação: se o usuário existe no Auth mas não no Firestore (ex: deletado manualmente),
        // recria o documento com os dados disponíveis do Firebase Auth
        if (!userProfile) {
          console.log(
            '[onAuthStateChanged] Documento do usuário não encontrado, recriando no Firestore...'
          );
          await saveUserToFirestore(firebaseUser);
          userProfile = await getUserFromFirestore(firebaseUser.uid);
        }

        // Se mesmo após tentar recriar o documento o perfil não foi encontrado,
        // faz logout para evitar estado inconsistente (spinner infinito)
        if (!userProfile) {
          console.error(
            '[onAuthStateChanged] Falha ao carregar perfil do Firestore, fazendo logout...'
          );
          await firebaseSignOut(getAuth());
          return;
        }

        // Obtém o token de autenticação
        const token = await firebaseUser.getIdToken();

        // Hidrata AsyncStorage para o background handler
        if (userProfile.last_location) {
          await AsyncStorage.setItem(
            LOCATION_KEY,
            JSON.stringify({
              latitude: userProfile.last_location.latitude,
              longitude: userProfile.last_location.longitude,
            })
          );
          await subscribeToGeohashTopics(
            userProfile.last_location.latitude,
            userProfile.last_location.longitude
          );
        }
        await AsyncStorage.setItem(PERIMETER_KEY, String(userProfile.perimeter_radius ?? 500));
        await AsyncStorage.setItem(
          NOTIFICATIONS_KEY,
          String(userProfile.alerts_notifications ?? true)
        );

        // Atualiza o estado na ordem correta: firebaseUser → user → session
        setFirebaseUser(firebaseUser);
        setUser(userProfile);
        setSession(token);
      } else {
        console.log('[onAuthStateChanged] Usuário não autenticado');
        setFirebaseUser(null);
        setUser(null);
        setSession(null);
      }
    });

    // Cleanup do listener quando o componente desmonta
    return () => {
      console.log('[SessionProvider] Removendo listener onAuthStateChanged');
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    console.log('[signIn] Iniciando login para:', email);
    setIsAuthenticating(true);
    try {
      console.log('[signIn] Chamando signInWithEmailAndPassword...');
      const t0 = Date.now();
      await signInWithEmailAndPassword(getAuth(), email, password);
      console.log(
        `[signIn] ✅ Login realizado em ${Date.now() - t0}ms — aguardando onAuthStateChanged`
      );
    } catch (error: any) {
      console.error('[signIn] ❌ Erro de autenticação:', {
        code: error.code,
        message: error.message,
        fullError: JSON.stringify(error),
      });
      const errorMessage = getFirebaseErrorMessage(error.code);
      throw new Error(errorMessage);
    } finally {
      console.log('[signIn] finally: resetando isAuthenticating → false');
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

      // Cria credential do Firebase com o ID token (usando native SDK)
      const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);

      // Faz login no Firebase com a credential do Google
      const userCredential = await signInWithCredential(getAuth(), googleCredential);

      // Verifica se é um novo usuário e salva no Firestore
      if (userCredential.additionalUserInfo?.isNewUser) {
        await saveUserToFirestore(userCredential.user);
      }

      // O listener onAuthStateChanged cuidará de atualizar session, firebaseUser e user
      console.log(
        '[signWithGoogle] Login realizado, aguardando onAuthStateChanged atualizar o estado'
      );
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
      const userCredential = await createUserWithEmailAndPassword(getAuth(), email, password);

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
      // Desinscreve dos tópicos FCM e limpa AsyncStorage antes de deslogar
      await unsubscribeFromGeohashTopics();
      await Promise.all([
        AsyncStorage.removeItem(LOCATION_KEY),
        AsyncStorage.removeItem(PERIMETER_KEY),
        AsyncStorage.removeItem(NOTIFICATIONS_KEY),
      ]);

      await firebaseSignOut(getAuth());
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
      await sendPasswordResetEmail(getAuth(), email);
      console.log('[forgotPassword] Email enviado com sucesso!');
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

      if (!user) {
        console.log('[updateUserLocation] Dados do usuário não carregados');
        return;
      }

      if (user.status !== UserStatus.ACTIVE) {
        console.log('[updateUserLocation] Usuário inativo, não atualizando localização');
        return;
      }

      if (!user.terms_accepted) {
        console.log('[updateUserLocation] Termos não aceitos, não atualizando localização');
        return;
      }

      const db = getFirestore();
      const locationData = {
        latitude,
        longitude,
        timestamp: serverTimestamp(),
      };

      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          last_location: locationData,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      // Sincroniza AsyncStorage e atualiza subscrição FCM por geohash
      await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify({ latitude, longitude }));
      await subscribeToGeohashTopics(latitude, longitude);

      setUser({
        ...user,
        last_location: locationData as unknown as UserLocation,
      });
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

      const db = getFirestore();
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          perimeter_radius: perimeter,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      await AsyncStorage.setItem(PERIMETER_KEY, String(perimeter));

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

      const db = getFirestore();
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          alerts_notifications: enabled,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      await AsyncStorage.setItem(NOTIFICATIONS_KEY, String(enabled));
      console.log('[updateUserNotifications] Notificações atualizadas:', enabled);

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

      const db = getFirestore();
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          photoURL,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('[updateUserAvatar] Avatar atualizado:', photoURL);

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

      const db = getFirestore();
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          name,
          phoneNumber,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('[updateUserProfile] Perfil atualizado:', { name, phoneNumber });

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

  const acceptTerms = async (): Promise<void> => {
    try {
      if (!firebaseUser) {
        console.log('[acceptTerms] Usuário não autenticado');
        return;
      }

      const db = getFirestore();
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          terms_accepted: true,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('[acceptTerms] Termos aceitos pelo usuário');

      if (user) {
        setUser({
          ...user,
          terms_accepted: true,
        });
      }
    } catch (error) {
      console.error('[acceptTerms] Erro ao aceitar termos:', error);
      throw new Error('Erro ao salvar aceite dos termos. Tente novamente');
    }
  };

  const rejectTerms = async (): Promise<void> => {
    try {
      if (!firebaseUser) {
        console.log('[rejectTerms] Usuário não autenticado');
        return;
      }

      const db = getFirestore();
      // Marca a conta como inativa
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          status: UserStatus.INACTIVE,
          terms_accepted: false,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('[rejectTerms] Termos rejeitados, conta marcada como inativa');

      // Desloga o usuário
      await signOut();
    } catch (error) {
      console.error('[rejectTerms] Erro ao rejeitar termos:', error);
      throw new Error('Erro ao processar rejeição dos termos');
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
        acceptTerms,
        rejectTerms,
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
