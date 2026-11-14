export type DifficultyId = 'easy' | 'medium' | 'hard';

export type OrbitType = 'LEO' | 'LTO_LLO' | 'L2_DEEP_SPACE';

export type SkillKey = 'matematico' | 'cientifico' | 'tecnologia' | 'calma';

export type ActiveSkillKey = 'matematico' | 'cientifico' | 'tecnologia';

export type HardwareCategory = 'chassis' | 'payload' | 'power' | 'comms' | 'rocket';

export type NasaMissionSegment = 'Space Segment' | 'Launch Segment' | 'Ground Segment';

export type AppView = 'select' | 'builder' | 'dispatch';

export type CMLLevel = 1 | 2 | 3 | 4;

export interface MissionScenario {
  id: DifficultyId;
  levelNumber: 1 | 2 | 3;
  difficultyLabel: 'FÁCIL' | 'MEDIO' | 'DIFÍCIL';
  title: string;
  subtitle: string;
  historicalContext: string;
  userSegmentObjective: string;
  orbit: OrbitType;
  orbitLabel: string;
  orbitAltitude: string;
  orbitLatency: string;
  initialBudgetM: number;
  durationSec: number;
  emergencyFrequencyLabel: string;
  baseEmergencyIntervalSec: number;
  maxConcurrentEmergencies: number;
  requiredMinCommsKbps: number;
  realMissionReference: {
    name: string;
    year: string;
    agency: string;
    orbit: string;
    massKg: number;
    powerW: number;
    costNote: string;
    summary: string;
    imageQuery: string;
    highlights: string[];
  };
  coverImage: string;
  nasaResourceTags: string[];
}

export interface CrewCandidate {
  id: string;
  name: string;
  callsign: string;
  roleTitle: string;
  primarySkill: SkillKey;
  tier: 1 | 2 | 3;
  tierLabel: 'Junior' | 'Senior' | 'Élite';
  costM: number;
  stats: Record<SkillKey, number>;
  bio: string;
  nasaReference: string;
  avatarUrl: string;
}

export interface CrewMemberState extends CrewCandidate {
  fatigue: number; // 0 to 100
  exhausted: boolean; // fatigue >= 80
  assignedTicketId: string | null;
  tasksCompleted: number;
}

export interface HardwareItem {
  id: string;
  name: string;
  category: HardwareCategory;
  nasaSegment: NasaMissionSegment;
  bonusScenarios?: DifficultyId[];
  costM: number;
  massKg: number;
  powerGenW: number;
  powerUseW: number;
  dataRateGB: number;
  commsKbps: number;
  storageCapGB: number;
  maxPayloadSlots: number;
  maxMassByOrbit?: Record<OrbitType, number>;
  reliability: number; // 0.60 - 0.98
  description: string;
  nasaResourceTag: string;
}

export interface SpacecraftConfig {
  chassisId: string | null;
  payloadIds: string[];
  powerId: string | null;
  commsId: string | null;
  rocketId: string | null;
}

export interface ComputedMissionMetrics {
  crewCount: number;
  crewCostM: number;
  hardwareCostM: number;
  totalCostM: number;
  budgetRemainingM: number;
  totalMassKg: number;
  rocketCapacityKg: number;
  powerGeneratedW: number;
  powerConsumedW: number;
  powerMarginW: number;
  dataRatePerMissionGB: number;
  storageCapGB: number;
  commsKbps: number;
  avgReliability: number;
  riskMultiplier: number;
  isCrewValid: boolean;
  isBudgetValid: boolean;
  isMassValid: boolean;
  isPowerValid: boolean;
  isCommsValid: boolean;
  isPayloadValid: boolean;
  isLaunchReady: boolean;
  validationErrors: string[];
}

export type FailureEffectType =
  | 'asteroid'
  | 'avionics'
  | 'eclipse_battery'
  | 'thermal_deploy'
  | 'solar_storm'
  | 'sunshield_deploy'
  | 'star_tracker'
  | 'propellant_leak';

export interface DispatchTicket {
  id: string;
  kind: 'objective' | 'emergency';
  title: string;
  description: string;
  requiredSkill: ActiveSkillKey;
  requiresHighCalm: boolean;
  workRequired: number;
  progress: number;
  ttl: number;
  maxTtl: number;
  assignedCrewId: string | null;
  orbitAngleDeg: number;
  orbitRadiusFactor: number;
  scienceReward: number;
  dataGeneratedGB: number;
  transmitsBuffer: boolean;
  failurePenaltyDescription: string;
  failureEffectType: FailureEffectType;
  realNasaSource?: string;
}

export interface SimulationLogEntry {
  id: string;
  timeSec: number;
  severity: 'info' | 'success' | 'warning' | 'critical';
  message: string;
}

export interface MissionRunResult {
  scenario: MissionScenario;
  metrics: ComputedMissionMetrics;
  crew: CrewMemberState[];
  config: SpacecraftConfig;
  objectivesCompleted: number;
  emergenciesResolved: number;
  emergenciesFailed: number;
  dataGeneratedTotalGB: number;
  dataTransmittedGB: number;
  dataDroppedOverflowGB: number;
  finalIntegrityPct: number;
  finalBatteryPct: number;
  finalPropellantPct: number;
  timeElapsedSec: number;
  peakCrewFatiguePct: number;
  exhaustedEventsCount: number;
  scoreFinal: number;
  cmlLevel: CMLLevel;
  cmlTitle: string;
  outcome: 'VICTORIA' | 'EXITO_PARCIAL' | 'DERROTA';
  logs: SimulationLogEntry[];
}

export interface NasaNeoAsteroid {
  id: string;
  name: string;
  isPotentiallyHazardous: boolean;
  estimatedDiameterMaxM: number;
  relativeVelocityKmS: number;
  missDistanceKm: number;
  closeApproachDate: string;
  kineticRiskScore: number;
}

export interface NasaSolarEvent {
  id: string;
  type: 'FLR' | 'GST';
  label: string;
  classOrKp: string;
  peakTime: string;
  severityFactor: number;
  sourceLocation: string;
}

export interface NasaImageAsset {
  nasaId: string;
  title: string;
  description: string;
  imageUrl: string;
  dateCreated: string;
  center: string;
}

export interface NasaApodData {
  title: string;
  date: string;
  explanation: string;
  url: string;
  mediaType: string;
}

export type EndpointStatus = 'LIVE_API' | 'CACHED_TELEMETRY' | 'LOADING';

export interface ProcessedNasaTelemetry {
  lastUpdatedIso: string;
  apiKeyUsed: string;
  overallStatus: EndpointStatus;
  endpoints: {
    neows: EndpointStatus;
    donki: EndpointStatus;
    images: EndpointStatus;
    apod: EndpointStatus;
  };
  asteroids: NasaNeoAsteroid[];
  solarEvents: NasaSolarEvent[];
  spaceWeatherRiskMultiplier: number; // e.g., 1.0 - 1.35
  spaceWeatherLevel: 'CALMO' | 'MODERADO' | 'TORMENTA SOLAR';
  missionArchives: Record<DifficultyId, NasaImageAsset[]>;
  apod: NasaApodData;
}

export interface NasaOfficialResource {
  id: number;
  name: string;
  category: string;
  roleInGame: string;
  details: string;
}
