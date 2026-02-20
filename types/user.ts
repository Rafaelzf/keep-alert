import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'Banned',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum UserPerimeterRadius {
  R500 = 500,
  R1000 = 1000,
  R2000 = 2000,
  R5000 = 5000,
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: FirebaseFirestoreTypes.Timestamp | FirebaseFirestoreTypes.FieldValue;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  terms_accepted?: boolean;
  photoURL?: string;
  perimeter_radius: UserPerimeterRadius;
  strike_count: number;
  status: UserStatus;
  role?: UserRole; // Role do usuário (user ou admin)
  last_location?: UserLocation;
  alerts_notifications?: boolean;
  created_at: FirebaseFirestoreTypes.Timestamp | FirebaseFirestoreTypes.FieldValue;
  updated_at?: FirebaseFirestoreTypes.Timestamp | FirebaseFirestoreTypes.FieldValue;
}
