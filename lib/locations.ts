import { Region } from 'react-native-maps';

// Coordenadas das capitais brasileiras
export const BRAZILIAN_STATE_CAPITALS: Record<string, Region> = {
  // Região Norte
  AC: {
    latitude: -9.97499,
    longitude: -67.8243,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Rio Branco
  AP: {
    latitude: 0.034934,
    longitude: -51.0694,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Macapá
  AM: {
    latitude: -3.11866,
    longitude: -60.0212,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Manaus
  PA: {
    latitude: -1.45583,
    longitude: -48.5044,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Belém
  RO: {
    latitude: -8.76077,
    longitude: -63.8999,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Porto Velho
  RR: {
    latitude: 2.81972,
    longitude: -60.6733,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Boa Vista
  TO: {
    latitude: -10.24,
    longitude: -48.3558,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Palmas

  // Região Nordeste
  AL: {
    latitude: -9.66599,
    longitude: -35.735,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Maceió
  BA: {
    latitude: -12.9718,
    longitude: -38.5011,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Salvador
  CE: {
    latitude: -3.71722,
    longitude: -38.5433,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Fortaleza
  MA: {
    latitude: -2.53874,
    longitude: -44.2825,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // São Luís
  PB: {
    latitude: -7.11509,
    longitude: -34.861,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // João Pessoa
  PE: {
    latitude: -8.04666,
    longitude: -34.8771,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Recife
  PI: {
    latitude: -5.08921,
    longitude: -42.8016,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Teresina
  RN: {
    latitude: -5.79357,
    longitude: -35.1986,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Natal
  SE: {
    latitude: -10.9091,
    longitude: -37.0677,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Aracaju

  // Região Centro-Oeste
  DF: {
    latitude: -15.7939,
    longitude: -47.8828,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Brasília
  GO: {
    latitude: -16.6869,
    longitude: -49.2648,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Goiânia
  MT: {
    latitude: -15.601,
    longitude: -56.0974,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Cuiabá
  MS: {
    latitude: -20.4697,
    longitude: -54.6201,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Campo Grande

  // Região Sudeste
  ES: {
    latitude: -20.3155,
    longitude: -40.3128,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Vitória
  MG: {
    latitude: -19.9167,
    longitude: -43.9345,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Belo Horizonte
  RJ: {
    latitude: -22.9068,
    longitude: -43.1729,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Rio de Janeiro
  SP: {
    latitude: -23.5505,
    longitude: -46.6333,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // São Paulo

  // Região Sul
  PR: {
    latitude: -25.4284,
    longitude: -49.2733,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Curitiba
  RS: {
    latitude: -30.0346,
    longitude: -51.2177,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Porto Alegre
  SC: {
    latitude: -27.5954,
    longitude: -48.548,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  }, // Florianópolis
};

// Região padrão - São Paulo (maior cidade do Brasil)
export const DEFAULT_REGION: Region = BRAZILIAN_STATE_CAPITALS.SP;

// Interface para resposta da API de geolocalização por IP
interface IPGeolocationResponse {
  country_code?: string;
  region_code?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Detecta a localização aproximada do usuário através do IP
 * e retorna a região da capital do estado detectado
 */
export async function getApproximateLocation(): Promise<Region> {
  try {
    console.log('[getApproximateLocation] Detectando localização por IP...');

    // Usa a API ipapi.co (gratuita, sem necessidade de chave)
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: IPGeolocationResponse = await response.json();

    console.log('[getApproximateLocation] Dados recebidos:', {
      country: data.country_code,
      region: data.region_code,
      city: data.city,
    });

    // Verifica se é Brasil
    if (data.country_code === 'BR' && data.region_code) {
      const stateCode = data.region_code.toUpperCase();
      const capital = BRAZILIAN_STATE_CAPITALS[stateCode];

      if (capital) {
        console.log(
          `[getApproximateLocation] Localização detectada: ${stateCode} - Usando capital`
        );
        return capital;
      }
    }

    // Se não for Brasil ou não conseguir detectar estado, usa São Paulo
    console.log('[getApproximateLocation] Usando localização padrão (São Paulo)');
    return DEFAULT_REGION;
  } catch (error) {
    console.error('[getApproximateLocation] Erro ao detectar localização:', error);
    // Em caso de erro, retorna São Paulo
    return DEFAULT_REGION;
  }
}

/**
 * Calcula a distância entre dois pontos em metros usando a fórmula de Haversine
 * @param lat1 Latitude do ponto 1
 * @param lon1 Longitude do ponto 1
 * @param lat2 Latitude do ponto 2
 * @param lon2 Longitude do ponto 2
 * @returns Distância em metros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distância em metros
}

/**
 * Retorna o nome da cidade/estado baseado na região
 */
export function getLocationName(region: Region): string {
  // Procura qual capital corresponde a essa região
  for (const [stateCode, capital] of Object.entries(BRAZILIAN_STATE_CAPITALS)) {
    if (
      Math.abs(capital.latitude - region.latitude) < 0.01 &&
      Math.abs(capital.longitude - region.longitude) < 0.01
    ) {
      const stateNames: Record<string, string> = {
        AC: 'Rio Branco, AC',
        AP: 'Macapá, AP',
        AM: 'Manaus, AM',
        PA: 'Belém, PA',
        RO: 'Porto Velho, RO',
        RR: 'Boa Vista, RR',
        TO: 'Palmas, TO',
        AL: 'Maceió, AL',
        BA: 'Salvador, BA',
        CE: 'Fortaleza, CE',
        MA: 'São Luís, MA',
        PB: 'João Pessoa, PB',
        PE: 'Recife, PE',
        PI: 'Teresina, PI',
        RN: 'Natal, RN',
        SE: 'Aracaju, SE',
        DF: 'Brasília, DF',
        GO: 'Goiânia, GO',
        MT: 'Cuiabá, MT',
        MS: 'Campo Grande, MS',
        ES: 'Vitória, ES',
        MG: 'Belo Horizonte, MG',
        RJ: 'Rio de Janeiro, RJ',
        SP: 'São Paulo, SP',
        PR: 'Curitiba, PR',
        RS: 'Porto Alegre, RS',
        SC: 'Florianópolis, SC',
      };
      return stateNames[stateCode] || stateCode;
    }
  }
  return 'Localização desconhecida';
}
