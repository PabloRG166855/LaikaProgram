import { HARDWARE_CATALOG } from '../data/missionCatalog';
import {
  ActiveSkillKey,
  CMLLevel,
  ComputedMissionMetrics,
  CrewCandidate,
  CrewMemberState,
  DispatchTicket,
  HardwareItem,
  MissionRunResult,
  MissionScenario,
  ProcessedNasaTelemetry,
  SpacecraftConfig,
} from '../types/mission';

export function getHardwareById(id: string | null): HardwareItem | undefined {
  if (!id) return undefined;
  return HARDWARE_CATALOG.find((item) => item.id === id);
}

export function computeMissionMetrics(
  scenario: MissionScenario,
  selectedCrew: CrewCandidate[],
  config: SpacecraftConfig
): ComputedMissionMetrics {
  const chassis = getHardwareById(config.chassisId);
  const power = getHardwareById(config.powerId);
  const comms = getHardwareById(config.commsId);
  const rocket = getHardwareById(config.rocketId);
  const payloads = config.payloadIds
    .map((id) => getHardwareById(id))
    .filter((item): item is HardwareItem => Boolean(item));

  const crewCount = selectedCrew.length;
  const crewCostM = selectedCrew.reduce((sum, c) => sum + c.costM, 0);

  const hardwareItems = [chassis, power, comms, rocket, ...payloads].filter(
    (item): item is HardwareItem => Boolean(item)
  );
  const hardwareCostM = hardwareItems.reduce((sum, item) => sum + item.costM, 0);
  const totalCostM = crewCostM + hardwareCostM;
  const budgetRemainingM = scenario.initialBudgetM - totalCostM;

  const totalMassKg = [chassis, power, comms, ...payloads]
    .filter((item): item is HardwareItem => Boolean(item))
    .reduce((sum, item) => sum + item.massKg, 0);

  const rocketCapacityKg = rocket?.maxMassByOrbit?.[scenario.orbit] ?? 0;

  const powerGeneratedW = power?.powerGenW ?? 0;
  const powerConsumedW = [chassis, comms, ...payloads]
    .filter((item): item is HardwareItem => Boolean(item))
    .reduce((sum, item) => sum + item.powerUseW, 0);
  const powerMarginW = powerGeneratedW - powerConsumedW;

  const dataRatePerMissionGB = payloads.reduce((sum, p) => {
    const hasBonus = p.bonusScenarios?.includes(scenario.id);
    return sum + Math.round(p.dataRateGB * (hasBonus ? 1.25 : 1.0));
  }, 0);
  const storageCapGB = chassis?.storageCapGB ?? 0;
  const commsKbps = comms?.commsKbps ?? 0;

  const avgReliability =
    hardwareItems.length > 0
      ? hardwareItems.reduce((sum, i) => sum + i.reliability, 0) / hardwareItems.length
      : 0.7;

  // Higher reliability lowers emergency spawn pressure; lower reliability increases it.
  // Range ~0.78 (very reliable) to ~1.35 (cheap low-reliability build)
  const riskMultiplier = Number(Math.max(0.75, Math.min(1.4, 1.85 - avgReliability)).toFixed(2));

  const isCrewValid = crewCount === 4;
  const isBudgetValid = totalCostM <= scenario.initialBudgetM;
  const isMassValid = Boolean(rocket) && rocketCapacityKg > 0 && totalMassKg <= rocketCapacityKg;
  const isPowerValid = Boolean(power) && powerGeneratedW >= powerConsumedW && powerConsumedW > 0;
  const isCommsValid = Boolean(comms) && commsKbps >= scenario.requiredMinCommsKbps;
  const isPayloadValid =
    Boolean(chassis) &&
    payloads.length >= 1 &&
    payloads.length <= (chassis?.maxPayloadSlots ?? 0);

  const validationErrors: string[] = [];
  if (!isCrewValid) {
    validationErrors.push(`Faltan operadores del MDL Crew (${crewCount}/4 asientos ocupados).`);
  }
  if (!isBudgetValid) {
    validationErrors.push(
      `Presupuesto excedido por $${Math.abs(budgetRemainingM)}M USD (límite: $${scenario.initialBudgetM}M).`
    );
  }
  if (!chassis) {
    validationErrors.push('Selecciona un Chasis / Plataforma espacial.');
  }
  if (payloads.length === 0) {
    validationErrors.push('Instala al menos 1 Instrumento Científico (Payload).');
  } else if (chassis && payloads.length > chassis.maxPayloadSlots) {
    validationErrors.push(
      `Exceso de instrumentos: ${payloads.length}/${chassis.maxPayloadSlots} bahías disponibles.`
    );
  }
  if (!power) {
    validationErrors.push('Selecciona un subsistema de Energía (Paneles/RTG).');
  } else if (!isPowerValid) {
    validationErrors.push(
      `Déficit de energía: generas ${powerGeneratedW} W pero la nave consume ${powerConsumedW} W.`
    );
  }
  if (!comms) {
    validationErrors.push('Selecciona una antena de Comunicaciones.');
  } else if (!isCommsValid) {
    validationErrors.push(
      `Antena insuficiente para ${scenario.orbit}: mínimo ${scenario.requiredMinCommsKbps} kbps (actual: ${commsKbps} kbps).`
    );
  }
  if (!rocket) {
    validationErrors.push('Selecciona un Vehículo de Lanzamiento (Cohete).');
  } else if (rocketCapacityKg <= 0) {
    validationErrors.push(
      `El cohete ${rocket.name} no alcanza la órbita ${scenario.orbit}.`
    );
  } else if (!isMassValid) {
    validationErrors.push(
      `Sobrepeso orbital: ${totalMassKg} kg supera la capacidad del cohete (${rocketCapacityKg} kg).`
    );
  }

  const isLaunchReady =
    isCrewValid &&
    isBudgetValid &&
    isMassValid &&
    isPowerValid &&
    isCommsValid &&
    isPayloadValid;

  return {
    crewCount,
    crewCostM,
    hardwareCostM,
    totalCostM,
    budgetRemainingM,
    totalMassKg,
    rocketCapacityKg,
    powerGeneratedW,
    powerConsumedW,
    powerMarginW,
    dataRatePerMissionGB,
    storageCapGB,
    commsKbps,
    avgReliability,
    riskMultiplier,
    isCrewValid,
    isBudgetValid,
    isMassValid,
    isPowerValid,
    isCommsValid,
    isPayloadValid,
    isLaunchReady,
    validationErrors,
  };
}

