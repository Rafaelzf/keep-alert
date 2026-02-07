import { Images } from '@maplibre/maplibre-react-native';

// Ícones customizados locais (100x100 PNG com círculo colorido e ícone FontAwesome)
const incidentIcons = {
  theft: require('@/assets/incident-icons/theft.png'),
  robbery: require('@/assets/incident-icons/robbery.png'),
  'robbery-attempt': require('@/assets/incident-icons/robbery-attempt.png'),
  harassment: require('@/assets/incident-icons/harassment.png'),
  fight: require('@/assets/incident-icons/fight.png'),
  'Suspicious Activity': require('@/assets/incident-icons/suspicious.png'),
  fire: require('@/assets/incident-icons/fire.png'),
  flooding: require('@/assets/incident-icons/flooding.png'),
  'loud-noise': require('@/assets/incident-icons/loud-noise.png'),
  'lost-animal': require('@/assets/incident-icons/lost-animal.png'),
  'lost-person': require('@/assets/incident-icons/lost-person.png'),
  'animal-abuse': require('@/assets/incident-icons/animal-abuse.png'),
  kidnapping: require('@/assets/incident-icons/kidnapping.png'),
  'lost-child': require('@/assets/incident-icons/lost-child.png'),
  'crash-car': require('@/assets/incident-icons/crash-car.png'),
  blackout: require('@/assets/incident-icons/blackout.png'),
  'no-water': require('@/assets/incident-icons/no-water.png'),
  'tree-fall': require('@/assets/incident-icons/tree-fall.png'),
  'interrupted-road': require('@/assets/incident-icons/interrupted-road.png'),
  'invasion-property': require('@/assets/incident-icons/invasion-property.png'),
};

export function IncidentMarkerImages() {
  return <Images images={incidentIcons} />;
}
