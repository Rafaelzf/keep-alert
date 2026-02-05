import { FieldValue, Timestamp } from 'firebase/firestore';

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: Timestamp | FieldValue;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  perimeter_radius: 500 | 1000 | 2000 | 5000;
  strike_count: number;
  status: UserStatus;
  last_location?: UserLocation; // Última localização GPS conhecida
  created_at: Timestamp | FieldValue;
  updated_at?: Timestamp | FieldValue;
}
