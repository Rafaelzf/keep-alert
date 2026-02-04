import { DocumentReference, FieldValue, Timestamp } from 'firebase/firestore';

export enum IncidentStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  POLICE_ON_WAY = 'police_on_way',
  AMBULANCE_ON_WAY = 'ambulance_on_way',
}

export enum IncidentCategory {
  ROBBERY = 'Robbery',
  FIRE = 'Fire',
  FLOOD = 'Flood',
  SUSPICIOUS = 'Suspicious Activity',
  TRAFFIC = 'Traffic Accident',
  LOST_PERSON = 'Lost Person',
  LOST_ANIMAL = 'Lost Animal',
}

export interface Incident {
  id?: string;
  category: IncidentCategory;
  description?: string;
  author_ref: DocumentReference;
  location: {
    geopoint: { lat: number; long: number };
    geohash: string;
  };
  status: IncidentStatus;
  created_at: Timestamp | FieldValue;
  stats: {
    police_on_way_count: number;
    ambulance_on_way_count: number;
    false_report_count: number;
  };
}