/**
 * Exact formula from Section 6.2:
 * ProgresoPorSegundo = 10 * (1 + ValorCualidad(S_req)/50) * BonoEspecialidad * PenalizacionFatiga
 * BonoEspecialidad = 1.25 si S_req es la cualidad principal del operador (1.0 en otro caso).
 */
export function calculateProgressPerSecond(
  member: CrewMemberState,
  requiredSkill: ActiveSkillKey
): number {
  const base = 10;
  const skillVal = member.stats[requiredSkill];
  const specialtyBonus = member.primarySkill === requiredSkill ? 1.25 : 1.0;
  const fatiguePenalty = member.fatigue >= 80 ? 0.4 : 1.0;
  return base * (1 + skillVal / 50) * specialtyBonus * fatiguePenalty;
}

/**
 * Exact formula from Section 6.3:
 * Active: + (120 / Calma) per second (multiplied by 1.65x for high-stress double-skill events)
 * Resting: - (3 + Calma / 25) per second
 */
export function calculateFatigueDeltaPerSecond(
  member: CrewMemberState,
  isHighStressTicket: boolean
): number {
  if (member.assignedTicketId) {
    const stressMultiplier = isHighStressTicket ? 1.65 : 1.0;
    return (120 / Math.max(20, member.stats.calma)) * stressMultiplier;
  }
  return -(3 + member.stats.calma / 25);
}

/**
 * Exact formula from Section 6.4:
 * ScoreFinal = (MisionesObjetivoCompletadas * 250) + (DatosTransmitidosGB * 10) + (IntegridadNave% * 5) - (EmergenciasFalladas * 150)
 */
