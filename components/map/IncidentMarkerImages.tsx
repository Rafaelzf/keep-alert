import { INCIDENT_TYPES } from '@/constants/incidents';
import { Images } from '@maplibre/maplibre-react-native';

// SVG paths para ícones FontAwesome6 (simplificados para uso em markers)
const ICON_PATHS: Record<string, string> = {
  'sack-dollar': 'M12 4 L16 8 L16 18 C16 19 15 20 14 20 L10 20 C9 20 8 19 8 18 L8 8 Z M11 11 L13 11 L13 13 L15 13 L15 15 L13 15 L13 17 L11 17 L11 15 L9 15 L9 13 L11 13 Z',
  'mask': 'M12 6 C8 6 6 8 6 10 L6 14 C6 16 8 18 12 18 C16 18 18 16 18 14 L18 10 C18 8 16 6 12 6 Z M9 11 C9.5 11 10 11.5 10 12 C10 12.5 9.5 13 9 13 C8.5 13 8 12.5 8 12 C8 11.5 8.5 11 9 11 Z M15 11 C15.5 11 16 11.5 16 12 C16 12.5 15.5 13 15 13 C14.5 13 14 12.5 14 12 C14 11.5 14.5 11 15 11 Z',
  'fire-flame-curved': 'M12 4 C10 8 9 10 9 12 C9 14.7 10.3 16 12 16 C13.7 16 15 14.7 15 12 C15 10 14 8 12 4 Z M12 10 C11 11 10.5 11.5 10.5 12.5 C10.5 13.3 11.2 14 12 14 C12.8 14 13.5 13.3 13.5 12.5 C13.5 11.5 13 11 12 10 Z',
  'car-burst': 'M8 10 L10 7 L14 7 L16 10 L18 10 L18 14 L17 14 C17 15.1 16.1 16 15 16 C13.9 16 13 15.1 13 14 L11 14 C11 15.1 10.1 16 9 16 C7.9 16 7 15.1 7 14 L6 14 L6 10 Z M10 9 L12 9 L14 9 L15 10 L9 10 Z M8 12 C8.5 12 9 12.5 9 13 C9 13.5 8.5 14 8 14 C7.5 14 7 13.5 7 13 C7 12.5 7.5 12 8 12 Z M16 12 C16.5 12 17 12.5 17 13 C17 13.5 16.5 14 16 14 C15.5 14 15 13.5 15 13 C15 12.5 15.5 12 16 12 Z M13 5 L15 7 M11 5 L9 7 M12 4 L12 6',
  'house-flood-water': 'M12 5 L6 9 L6 16 L18 16 L18 9 Z M7 13 C8 13 9 14 10 14 C11 14 12 13 13 13 C14 13 15 14 16 14 C17 14 18 13 18 13 M7 15 C8 15 9 16 10 16 C11 16 12 15 13 15 C14 15 15 16 16 16 C17 16 18 15 18 15',
  'gun': 'M7 10 L7 12 L10 12 L10 14 L14 14 L14 12 L17 12 L17 10 Z M15 11 L16 11 L16 12 L15 12 Z M18 10 L20 10 L20 12 L18 12 Z',
  'person-falling-burst': 'M12 6 C12.8 6 13.5 6.7 13.5 7.5 C13.5 8.3 12.8 9 12 9 C11.2 9 10.5 8.3 10.5 7.5 C10.5 6.7 11.2 6 12 6 Z M11 10 L13 10 L14 13 L16 11 L17 12 L14 15 L13 18 L11 18 L10 15 L8 16 L7 15 L9 13 Z M6 4 L8 6 M18 4 L16 6 M6 18 L8 16 M18 18 L16 16',
  'pills': 'M10 8 C8 8 7 9 7 11 L7 13 C7 15 8 16 10 16 C12 16 13 15 13 13 L13 11 C13 9 12 8 10 8 Z M10 10 L10 14 M16 10 C17.1 10 18 10.9 18 12 C18 13.1 17.1 14 16 14 C14.9 14 14 13.1 14 12 C14 10.9 14.9 10 16 10 Z M15 11 L17 13',
  'person-harassing': 'M9 7 C9 8.1 9.9 9 11 9 C12.1 9 13 8.1 13 7 C13 5.9 12.1 5 11 5 C9.9 5 9 5.9 9 7 Z M8 10 L10 10 L10 14 L8 19 L10 19 L11 15 L12 19 L14 19 L12 14 L12 10 L14 10 M15 12 L18 12 M16 11 L19 11 M17 13 L19 13',
  'square-person-confined': 'M5 5 L5 19 L19 19 L19 5 Z M12 8 C12.5 8 13 8.5 13 9 C13 9.5 12.5 10 12 10 C11.5 10 11 9.5 11 9 C11 8.5 11.5 8 12 8 Z M10 11 L14 11 L14 14 L16 14 L16 16 L8 16 L8 14 L10 14 Z',
  'house-crack': 'M12 5 L6 9 L6 18 L11 18 L11 15 L10 13 L12 13 L11 11 L13 11 L13 18 L18 18 L18 9 Z M12 5 L12 8',
  'head-side-mask': 'M12 6 C10 6 8 8 8 10 L8 12 L8 14 C8 15 9 16 10 16 L14 16 C15 16 16 15 16 14 L16 12 C16 8 14 6 12 6 Z M10 11 L14 11 L14 13 L10 13 Z',
  'volume-high': 'M8 10 L6 10 L6 14 L8 14 L11 17 L11 7 Z M13 9 C14 10 14 14 13 15 M14 8 C16 9 16 15 14 16 M15 7 C17 8 17 16 15 17',
  'paw': 'M12 14 C10.5 14 9 13 9 11.5 C9 10 10 9 11 9 C11.5 9 12 9.2 12 9.2 C12 9.2 12.5 9 13 9 C14 9 15 10 15 11.5 C15 13 13.5 14 12 14 Z M9 8 C9.5 8 10 8.5 10 9 C10 9.5 9.5 10 9 10 C8.5 10 8 9.5 8 9 C8 8.5 8.5 8 9 8 Z M15 8 C15.5 8 16 8.5 16 9 C16 9.5 15.5 10 15 10 C14.5 10 14 9.5 14 9 C14 8.5 14.5 8 15 8 Z M7 11 C7.5 11 8 11.5 8 12 C8 12.5 7.5 13 7 13 C6.5 13 6 12.5 6 12 C6 11.5 6.5 11 7 11 Z M17 11 C17.5 11 18 11.5 18 12 C18 12.5 17.5 13 17 13 C16.5 13 16 12.5 16 12 C16 11.5 16.5 11 17 11 Z',
  'bolt': 'M14 4 L8 12 L11 12 L10 20 L16 12 L13 12 Z',
  'car-side': 'M6 12 L8 9 L16 9 L18 12 L20 12 L20 15 L19 15 C19 16.1 18.1 17 17 17 C15.9 17 15 16.1 15 15 L9 15 C9 16.1 8.1 17 7 17 C5.9 17 5 16.1 5 15 L4 15 L4 12 Z M9 10 L15 10 L16 11 L8 11 Z M7 13.5 C7.5 13.5 8 14 8 14.5 C8 15 7.5 15.5 7 15.5 C6.5 15.5 6 15 6 14.5 C6 14 6.5 13.5 7 13.5 Z M17 13.5 C17.5 13.5 18 14 18 14.5 C18 15 17.5 15.5 17 15.5 C16.5 15.5 16 15 16 14.5 C16 14 16.5 13.5 17 13.5 Z',
  'tree': 'M12 4 L10 8 L11 8 L9 11 L10 11 L8 14 L16 14 L14 11 L15 11 L13 8 L14 8 Z M11 14 L11 19 L13 19 L13 14',
  'radiation': 'M12 10 C13.1 10 14 10.9 14 12 C14 13.1 13.1 14 12 14 C10.9 14 10 13.1 10 12 C10 10.9 10.9 10 12 10 Z M12 5 L13 10 L11 10 Z M7 8 L11 11 L10 12 Z M17 8 L13 11 L14 12 Z M7 16 L11 13 L10 12 Z M17 16 L13 13 L14 12 Z M12 19 L11 14 L13 14 Z',
  'kit-medical': 'M6 7 L6 17 L18 17 L18 7 Z M10 5 L14 5 L14 7 L10 7 Z M10 11 L14 11 L14 13 L10 13 Z M11 10 L13 10 L13 14 L11 14 Z',
  'other': 'M12 10 C13.1 10 14 10.9 14 12 C14 13.1 13.1 14 12 14 C10.9 14 10 13.1 10 12 C10 10.9 10.9 10 12 10 Z M6 10 C7.1 10 8 10.9 8 12 C8 13.1 7.1 14 6 14 C4.9 14 4 13.1 4 12 C4 10.9 4.9 10 6 10 Z M18 10 C19.1 10 20 10.9 20 12 C20 13.1 19.1 14 18 14 C16.9 14 16 13.1 16 12 C16 10.9 16.9 10 18 10 Z',
};

// Gera SVG data URI para um marker
function createMarkerSVG(iconPath: string, color: string): string {
  const svg = `
    <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <path d="${iconPath}" fill="#ffffff" stroke="none"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Gera objeto com todos os markers
export function getIncidentMarkers(): Record<string, string> {
  const markers: Record<string, string> = {};

  INCIDENT_TYPES.forEach((type) => {
    const iconPath = ICON_PATHS[type.icon] || ICON_PATHS['other'];
    markers[type.id] = createMarkerSVG(iconPath, type.color);
  });

  return markers;
}

// Componente que carrega as imagens no MapLibre
export function IncidentMarkerImages() {
  const markers = getIncidentMarkers();
  const images = Object.entries(markers).reduce(
    (acc, [key, uri]) => ({
      ...acc,
      [key]: uri,
    }),
    {} as Record<string, string>
  );

  return <Images images={images} />;
}
