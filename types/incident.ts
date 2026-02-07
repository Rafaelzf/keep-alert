import { DocumentReference, FieldValue, Timestamp } from 'firebase/firestore';

export enum IncidentStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  POLICE_ON_WAY = 'police_on_way',
  AMBULANCE_ON_WAY = 'ambulance_on_way',
}

export enum IncidentCategory {
  THEFT = 'theft',
  ROBBERY = 'robbery',
  ROBBERY_ATTEMPT = 'robbery-attempt',
  HARASSMENT = 'harassment',
  FIGHT = 'fight',
  FIRE = 'fire',
  FLOODING = 'flooding',
  LOUD_NOISE = 'loud-noise',
  LOST_ANIMAL = 'lost-animal',
  LOST_PERSON = 'lost-person',
  ANIMAL_ABUSE = 'animal-abuse',
  KIDNAPPING = 'kidnapping',
  LOST_CHILD = 'lost-child',
  CRASH_CAR = 'crash-car',
  BLACKOUT = 'blackout',
  NO_WATER = 'no-water',
  TREE_FALL = 'tree-fall',
  INTERRUPTED_ROAD = 'interrupted-road',
  INVASION_PROPERTY = 'invasion-property',
  SUSPICIOUS = 'Suspicious Activity',
}

export interface Incident {
  id: string;
  category: IncidentCategory;
  description?: string;
  author_ref: DocumentReference;
  author_id: string;
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

export interface IncidentOption {
  id: IncidentCategory;
  label: string;
  icon: string;
  color: string;
}