export function calculateFinalScoreAndCML(params: {
  objectivesCompleted: number;
  dataTransmittedGB: number;
  finalIntegrityPct: number;
  emergenciesFailed: number;
}): {
  scoreFinal: number;
  cmlLevel: CMLLevel;
  cmlTitle: string;
  outcome: 'VICTORIA' | 'EXITO_PARCIAL' | 'DERROTA';
} {
  const rawScore =
    params.objectivesCompleted * 250 +
    Math.round(params.dataTransmittedGB) * 10 +
    Math.round(params.finalIntegrityPct) * 5 -
    params.emergenciesFailed * 150;
  const scoreFinal = Math.max(0, rawScore);

  if (params.finalIntegrityPct <= 0 || scoreFinal < 400) {
    return {
      scoreFinal,
      cmlLevel: 1,
      cmlTitle: 'CML 1 — Initial Concept (Falla de Misión)',
      outcome: 'DERROTA',
    };
  }
  if (scoreFinal >= 1500 && params.finalIntegrityPct > 70) {
    return {
      scoreFinal,
      cmlLevel: 4,
      cmlTitle: 'CML 4 — Point Design (Excelencia Operativa)',
      outcome: 'VICTORIA',
    };
  }
  if (scoreFinal >= 900) {
    return {
      scoreFinal,
      cmlLevel: 3,
      cmlTitle: 'CML 3 — Trade Study Validated (Éxito de Misión)',
      outcome: 'VICTORIA',
    };
  }
  return {
    scoreFinal,
    cmlLevel: 2,
    cmlTitle: 'CML 2 — Concept Feasibility (Éxito Parcial)',
    outcome: 'EXITO_PARCIAL',
  };
}

let ticketSeq = 1;

export function createObjectiveTicket(
  scenario: MissionScenario,
  metrics: ComputedMissionMetrics,
  currentBufferPct: number
): DispatchTicket {
  const id = `obj-${Date.now()}-${ticketSeq++}`;
  const angle = Math.floor(Math.random() * 340) + 10;
  const radiusFactor = 0.72 + Math.random() * 0.24;

  // If buffer is filling up (> 45%), bias towards DSN transmission windows
  const shouldBeDsn = currentBufferPct > 45 && Math.random() < 0.52;

  if (shouldBeDsn) {
    return {
      id,
      kind: 'objective',
      title: 'Ventana de Transmisión DSN',
      description:
        'Alinea la antena hacia las estaciones terrestres del Deep Space Network para vaciar el buffer científico a Tierra.',
      requiredSkill: 'tecnologia',
      requiresHighCalm: false,
      workRequired: 170,
      progress: 0,
      ttl: 34,
      maxTtl: 34,
      assignedCrewId: null,
      orbitAngleDeg: angle,
      orbitRadiusFactor: radiusFactor,
      scienceReward: 120,
      dataGeneratedGB: 0,
      transmitsBuffer: true,
      failurePenaltyDescription: 'Se pierde la ventana de contacto orbital (datos permanecen en buffer).',
      failureEffectType: 'avionics',
    };
  }

  const templates: Array<{
    title: string;
    description: string;
    skill: ActiveSkillKey;
    work: number;
    ttl: number;
    dataMult: number;
    transmits: boolean;
    reward: number;
  }> = [
    {
      title:
        scenario.id === 'easy'
          ? 'Barrido Cinturón Van Allen'
          : scenario.id === 'medium'
          ? 'Cartografía Cráteres LLO'
          : 'Espectroscopía Profunda L2',
      description:
        'Calibra los sensores de carga útil sobre el objetivo principal para registrar datos científicos de alto valor.',
      skill: 'cientifico',
      work: 195,
      ttl: 36,
      dataMult: 1.0,
      transmits: false,
      reward: 250,
    },
    {
      title: 'Ajuste de Perigeo / Maniobra GMAT',
      description:
        'Ejecuta un encendido GMAT de corrección orbital para optimizar el ángulo de observación y ahorrar propelente.',
      skill: 'matematico',
      work: 180,
      ttl: 34,
      dataMult: 0.75,
      transmits: false,
      reward: 250,
    },
    {
      title: 'Calibración & Downlink Telemetría',
      description:
        'Sincroniza el bus de aviónica y transmite un paquete científico prioritario hacia el segmento terreno.',
      skill: 'tecnologia',
      work: 175,
      ttl: 34,
      dataMult: 0.55,
      transmits: true,
      reward: 250,
    },
    {
      title: 'Calibración de Magnetómetro Orbital',
      description:
        'Alinea los sensores magnéticos con el vector solar para capturar fluctuaciones de plasma espacial.',
      skill: 'cientifico',
      work: 185,
      ttl: 35,
      dataMult: 0.9,
      transmits: false,
      reward: 250,
    },
    {
      title: 'Interferometría & Triangulación Orbital',
      description:
        'Calcula efemérides de alta precisión entre la nave y las estaciones terrestres para mejorar la puntería.',
      skill: 'matematico',
      work: 190,
      ttl: 35,
      dataMult: 0.8,
      transmits: false,
      reward: 250,
    },
    {
      title: 'Ventana de Transmisión al Deep Space Network',
      description:
        'Establece enlace de alta ganancia con las antenas DSN para vaciar el buffer acumulado antes de saturación.',
      skill: 'tecnologia',
      work: 170,
      ttl: 34,
      dataMult: 0.25,
      transmits: true,
      reward: 250,
    },
  ];

  const chosen = templates[Math.floor(Math.random() * templates.length)];
  const dataGeneratedGB = Math.max(8, Math.round(metrics.dataRatePerMissionGB * chosen.dataMult));

  return {
    id,
    kind: 'objective',
    title: chosen.title,
    description: chosen.description,
    requiredSkill: chosen.skill,
    requiresHighCalm: false,
    workRequired: chosen.work,
    progress: 0,
    ttl: chosen.ttl,
    maxTtl: chosen.ttl,
    assignedCrewId: null,
    orbitAngleDeg: angle,
    orbitRadiusFactor: radiusFactor,
    scienceReward: chosen.reward,
    dataGeneratedGB,
    transmitsBuffer: chosen.transmits,
    failurePenaltyDescription: 'Ventana científica perdida sin daño físico.',
    failureEffectType: 'avionics',
  };
}

