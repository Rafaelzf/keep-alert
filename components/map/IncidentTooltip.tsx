import { INCIDENT_TYPES } from '@/constants/incidents';
import { Incident } from '@/types/incident';
import { Text, View } from 'react-native';

interface IncidentTooltipProps {
  incident: Incident | null;
}

export function IncidentTooltip({ incident }: IncidentTooltipProps) {
  console.log('[IncidentTooltip] Renderizando com incident:', incident?.category);

  if (!incident) return null;

  const incidentType = INCIDENT_TYPES.find((type) => type.id === incident.category);
  const label = incidentType?.label || 'Ocorrência';

  console.log('[IncidentTooltip] Mostrando tooltip:', label);

  return (
    <View
      style={{
        position: 'absolute',
        top: 80,
        left: '50%',
        transform: [{ translateX: -100 }],
        width: 200,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 1000,
      }}>
      <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', color: '#1f2937' }}>
        {label}
      </Text>
      {incident.description && (
        <Text style={{ fontSize: 12, textAlign: 'center', color: '#6b7280', marginTop: 4 }}>
          {incident.description}
        </Text>
      )}
    </View>
  );
}
