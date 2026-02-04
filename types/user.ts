import { FieldValue, Timestamp } from 'firebase/firestore';

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  perimeter_radius: 500 | 1000 | 2000 | 5000;
  strike_count: number;
  status: UserStatus; // Uso do Enum aqui
  created_at: Timestamp | FieldValue;
  updated_at?: Timestamp | FieldValue;
}
