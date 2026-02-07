import { IncidentCategory, IncidentOption } from '@/types/incident';

export const INCIDENT_TYPES: IncidentOption[] = [
  { id: IncidentCategory.THEFT, label: 'Furto', icon: 'sack-xmark', color: '#a855f7' },
  { id: IncidentCategory.ROBBERY, label: 'Assalto', icon: 'gun', color: '#ef4444' },
  {
    id: IncidentCategory.ROBBERY_ATTEMPT,
    label: 'Tentativa de Roubo',
    icon: 'people-robbery',
    color: '#f59e0b',
  },
  { id: IncidentCategory.HARASSMENT, label: 'Assédio', icon: 'people-pulling', color: '#a855f7' },
  { id: IncidentCategory.FIGHT, label: 'Briga', icon: 'hand-rock', color: '#fb923c' },
  {
    id: IncidentCategory.SUSPICIOUS,
    label: 'Atividade Suspeita',
    icon: 'user-ninja',
    color: '#dc2626',
  },
  { id: IncidentCategory.FIRE, label: 'Incêndio', icon: 'fire-flame-curved', color: '#f97316' },
  { id: IncidentCategory.FLOODING, label: 'Alagamento', icon: 'person-drowning', color: '#06b6d4' },
  { id: IncidentCategory.LOUD_NOISE, label: 'Som Alto', icon: 'volume-high', color: '#8b5cf6' },
  { id: IncidentCategory.LOST_ANIMAL, label: 'Animal Perdido', icon: 'paw', color: '#eab308' },
  {
    id: IncidentCategory.LOST_PERSON,
    label: 'Pessoa Desaparecida',
    icon: 'person-circle-question',
    color: '#f97316',
  },
  {
    id: IncidentCategory.ANIMAL_ABUSE,
    label: 'Maltrato Animal',
    icon: 'shield-dog',
    color: '#dc2626',
  },
  {
    id: IncidentCategory.KIDNAPPING,
    label: 'Sequestro',
    icon: 'square-person-confined',
    color: '#991b1b',
  },
  { id: IncidentCategory.LOST_CHILD, label: 'Criança Perdida', icon: 'child', color: '#0369a1' },
  {
    id: IncidentCategory.CRASH_CAR,
    label: 'Acidente de Carro',
    icon: 'truck-field',
    color: '#8b5cf6',
  },
  {
    id: IncidentCategory.BLACKOUT,
    label: 'Queda de energia',
    icon: 'bolt-lightning',
    color: '#dc2626',
  },
  { id: IncidentCategory.NO_WATER, label: 'Falta de água', icon: 'faucet-drip', color: '#1d4ed8' },
  { id: IncidentCategory.TREE_FALL, label: 'Queda de Árvore', icon: 'tree', color: '#16a34a' },
  {
    id: IncidentCategory.INTERRUPTED_ROAD,
    label: 'Via interrompida',
    icon: 'road',
    color: '#8b5cf6',
  },
  {
    id: IncidentCategory.INVASION_PROPERTY,
    label: 'Invasão de Propriedade',
    icon: 'person-through-window',
    color: '#881337',
  },
];