export function createEmergencyTicket(
  scenario: MissionScenario,
  nasaTelemetry: ProcessedNasaTelemetry
): DispatchTicket {
  const id = `emg-${Date.now()}-${ticketSeq++}`;
  const angle = Math.floor(Math.random() * 340) + 10;
  const radiusFactor = 0.68 + Math.random() * 0.26;
  const ttlScale = scenario.id === 'easy' ? 1.25 : scenario.id === 'medium' ? 1.05 : 0.9;

  // Pick a real asteroid from NeoWs if available
  const asteroid =
    nasaTelemetry.asteroids.length > 0
      ? nasaTelemetry.asteroids[Math.floor(Math.random() * nasaTelemetry.asteroids.length)]
      : null;

  // Pick a real solar event from DONKI if available
  const solarEvent =
    nasaTelemetry.solarEvents.length > 0
      ? nasaTelemetry.solarEvents[Math.floor(Math.random() * nasaTelemetry.solarEvents.length)]
      : null;

  const emergencyPool: Array<Omit<DispatchTicket, 'id' | 'orbitAngleDeg' | 'orbitRadiusFactor' | 'progress' | 'assignedCrewId'>> = [
    {
      kind: 'emergency',
      title: asteroid
        ? `Asteroide ${asteroid.name} en Trayectoria`
        : 'Micrometeoroide en Trayectoria',
      description: asteroid
        ? `Objeto NeoWs detectado a ${asteroid.relativeVelocityKmS.toFixed(1)} km/s (Ø ~${Math.round(asteroid.estimatedDiameterMaxM)} m). Calcula vector de evasión inmediato.`
        : 'Escombros orbitales en ruta de colisión. Calcula una maniobra de evasión orbital.',
      requiredSkill: 'matematico',
      requiresHighCalm: false,
      workRequired: 190,
      ttl: Math.round(24 * ttlScale),
      maxTtl: Math.round(24 * ttlScale),
      scienceReward: 0,
      dataGeneratedGB: 0,
      transmitsBuffer: false,
      failurePenaltyDescription: '-25% Integridad del casco y pérdida de propelente.',
      failureEffectType: 'asteroid',
      realNasaSource: asteroid ? `NASA NeoWs ID ${asteroid.id}` : 'NASA NeoWs Fallback',
    },
    {
      kind: 'emergency',
      title:
        scenario.id === 'medium'
          ? 'Sobrecarga Computadora 1202 / Aviónica'
          : 'Alarma de Aviónica & Bus de Datos',
      description:
        'Desbordamiento de tareas en el computador de vuelo amenaza la memoria científica y el enlace de comunicaciones.',
      requiredSkill: 'tecnologia',
      requiresHighCalm: false,
      workRequired: 185,
      ttl: Math.round(23 * ttlScale),
      maxTtl: Math.round(23 * ttlScale),
      scienceReward: 0,
      dataGeneratedGB: 0,
      transmitsBuffer: false,
      failurePenaltyDescription: 'Corrupción de memoria (-45% buffer) y caída de Comms 8s.',
      failureEffectType: 'avionics',
    },
    {
      kind: 'emergency',
      title: 'Cambio de Banco de Batería (Eclipse)',
      description:
        'Entrada en cono de sombra exige conmutar bancos de energía sin perder estabilidad bajo estrés.',
      requiredSkill: 'tecnologia',
      requiresHighCalm: true,
      workRequired: 205,
      ttl: Math.round(25 * ttlScale),
      maxTtl: Math.round(25 * ttlScale),
      scienceReward: 0,
      dataGeneratedGB: 0,
      transmitsBuffer: false,
      failurePenaltyDescription: 'Apagón total (Power 0%) congelando misiones durante 10 segundos.',
      failureEffectType: 'eclipse_battery',
    },
    {
      kind: 'emergency',
      title: 'Sobrecalentamiento Térmico / Despliegue',
      description:
        'Actuador del radiador o panel bloqueado eleva la temperatura del chasis sobre el umbral crítico.',
      requiredSkill: 'tecnologia',
      requiresHighCalm: false,
      workRequired: 180,
      ttl: Math.round(24 * ttlScale),
      maxTtl: Math.round(24 * ttlScale),
      scienceReward: 0,
      dataGeneratedGB: 0,
      transmitsBuffer: false,
      failurePenaltyDescription: '-15% Integridad térmica y freno temporal a captura de datos.',
      failureEffectType: 'thermal_deploy',
    },
    {
      kind: 'emergency',
      title: solarEvent
        ? `Tormenta Solar DONKI (${solarEvent.classOrKp})`
        : 'Tormenta de Radiación Solar',
      description: solarEvent
        ? `Evento ${solarEvent.label} (${solarEvent.classOrKp}) impactando sensores y provocando estrés masivo en consola.`
        : 'Eyección solar altera los sensores ópticos e induce fatiga acelerada en los operadores.',
      requiredSkill: 'cientifico',
      requiresHighCalm: true,
      workRequired: 200,
      ttl: Math.round(25 * ttlScale),
      maxTtl: Math.round(25 * ttlScale),
      scienceReward: 0,
      dataGeneratedGB: 0,
      transmitsBuffer: false,
      failurePenaltyDescription: '-12% Integridad, pérdida de datos y +22% fatiga a todo el Crew.',
      failureEffectType: 'solar_storm',
      realNasaSource: solarEvent ? `NASA DONKI ${solarEvent.type}` : 'NASA DONKI Space Weather',
    },
    {
      kind: 'emergency',
      title: 'Despliegue de Escudo Solar Atascado',
      description:
        'Un tensor del parasol o panel auxiliar quedó bloqueado tras la inserción orbital. Requiere secuencia de comandos de ingeniería.',
      requiredSkill: 'tecnologia',
      requiresHighCalm: false,
      workRequired: 185,
      ttl: Math.round(24 * ttlScale),
      maxTtl: Math.round(24 * ttlScale),
      scienceReward: 0,
      dataGeneratedGB: 0,
      transmitsBuffer: false,
      failurePenaltyDescription: '-14% Integridad estructural y -15% de eficiencia térmica.',
      failureEffectType: 'sunshield_deploy',
    },
    {
      kind: 'emergency',
      title: 'Pérdida de Estrella Guía (Star Tracker)',
      description:
        'El sensor estelar perdió referencia de actitud; recalcula el cuaternión de apuntamiento antes de perder la orientación.',
      requiredSkill: 'matematico',
      requiresHighCalm: true,
      workRequired: 190,
      ttl: Math.round(24 * ttlScale),
      maxTtl: Math.round(24 * ttlScale),
      scienceReward: 0,
      dataGeneratedGB: 0,
      transmitsBuffer: false,
      failurePenaltyDescription: 'Desorientación: caída de Comms 8s y -12% Propelente en corrección.',
      failureEffectType: 'star_tracker',
    },
    {
      kind: 'emergency',
      title: 'Fuga en Línea de Propelente Orbital',
      description:
        'Caída anómala de presión en los propulsores de control de actitud. Aísla la válvula y compensa el empuje.',
      requiredSkill: 'matematico',
      requiresHighCalm: false,
      workRequired: 185,
      ttl: Math.round(23 * ttlScale),
      maxTtl: Math.round(23 * ttlScale),
      scienceReward: 0,
      dataGeneratedGB: 0,
      transmitsBuffer: false,
      failurePenaltyDescription: '-25% Propelente operativo y -10% Integridad del módulo.',
      failureEffectType: 'propellant_leak',
    },
  ];

  const picked = emergencyPool[Math.floor(Math.random() * emergencyPool.length)];
  return {
    ...picked,
    id,
    progress: 0,
    assignedCrewId: null,
    orbitAngleDeg: angle,
    orbitRadiusFactor: radiusFactor,
  };
}

