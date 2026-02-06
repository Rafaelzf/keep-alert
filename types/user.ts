import { FieldValue, Timestamp } from 'firebase/firestore';

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
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
  timestamp: Timestamp | FieldValue;
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
  last_location?: UserLocation;
  alerts_notifications?: boolean;
  created_at: Timestamp | FieldValue;
  updated_at?: Timestamp | FieldValue;
}