export interface DiagnosisInsight {
  title: string;
  detail: string;
  status: 'positive' | 'warning' | 'critical';
}

export function generateCauseAndEffectDiagnosis(result: MissionRunResult): {
  headline: string;
  crewInsights: DiagnosisInsight[];
  systemInsights: DiagnosisInsight[];
} {
  const {
    metrics,
    scenario,
    crew,
    emergenciesFailed,
    objectivesCompleted,
    dataDroppedOverflowGB,
    exhaustedEventsCount,
    finalPropellantPct,
  } = result;

  const crewSharePct = Math.round((metrics.crewCostM / Math.max(1, metrics.totalCostM)) * 100);
  const hwSharePct = 100 - crewSharePct;

  const crewInsights: DiagnosisInsight[] = [];
  const systemInsights: DiagnosisInsight[] = [];

  // CREW INSIGHT 1: Fatigue & Calma
  const avgCalm = Math.round(crew.reduce((s, c) => s + c.stats.calma, 0) / Math.max(1, crew.length));
  if (exhaustedEventsCount > 0 || result.peakCrewFatiguePct >= 80) {
    crewInsights.push({
      title: `Estrés Operativo y Fatiga (Calma media: ${avgCalm})`,
      detail: `El equipo alcanzó estado Exhausted (≥80% fatiga, 40% de velocidad) en ${exhaustedEventsCount} ocasión(es). Rotar descansos o contratar mayor Calma mejora la resistencia en crisis simultáneas.`,
      status: 'warning',
    });
  } else {
    crewInsights.push({
      title: `Resiliencia de Consola Controlada (Calma media: ${avgCalm})`,
      detail: 'Ningún operador colapsó por agotamiento, manteniendo el 100% de eficiencia de respuesta durante toda la ventana operativa.',
      status: 'positive',
    });
  }

  // CREW INSIGHT 2: Tasks resolved & specialty synergy
  const totalTasks = crew.reduce((s, c) => s + c.tasksCompleted, 0);
  const topOperator = [...crew].sort((a, b) => b.tasksCompleted - a.tasksCompleted)[0];
  crewInsights.push({
    title: `Productividad del Equipo (${totalTasks} tickets resueltos)`,
    detail: topOperator
      ? `El operador más activo fue ${topOperator.callsign} (${topOperator.name}) con ${topOperator.tasksCompleted} ticket(s) completados aprovechando su bono de especialidad (+25%).`
      : 'No se completaron asignaciones en consola durante la ventana.',
    status: totalTasks > 0 ? 'positive' : 'warning',
  });

  // CREW INSIGHT 3: Emergencies response
  if (emergenciesFailed > 0 || result.finalIntegrityPct <= 50) {
    crewInsights.push({
      title: `Respuesta ante Emergencias (${emergenciesFailed} fallada(s))`,
      detail: `Las crisis que expiraron redujeron la integridad final a ${Math.round(result.finalIntegrityPct)}% y restaron ${emergenciesFailed * 150} pts del puntaje CML.`,
      status: 'critical',
    });
  } else {
    crewInsights.push({
      title: `Supervivencia Orbital Impecable (${Math.round(result.finalIntegrityPct)}% Integridad)`,
      detail: `El Crew mitigó todas las emergencias a tiempo mientras completaba ${objectivesCompleted} misiones objetivo.`,
      status: 'positive',
    });
  }

  // SYSTEM INSIGHT 1: Budget Crew vs Hardware
  if (crewSharePct > 52) {
    systemInsights.push({
      title: `Estrategia "Crew-Heavy" (${crewSharePct}% Nómina / ${hwSharePct}% Hardware)`,
      detail: `Invertiste fuertemente en especialistas de alto rango. Esto aceleró la resolución de tickets, pero redujo el margen para hardware más confiable (factor de riesgo: ${metrics.riskMultiplier}x).`,
      status: metrics.avgReliability < 0.8 ? 'warning' : 'positive',
    });
  } else if (hwSharePct > 68) {
    systemInsights.push({
      title: `Estrategia "Hardware-Heavy" (${hwSharePct}% Hardware / ${crewSharePct}% Crew)`,
      detail:
        'Priorizaste una plataforma robusta y confiable, reduciendo fallos espontáneos, pero dependiste de operadores Junior con menor resistencia al estrés.',
      status: exhaustedEventsCount > 1 ? 'warning' : 'positive',
    });
  } else {
    systemInsights.push({
      title: `Balance Óptimo Crew vs. Hardware (${crewSharePct}% / ${hwSharePct}%)`,
      detail: `Distribuiste los $${scenario.initialBudgetM}M USD de forma equilibrada entre capacidad humana y subsistemas espaciales.`,
      status: 'positive',
    });
  }

  // SYSTEM INSIGHT 2: Comms & Data Buffer
  if (dataDroppedOverflowGB > 5) {
    systemInsights.push({
      title: `Cuello de Botella en Comunicaciones (${metrics.commsKbps} kbps)`,
      detail: `Se perdieron ${Math.round(dataDroppedOverflowGB)} GB de ciencia por saturación del buffer (${metrics.storageCapGB} GB). Una antena superior o priorizar ventanas DSN habría asegurado esos puntos.`,
      status: 'warning',
    });
  } else {
    systemInsights.push({
      title: `Flujo de Telemetría Sostenible (${Math.round(result.dataTransmittedGB)} GB transmitidos)`,
      detail: `Tu ancho de banda de ${metrics.commsKbps} kbps mantuvo el buffer bajo control, convirtiendo los datos científicos en puntaje CML asegurado.`,
      status: 'positive',
    });
  }

  // SYSTEM INSIGHT 3: Mass, Propellant & Power Margin
  systemInsights.push({
    title: `Margen de Masa, Propelente (${Math.round(finalPropellantPct)}%) y Potencia (+${metrics.powerMarginW} W)`,
    detail: `La nave despegó con ${metrics.totalMassKg}/${metrics.rocketCapacityKg} kg de capacidad orbital y un margen eléctrico de ${metrics.powerMarginW} W en ${scenario.orbit}.`,
    status: finalPropellantPct < 45 ? 'warning' : 'positive',
  });

  const headline =
    result.cmlLevel === 4
      ? 'Diseño de Punto Óptimo: la sinergia entre hardware y MDL Crew maximizó el retorno científico.'
      : result.cmlLevel === 3
      ? 'Misión Validada: el diseño superó las exigencias orbitales con márgenes operativos sólidos.'
      : result.cmlLevel === 2
      ? 'Factibilidad Parcial: la nave sobrevivió, pero los cuellos de botella limitaron la ciencia final.'
      : 'Falla Crítica de Misión: la combinación de riesgo de hardware, saturación o emergencias impidió completar los objetivos.';

  return { headline, crewInsights, systemInsights };
}
