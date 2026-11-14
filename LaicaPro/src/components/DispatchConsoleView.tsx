import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Flame,
  Fuel,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Shield,
  Sparkles,
  UserCheck,
  ZapOff,
} from 'lucide-react';
import {
  calculateFatigueDeltaPerSecond,
  calculateFinalScoreAndCML,
  calculateProgressPerSecond,
  createEmergencyTicket,
  createObjectiveTicket,
} from '../services/missionEngine';
import {
  ActiveSkillKey,
  ComputedMissionMetrics,
  CrewCandidate,
  CrewMemberState,
  DispatchTicket,
  MissionRunResult,
  MissionScenario,
  ProcessedNasaTelemetry,
  SimulationLogEntry,
  SpacecraftConfig,
} from '../types/mission';

interface DispatchConsoleViewProps {
  scenario: MissionScenario;
  initialCrew: CrewCandidate[];
  config: SpacecraftConfig;
  metrics: ComputedMissionMetrics;
  nasaTelemetry: ProcessedNasaTelemetry;
  onMissionComplete: (result: MissionRunResult) => void;
  onAbortToBuilder: () => void;
}

interface SimState {
  timeRemainingSec: number;
  elapsedSec: number;
  integrityPct: number;
  batteryPct: number;
  propellantPct: number;
  powerBlackoutSec: number;
  commsOutageSec: number;
  thermalThrottleSec: number;
  bufferUsedGB: number;
  dataGeneratedTotalGB: number;
  dataTransmittedGB: number;
  dataDroppedOverflowGB: number;
  objectivesCompleted: number;
  emergenciesResolved: number;
  emergenciesFailed: number;
  peakCrewFatiguePct: number;
  exhaustedEventsCount: number;
  shipAngleDeg: number;
  tickets: DispatchTicket[];
  crew: CrewMemberState[];
  logs: SimulationLogEntry[];
  nextObjectiveInSec: number;
  nextEmergencyInSec: number;
  finished: boolean;
}

const SKILL_BADGE: Record<ActiveSkillKey, { label: string; color: string }> = {
  matematico: { label: 'Matemático', color: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300' },
  cientifico: {
    label: 'Científico',
    color: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  },
  tecnologia: {
    label: 'Tecnología',
    color: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
  },
};

function createInitialSimState(
  scenario: MissionScenario,
  initialCrew: CrewCandidate[],
  metrics: ComputedMissionMetrics
): SimState {
  const crewStates: CrewMemberState[] = initialCrew.map((c) => ({
    ...c,
    fatigue: 0,
    exhausted: false,
    assignedTicketId: null,
    tasksCompleted: 0,
  }));

  const firstObj = createObjectiveTicket(scenario, metrics, 0);
  firstObj.orbitAngleDeg = 42;

  return {
    timeRemainingSec: scenario.durationSec,
    elapsedSec: 0,
    integrityPct: 100,
    batteryPct: 100,
    propellantPct: 100,
    powerBlackoutSec: 0,
    commsOutageSec: 0,
    thermalThrottleSec: 0,
    bufferUsedGB: 0,
    dataGeneratedTotalGB: 0,
    dataTransmittedGB: 0,
    dataDroppedOverflowGB: 0,
    objectivesCompleted: 0,
    emergenciesResolved: 0,
    emergenciesFailed: 0,
    peakCrewFatiguePct: 0,
    exhaustedEventsCount: 0,
    shipAngleDeg: 0,
    tickets: [firstObj],
    crew: crewStates,
    logs: [
      {
        id: 'log-start',
        timeSec: 0,
        severity: 'info',
        message: `Inserción orbital en ${scenario.orbit} confirmada. Consola MDL activa con ${crewStates.length} operadores.`,
      },
    ],
    nextObjectiveInSec: 9,
    nextEmergencyInSec: Math.round(scenario.baseEmergencyIntervalSec * 0.65),
    finished: false,
  };
}

export const DispatchConsoleView: React.FC<DispatchConsoleViewProps> = ({
  scenario,
  initialCrew,
  config,
  metrics,
  nasaTelemetry,
  onMissionComplete,
  onAbortToBuilder,
}) => {
  const simRef = useRef<SimState>(createInitialSimState(scenario, initialCrew, metrics));
  const [snapshot, setSnapshot] = useState<SimState>(() => ({ ...simRef.current }));
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    () => simRef.current.tickets[0]?.id ?? null
  );
  const [speed, setSpeed] = useState<0 | 1 | 2>(1);
  const logSeqRef = useRef(1);

  const pushLog = (
    sim: SimState,
    severity: SimulationLogEntry['severity'],
    message: string
  ) => {
    sim.logs = [
      {
        id: `log-${logSeqRef.current++}`,
        timeSec: Math.round(sim.elapsedSec),
        severity,
        message,
      },
      ...sim.logs,
    ].slice(0, 28);
  };

  const buildRunResult = (sim: SimState): MissionRunResult => {
    const evalCml = calculateFinalScoreAndCML({
      objectivesCompleted: sim.objectivesCompleted,
      dataTransmittedGB: sim.dataTransmittedGB,
      finalIntegrityPct: sim.integrityPct,
      emergenciesFailed: sim.emergenciesFailed,
    });
    return {
      scenario,
      metrics,
      crew: sim.crew.map((c) => ({ ...c })),
      config,
      objectivesCompleted: sim.objectivesCompleted,
      emergenciesResolved: sim.emergenciesResolved,
      emergenciesFailed: sim.emergenciesFailed,
      dataGeneratedTotalGB: sim.dataGeneratedTotalGB,
      dataTransmittedGB: sim.dataTransmittedGB,
      dataDroppedOverflowGB: sim.dataDroppedOverflowGB,
      finalIntegrityPct: sim.integrityPct,
      finalBatteryPct: sim.batteryPct,
      finalPropellantPct: sim.propellantPct,
      timeElapsedSec: sim.elapsedSec,
      peakCrewFatiguePct: sim.peakCrewFatiguePct,
      exhaustedEventsCount: sim.exhaustedEventsCount,
      ...evalCml,
      logs: [...sim.logs],
    };
  };

  useEffect(() => {
    if (speed === 0) return;

    const timer = window.setInterval(() => {
      const sim = simRef.current;
      if (sim.finished) return;

      const dt = 0.1 * speed;
      sim.elapsedSec += dt;
      sim.timeRemainingSec = Math.max(0, sim.timeRemainingSec - dt);
      const orbitSpeed = scenario.id === 'easy' ? 18 : scenario.id === 'medium' ? 12 : 8;
      sim.shipAngleDeg = (sim.shipAngleDeg + dt * orbitSpeed) % 360;

      // Outage countdowns
      if (sim.powerBlackoutSec > 0) {
        sim.powerBlackoutSec = Math.max(0, sim.powerBlackoutSec - dt);
        sim.batteryPct = 0;
      } else {
        sim.batteryPct = Math.min(100, sim.batteryPct + dt * (2.5 + metrics.powerMarginW / 55));
      }
      if (sim.commsOutageSec > 0) {
        sim.commsOutageSec = Math.max(0, sim.commsOutageSec - dt);
      }
      if (sim.thermalThrottleSec > 0) {
        sim.thermalThrottleSec = Math.max(0, sim.thermalThrottleSec - dt);
      }

      // Passive Comms Downlink (GB/s scaled to bandwidth)
      if (sim.commsOutageSec <= 0 && sim.powerBlackoutSec <= 0 && sim.bufferUsedGB > 0) {
        const passiveRateGbSec = metrics.commsKbps / 320;
        const tx = Math.min(sim.bufferUsedGB, passiveRateGbSec * dt);
        sim.bufferUsedGB -= tx;
        sim.dataTransmittedGB += tx;
      }

      // 1. Update Crew Fatigue (Section 6.3)
      for (const member of sim.crew) {
        const assignedTicket = member.assignedTicketId
          ? sim.tickets.find((t) => t.id === member.assignedTicketId)
          : undefined;

        const prevExhausted = member.fatigue >= 80;
        const deltaPerSec = calculateFatigueDeltaPerSecond(
          member,
          Boolean(assignedTicket?.requiresHighCalm)
        );
        member.fatigue = Math.max(0, Math.min(100, member.fatigue + deltaPerSec * dt));
        member.exhausted = member.fatigue >= 80;
        sim.peakCrewFatiguePct = Math.max(sim.peakCrewFatiguePct, member.fatigue);

        if (!prevExhausted && member.exhausted) {
          sim.exhaustedEventsCount += 1;
          pushLog(
            sim,
            'warning',
            `${member.callsign} alcanzó fatiga crítica (≥80% EXHAUSTED): eficiencia reducida al 40%.`
          );
        }
      }

      // 2. Update Ticket Progress & TTL (Section 6.2)
      const completedIds = new Set<string>();
      const expiredIds = new Set<string>();

      for (const ticket of sim.tickets) {
        ticket.ttl = Math.max(0, ticket.ttl - dt);

        if (ticket.assignedCrewId) {
          const worker = sim.crew.find((c) => c.id === ticket.assignedCrewId);
          const frozenByBlackout = ticket.kind === 'objective' && sim.powerBlackoutSec > 0;
          if (worker && !frozenByBlackout) {
            const pps = calculateProgressPerSecond(worker, ticket.requiredSkill);
            ticket.progress = Math.min(ticket.workRequired, ticket.progress + pps * dt);
          }
        }

        if (ticket.progress >= ticket.workRequired) {
          completedIds.add(ticket.id);
        } else if (ticket.ttl <= 0) {
          expiredIds.add(ticket.id);
        }
      }

      // Process completed tickets
      if (completedIds.size > 0) {
        for (const ticket of sim.tickets) {
          if (!completedIds.has(ticket.id)) continue;

          if (ticket.assignedCrewId) {
            const worker = sim.crew.find((c) => c.id === ticket.assignedCrewId);
            if (worker) {
              if (ticket.requiredSkill === 'matematico') {
                const fuelSpent = Math.max(1, Number((5 - worker.stats.matematico / 25).toFixed(1)));
                sim.propellantPct = Math.max(0, sim.propellantPct - fuelSpent);
              }
              worker.assignedTicketId = null;
              worker.tasksCompleted += 1;
            }
          }

          if (ticket.kind === 'objective') {
            sim.objectivesCompleted += 1;
            let generated = ticket.dataGeneratedGB;
            if (sim.thermalThrottleSec > 0 && generated > 0) {
              generated = Math.round(generated * 0.5);
            }
            if (generated > 0) {
              sim.dataGeneratedTotalGB += generated;
              const availableBuffer = Math.max(0, metrics.storageCapGB - sim.bufferUsedGB);
              const stored = Math.min(availableBuffer, generated);
              const dropped = generated - stored;
              sim.bufferUsedGB += stored;
              if (dropped > 0) {
                sim.dataDroppedOverflowGB += dropped;
                pushLog(
                  sim,
                  'warning',
                  `Buffer saturado (${metrics.storageCapGB} GB): se perdieron ${Math.round(dropped)} GB de ${ticket.title}.`
                );
              }
            }

            if (ticket.transmitsBuffer && sim.commsOutageSec <= 0) {
              const burstAmount = Math.min(
                sim.bufferUsedGB,
                Math.max(25, metrics.storageCapGB * 0.5)
              );
              sim.bufferUsedGB -= burstAmount;
              sim.dataTransmittedGB += burstAmount;
              pushLog(
                sim,
                'success',
                `${ticket.title} completada: ${Math.round(burstAmount)} GB transmitidos al DSN.`
              );
            } else {
              pushLog(
                sim,
                'success',
                `Objetivo cumplido: ${ticket.title} (+250 pts · +${generated} GB).`
              );
            }
          } else {
            sim.emergenciesResolved += 1;
            pushLog(sim, 'success', `Crisis mitigada: ${ticket.title}.`);
          }
        }
      }

      // Process expired tickets
      if (expiredIds.size > 0) {
        for (const ticket of sim.tickets) {
          if (!expiredIds.has(ticket.id)) continue;

          if (ticket.assignedCrewId) {
            const worker = sim.crew.find((c) => c.id === ticket.assignedCrewId);
            if (worker) worker.assignedTicketId = null;
          }

          if (ticket.kind === 'emergency') {
            sim.emergenciesFailed += 1;
            switch (ticket.failureEffectType) {
              case 'asteroid':
                sim.integrityPct = Math.max(0, sim.integrityPct - 25);
                sim.propellantPct = Math.max(0, sim.propellantPct - 20);
                pushLog(
                  sim,
                  'critical',
                  `IMPACTO (${ticket.title}): -25% Integridad del casco y -20% Propelente (-150 pts).`
                );
                break;
              case 'avionics':
                sim.bufferUsedGB = sim.bufferUsedGB * 0.55;
                sim.commsOutageSec = 8;
                pushLog(
                  sim,
                  'critical',
                  `FALLO AVIÓNICA (${ticket.title}): -45% buffer y Comms caídas 8s.`
                );
                break;
              case 'eclipse_battery':
                sim.powerBlackoutSec = 10;
                sim.batteryPct = 0;
                pushLog(
                  sim,
                  'critical',
                  `APAGÓN EN ECLIPSE (${ticket.title}): Power 0%, objetivos congelados 10s.`
                );
                break;
              case 'thermal_deploy':
                sim.integrityPct = Math.max(0, sim.integrityPct - 15);
                sim.thermalThrottleSec = 10;
                pushLog(
                  sim,
                  'critical',
                  `SOBRECALENTAMIENTO (${ticket.title}): -15% Integridad y sensores degradados 10s.`
                );
                break;
              case 'solar_storm':
                sim.integrityPct = Math.max(0, sim.integrityPct - 12);
                sim.bufferUsedGB = sim.bufferUsedGB * 0.75;
                for (const m of sim.crew) {
                  m.fatigue = Math.min(100, m.fatigue + 22);
                  m.exhausted = m.fatigue >= 80;
                }
                pushLog(
                  sim,
                  'critical',
                  `TORMENTA SOLAR (${ticket.title}): -12% Integridad y +22% fatiga al Crew.`
                );
                break;
              case 'sunshield_deploy':
                sim.integrityPct = Math.max(0, sim.integrityPct - 14);
                sim.thermalThrottleSec = 10;
                pushLog(
                  sim,
                  'critical',
                  `ESCUDO ATASCADO (${ticket.title}): -14% Integridad y eficiencia térmica reducida.`
                );
                break;
              case 'star_tracker':
                sim.commsOutageSec = 8;
                sim.propellantPct = Math.max(0, sim.propellantPct - 12);
                pushLog(
                  sim,
                  'critical',
                  `PÉRDIDA DE ACTITUD (${ticket.title}): Comms caídas 8s y -12% Propelente.`
                );
                break;
              case 'propellant_leak':
                sim.propellantPct = Math.max(0, sim.propellantPct - 25);
                sim.integrityPct = Math.max(0, sim.integrityPct - 10);
                pushLog(
                  sim,
                  'critical',
                  `FUGA DE PROPELENTE (${ticket.title}): -25% Propelente y -10% Integridad.`
                );
                break;
            }
          } else {
            pushLog(sim, 'warning', `Ventana expirada: ${ticket.title}.`);
          }
        }
      }

      sim.tickets = sim.tickets.filter((t) => !completedIds.has(t.id) && !expiredIds.has(t.id));

      // 3. Spawn new tickets
      sim.nextObjectiveInSec -= dt;
      const activeObjectives = sim.tickets.filter((t) => t.kind === 'objective').length;
      if (sim.nextObjectiveInSec <= 0 && activeObjectives < 3 && sim.timeRemainingSec > 10) {
        const bufferPct =
          metrics.storageCapGB > 0 ? (sim.bufferUsedGB / metrics.storageCapGB) * 100 : 0;
        const newObj = createObjectiveTicket(scenario, metrics, bufferPct);
        sim.tickets.push(newObj);
        sim.nextObjectiveInSec = scenario.id === 'easy' ? 14 : 12;
      }

      const combinedRisk =
        metrics.riskMultiplier * nasaTelemetry.spaceWeatherRiskMultiplier;
      sim.nextEmergencyInSec -= dt * combinedRisk;
      const activeEmergencies = sim.tickets.filter((t) => t.kind === 'emergency').length;
      if (
        sim.nextEmergencyInSec <= 0 &&
        activeEmergencies < scenario.maxConcurrentEmergencies &&
        sim.timeRemainingSec > 12
      ) {
        const newEmg = createEmergencyTicket(scenario, nasaTelemetry);
        sim.tickets.push(newEmg);
        sim.nextEmergencyInSec = scenario.baseEmergencyIntervalSec;
        pushLog(sim, 'warning', `ALERTA ORBITAL: ${newEmg.title}`);
      }

      // 4. End condition check
      if (sim.integrityPct <= 0 || sim.timeRemainingSec <= 0) {
        sim.finished = true;
        const finalResult = buildRunResult(sim);
        setSnapshot({ ...sim, tickets: [...sim.tickets], crew: [...sim.crew], logs: [...sim.logs] });
        onMissionComplete(finalResult);
        return;
      }

      setSnapshot({
        ...sim,
        tickets: sim.tickets.map((t) => ({ ...t })),
        crew: sim.crew.map((c) => ({ ...c })),
        logs: [...sim.logs],
      });
    }, 100);

    return () => window.clearInterval(timer);
  }, [speed, scenario, metrics, nasaTelemetry, onMissionComplete]);

  // Keep selectedTicketId synced if ticket completed/expired
  const selectedTicket = useMemo(() => {
    return (
      snapshot.tickets.find((t) => t.id === selectedTicketId) ||
      snapshot.tickets.find((t) => t.kind === 'emergency') ||
      snapshot.tickets[0] ||
      null
    );
  }, [snapshot.tickets, selectedTicketId]);

  const assignCrewToTicket = (crewId: string, ticketId: string) => {
    const sim = simRef.current;
    if (sim.finished) return;

    const ticket = sim.tickets.find((t) => t.id === ticketId);
    const worker = sim.crew.find((c) => c.id === crewId);
    if (!ticket || !worker) return;

    // Free any previous assignment of this worker
    if (worker.assignedTicketId && worker.assignedTicketId !== ticketId) {
      const oldTicket = sim.tickets.find((t) => t.id === worker.assignedTicketId);
      if (oldTicket) oldTicket.assignedCrewId = null;
    }

    // Free any previous worker on target ticket
    if (ticket.assignedCrewId && ticket.assignedCrewId !== crewId) {
      const prevWorker = sim.crew.find((c) => c.id === ticket.assignedCrewId);
      if (prevWorker) prevWorker.assignedTicketId = null;
    }

    ticket.assignedCrewId = crewId;
    worker.assignedTicketId = ticketId;
    setSelectedTicketId(ticketId);
    setSnapshot({
      ...sim,
      tickets: sim.tickets.map((t) => ({ ...t })),
      crew: sim.crew.map((c) => ({ ...c })),
      logs: [...sim.logs],
    });
  };

  const unassignCrew = (crewId: string) => {
    const sim = simRef.current;
    const worker = sim.crew.find((c) => c.id === crewId);
    if (!worker || !worker.assignedTicketId) return;

    const ticket = sim.tickets.find((t) => t.id === worker.assignedTicketId);
    if (ticket) ticket.assignedCrewId = null;
    worker.assignedTicketId = null;
    setSnapshot({
      ...sim,
      tickets: sim.tickets.map((t) => ({ ...t })),
      crew: sim.crew.map((c) => ({ ...c })),
      logs: [...sim.logs],
    });
  };

  const finishEarly = () => {
    const sim = simRef.current;
    if (sim.finished) return;
    sim.finished = true;
    onMissionComplete(buildRunResult(sim));
  };

  const liveEval = calculateFinalScoreAndCML({
    objectivesCompleted: snapshot.objectivesCompleted,
    dataTransmittedGB: snapshot.dataTransmittedGB,
    finalIntegrityPct: snapshot.integrityPct,
    emergenciesFailed: snapshot.emergenciesFailed,
  });

  const formatTimer = (sec: number) => {
    const s = Math.max(0, Math.ceil(sec));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const bufferPct =
    metrics.storageCapGB > 0
      ? Math.min(100, Math.round((snapshot.bufferUsedGB / metrics.storageCapGB) * 100))
      : 0;

  // Ship coordinates in 400x400 SVG radar
  const shipRad = (snapshot.shipAngleDeg * Math.PI) / 180;
  const orbitRx = scenario.id === 'easy' ? 128 : scenario.id === 'medium' ? 142 : 148;
  const orbitRy = scenario.id === 'easy' ? 128 : scenario.id === 'medium' ? 105 : 98;
  const shipX = 200 + orbitRx * Math.cos(shipRad);
  const shipY = 200 + orbitRy * Math.sin(shipRad);

  return (
    <main className="mx-auto max-w-[1440px] px-4 pb-8 pt-4 sm:px-6">
      {/* Top Live Telemetry Bar */}
      <section
        aria-label="Telemetría en vivo de la nave"
        className="mb-4 grid grid-cols-2 gap-2.5 rounded-2xl border border-cyan-500/30 bg-[#070e20] p-3 sm:grid-cols-4 lg:grid-cols-7"
      >
        <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-2.5">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <Shield className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            INTEGRIDAD
          </span>
          <p
            className={`mt-1 font-mono-telemetry text-lg font-bold ${
              snapshot.integrityPct > 60
                ? 'text-emerald-300'
                : snapshot.integrityPct > 30
                ? 'text-amber-300'
                : 'text-rose-400'
            }`}
          >
            {Math.round(snapshot.integrityPct)}%
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-2.5">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <Fuel className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            PROPELENTE
          </span>
          <p
            className={`mt-1 font-mono-telemetry text-lg font-bold ${
              snapshot.propellantPct > 50
                ? 'text-cyan-200'
                : snapshot.propellantPct > 25
                ? 'text-amber-300'
                : 'text-rose-400'
            }`}
          >
            {Math.round(snapshot.propellantPct)}%
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-2.5">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            {snapshot.powerBlackoutSec > 0 ? (
              <ZapOff className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
            ) : (
              <BatteryCharging className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            )}
            BATERÍA / POWER
          </span>
          <p className="mt-1 font-mono-telemetry text-lg font-bold text-white">
            {snapshot.powerBlackoutSec > 0
              ? `APAGÓN ${snapshot.powerBlackoutSec.toFixed(0)}s`
              : `${Math.round(snapshot.batteryPct)}%`}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-2.5">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <Database className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            BUFFER A BORDO
          </span>
          <p
            className={`mt-1 font-mono-telemetry text-lg font-bold ${
              bufferPct >= 85 ? 'text-rose-400' : 'text-cyan-200'
            }`}
          >
            {Math.round(snapshot.bufferUsedGB)} / {metrics.storageCapGB} GB
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-2.5">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <Radio className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            DATOS EN TIERRA
          </span>
          <p className="mt-1 font-mono-telemetry text-lg font-bold text-emerald-300">
            {snapshot.commsOutageSec > 0
              ? `CAÍDO ${snapshot.commsOutageSec.toFixed(0)}s`
              : `${Math.round(snapshot.dataTransmittedGB)} GB`}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-2.5">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
            SCORE / CML VIVO
          </span>
          <p className="mt-1 font-mono-telemetry text-lg font-bold text-white">
            {liveEval.scoreFinal}{' '}
            <span className="text-xs text-cyan-300">(CML {liveEval.cmlLevel})</span>
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/75 p-2.5">
          <div>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <Clock className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              VENTANA
            </span>
            <p className="mt-1 font-mono-telemetry text-lg font-bold text-white">
              {formatTimer(snapshot.timeRemainingSec)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setSpeed((prev) => (prev === 0 ? 1 : 0))}
                aria-label={speed === 0 ? 'Reanudar simulación' : 'Pausar simulación'}
                className="rounded border border-slate-700 bg-slate-900 p-1.5 text-cyan-300 hover:border-cyan-400"
              >
                {speed === 0 ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setSpeed((prev) => (prev === 2 ? 1 : 2))}
                className={`rounded border px-2 py-1 font-mono-telemetry text-[11px] font-bold ${
                  speed === 2
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                    : 'border-slate-700 bg-slate-900 text-slate-300'
                }`}
              >
                2x
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Center Split: 2D Orbital Radar Map + Active Ticket Inspector */}
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* 2D Orbital Map (NASA Mission Viz inspired) */}
        <section className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#050a18] p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-mono-telemetry text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                NASA Mission Viz · Mapa Orbital Táctico 2D
              </span>
              <h1 className="font-display text-base font-bold text-white">
                {scenario.title} — {scenario.orbitLabel}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-cyan-300">
                ● Misiones ({snapshot.tickets.filter((t) => t.kind === 'objective').length})
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-rose-300">
                ▲ Emergencias ({snapshot.tickets.filter((t) => t.kind === 'emergency').length})
              </span>
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center rounded-xl border border-slate-800/80 bg-[#030712] p-2">
            <svg viewBox="0 0 400 400" className="h-[340px] w-full max-w-[440px] sm:h-[380px]">
              <defs>
                <radialGradient id="planetGlow" cx="50%" cy="50%" r="50%">
                  <stop
                    offset="0%"
                    stopColor={
                      scenario.id === 'easy'
                        ? '#0ea5e9'
                        : scenario.id === 'medium'
                        ? '#94a3b8'
                        : '#f59e0b'
                    }
                    stopOpacity="0.9"
                  />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
                </radialGradient>
              </defs>

              {/* Radar concentric rings & crosshairs */}
              <circle cx="200" cy="200" r="60" fill="none" stroke="#0f172a" strokeWidth="1" />
              <circle cx="200" cy="200" r="110" fill="none" stroke="#0f172a" strokeWidth="1" />
              <circle cx="200" cy="200" r="165" fill="none" stroke="#0f172a" strokeWidth="1" />
              <line x1="20" y1="200" x2="380" y2="200" stroke="#0f172a" strokeWidth="1" />
              <line x1="200" y1="20" x2="200" y2="380" stroke="#0f172a" strokeWidth="1" />

              {/* Eclipse shadow cone for Lunar / LEO */}
              <path
                d="M 200 172 L 385 130 L 385 270 L 200 228 Z"
                fill="rgba(2, 6, 23, 0.55)"
              />

              {/* GMAT Orbit Path */}
              <ellipse
                cx="200"
                cy="200"
                rx={orbitRx}
                ry={orbitRy}
                fill="none"
                stroke="#06b6d4"
                strokeOpacity="0.45"
                strokeWidth="2"
                strokeDasharray="6 5"
              />

              {/* Central Body (Earth / Moon / L2 Halo) */}
              <circle cx="200" cy="200" r="32" fill="url(#planetGlow)" stroke="#38bdf8" strokeWidth="1.5" />
              <text
                x="200"
                y="204"
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {scenario.id === 'easy' ? 'TIERRA' : scenario.id === 'medium' ? 'LUNA' : 'L2 HALO'}
              </text>

              {/* Deep Space Network Ground Antennas Indicator */}
              <circle cx="38" cy="360" r="5" fill="#10b981" />
              <text x="48" y="364" fill="#6ee7b7" fontSize="9" fontFamily="monospace">
                DSN GOLDSTONE / MADRID
              </text>
              {snapshot.commsOutageSec <= 0 && snapshot.powerBlackoutSec <= 0 && (
                <line
                  x1="38"
                  y1="360"
                  x2={shipX}
                  y2={shipY}
                  stroke="#10b981"
                  strokeOpacity="0.22"
                  strokeDasharray="3 4"
                />
              )}

              {/* Spacecraft Position */}
              <g transform={`translate(${shipX}, ${shipY})`}>
                <circle r="11" fill="rgba(34, 211, 238, 0.2)" />
                <polygon points="0,-7 6,5 -6,5" fill="#22d3ee" stroke="#083344" strokeWidth="1" />
              </g>

              {/* Ticket Nodes */}
              {snapshot.tickets.map((t) => {
                const rad = (t.orbitAngleDeg * Math.PI) / 180;
                const nx = 200 + orbitRx * t.orbitRadiusFactor * Math.cos(rad);
                const ny = 200 + orbitRy * t.orbitRadiusFactor * Math.sin(rad);
                const isSelected = selectedTicket?.id === t.id;
                const isEmg = t.kind === 'emergency';
                const pct = Math.round((t.progress / t.workRequired) * 100);
                const strokeColor = isEmg ? '#fb7185' : '#22d3ee';

                return (
                  <g
                    key={t.id}
                    transform={`translate(${nx}, ${ny})`}
                    onClick={() => setSelectedTicketId(t.id)}
                    className="cursor-pointer"
                  >
                    {isEmg && (
                      <circle
                        r="21"
                        fill="none"
                        stroke="#f43f5e"
                        strokeOpacity="0.55"
                        strokeWidth="2"
                      />
                    )}
                    <circle
                      r={isSelected ? '17' : '14'}
                      fill={isEmg ? '#4c0519' : '#083344'}
                      stroke={isSelected ? '#fde047' : strokeColor}
                      strokeWidth={isSelected ? '3' : '2'}
                    />
                    <text
                      y="3"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {pct > 0 ? `${pct}%` : isEmg ? '!' : '★'}
                    </text>
                    <text
                      y="26"
                      textAnchor="middle"
                      fill={isEmg ? '#fda4af' : '#a5f3fc'}
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {Math.ceil(t.ttl)}s
                    </text>
                  </g>
                );
              })}
            </svg>

            {snapshot.powerBlackoutSec > 0 && (
              <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-xl border border-rose-500/60 bg-rose-950/90 px-4 py-2 text-center text-xs font-bold text-rose-200">
                ⚡ APAGÓN EN ECLIPSE ({snapshot.powerBlackoutSec.toFixed(0)}s): Misiones objetivo congeladas hasta restablecer energía.
              </div>
            )}
          </div>
        </section>

        {/* Right Panel: Active Tickets Queue + Selected Ticket Dispatch Inspector */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-[#091124] p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-white">
              <Activity className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              Tickets Activos ({snapshot.tickets.length})
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={finishEarly}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-amber-400 hover:text-amber-200"
              >
                Evaluar Ahora
              </button>
              <button
                type="button"
                onClick={onAbortToBuilder}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-200 hover:bg-rose-500/20"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                Hangar
              </button>
            </div>
          </div>

          {/* Ticket Chips List */}
          <div className="telemetry-scroll flex max-h-[160px] flex-col gap-1.5 overflow-y-auto pr-1">
            {snapshot.tickets.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-700 p-3 text-center text-xs text-slate-400">
                Esperando próxima ventana orbital...
              </p>
            ) : (
              snapshot.tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                const isEmg = t.kind === 'emergency';
                const pct = Math.min(100, Math.round((t.progress / t.workRequired) * 100));
                const assigned = t.assignedCrewId
                  ? snapshot.crew.find((c) => c.id === t.assignedCrewId)
                  : null;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs transition ${
                      isSelected
                        ? isEmg
                          ? 'border-rose-400 bg-rose-950/40'
                          : 'border-cyan-400 bg-cyan-950/40'
                        : 'border-slate-800 bg-slate-950/75 hover:border-slate-600'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {isEmg ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
                        )}
                        <span className="truncate font-bold text-white">{t.title}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 font-mono-telemetry text-[10px]">
                        <span className="text-slate-300">Req: {SKILL_BADGE[t.requiredSkill].label}</span>
                        {t.requiresHighCalm && (
                          <span className="text-amber-300">+ Alta Calma</span>
                        )}
                        {assigned && (
                          <span className="text-emerald-300">→ {assigned.callsign}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right font-mono-telemetry">
                      <p className={isEmg ? 'font-bold text-rose-300' : 'font-bold text-cyan-300'}>
                        {Math.ceil(t.ttl)}s
                      </p>
                      <p className="text-[10px] text-slate-400">{pct}%</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Selected Ticket Inspector & Quick Assign */}
          {selectedTicket && (
            <div className="flex flex-1 flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/90 p-3.5">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span
                    className={`rounded border px-2 py-0.5 font-mono-telemetry text-[10px] font-bold ${
                      selectedTicket.kind === 'emergency'
                        ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                        : 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                    }`}
                  >
                    {selectedTicket.kind === 'emergency' ? 'EMERGENCIA' : 'MISIÓN OBJETIVO'}
                  </span>
                  {selectedTicket.realNasaSource && (
                    <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono-telemetry text-[10px] text-amber-300">
                      {selectedTicket.realNasaSource}
                    </span>
                  )}
                </div>

                <h3 className="mt-2 font-display text-sm font-bold text-white">
                  {selectedTicket.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  {selectedTicket.description}
                </p>

                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
                  <span
                    className={`rounded border px-2 py-0.5 font-semibold ${
                      SKILL_BADGE[selectedTicket.requiredSkill].color
                    }`}
                  >
                    Requiere: {SKILL_BADGE[selectedTicket.requiredSkill].label}
                  </span>
                  {selectedTicket.requiresHighCalm && (
                    <span className="inline-flex items-center gap-1 rounded border border-indigo-500/40 bg-indigo-500/15 px-2 py-0.5 font-semibold text-indigo-300">
                      <Flame className="h-3 w-3" aria-hidden="true" />
                      Alto Estrés (Calma crítica)
                    </span>
                  )}
                </div>

                <p className="mt-2 rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 text-[11px] text-slate-300">
                  {selectedTicket.kind === 'emergency' ? (
                    <span className="text-rose-300">
                      <strong>Si expira:</strong> {selectedTicket.failurePenaltyDescription}
                    </span>
                  ) : (
                    <span className="text-emerald-300">
                      <strong>Recompensa:</strong> +{selectedTicket.scienceReward} pts
                      {selectedTicket.dataGeneratedGB > 0 &&
                        ` · +${selectedTicket.dataGeneratedGB} GB`}
                      {selectedTicket.transmitsBuffer && ' · Descarga rápida DSN'}
                    </span>
                  )}
                </p>
              </div>

              {/* Assign buttons for the 4 crew members */}
              <div className="mt-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Despachar Operador a este Ticket:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {snapshot.crew.map((member) => {
                    const isAssignedHere = selectedTicket.assignedCrewId === member.id;
                    const pps = calculateProgressPerSecond(member, selectedTicket.requiredSkill);
                    const estSec = Math.max(
                      1,
                      Math.ceil((selectedTicket.workRequired - selectedTicket.progress) / pps)
                    );
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() =>
                          isAssignedHere
                            ? unassignCrew(member.id)
                            : assignCrewToTicket(member.id, selectedTicket.id)
                        }
                        className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition ${
                          isAssignedHere
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                            : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="truncate font-bold">{member.callsign}</p>
                            {member.primarySkill === selectedTicket.requiredSkill && (
                              <span className="shrink-0 rounded bg-cyan-500/20 px-1 py-0.2 font-mono-telemetry text-[9px] font-bold text-cyan-300">
                                +25%
                              </span>
                            )}
                          </div>
                          <p className="font-mono-telemetry text-[10px] text-slate-400">
                            Stat {member.stats[selectedTicket.requiredSkill]} · ~{estSec}s
                          </p>
                        </div>
                        <span className="ml-1 shrink-0 font-mono-telemetry text-[10px] font-bold">
                          {isAssignedHere ? 'SOLTAR' : member.assignedTicketId ? 'MOVER' : 'IR'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Bottom Dock: The 4 MDL Crew Operators + Timeline Log */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[2.2fr_1fr]">
        <section aria-label="Consola de los 4 operadores del MDL Crew">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {snapshot.crew.map((member) => {
              const activeTicket = member.assignedTicketId
                ? snapshot.tickets.find((t) => t.id === member.assignedTicketId)
                : null;
              const fatiguePct = Math.round(member.fatigue);
              return (
                <article
                  key={member.id}
                  className={`flex flex-col justify-between rounded-2xl border p-3.5 transition ${
                    member.exhausted
                      ? 'border-rose-500/60 bg-rose-950/20'
                      : activeTicket
                      ? 'border-cyan-400/70 bg-cyan-950/20'
                      : 'border-slate-800 bg-[#091124]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="h-12 w-12 shrink-0 rounded-xl border border-slate-700 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="truncate font-display text-sm font-bold text-white">
                            {member.callsign}
                          </h3>
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono-telemetry text-[10px] font-bold ${
                              member.exhausted
                                ? 'bg-rose-500/25 text-rose-300'
                                : activeTicket
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {member.exhausted
                              ? 'EXHAUSTED'
                              : activeTicket
                              ? 'OCUPADO'
                              : 'LIBRE'}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-slate-400">{member.name}</p>
                      </div>
                    </div>

                    {/* 4 Stats compact */}
                    <div className="mt-2.5 grid grid-cols-4 gap-1 text-center font-mono-telemetry text-[10px]">
                      <div className="rounded bg-slate-900/80 py-1">
                        <span className="block text-slate-500">MAT</span>
                        <span className="font-bold text-cyan-300">{member.stats.matematico}</span>
                      </div>
                      <div className="rounded bg-slate-900/80 py-1">
                        <span className="block text-slate-500">CIE</span>
                        <span className="font-bold text-emerald-300">
                          {member.stats.cientifico}
                        </span>
                      </div>
                      <div className="rounded bg-slate-900/80 py-1">
                        <span className="block text-slate-500">TEC</span>
                        <span className="font-bold text-amber-300">{member.stats.tecnologia}</span>
                      </div>
                      <div className="rounded bg-slate-900/80 py-1">
                        <span className="block text-slate-500">CAL</span>
                        <span className="font-bold text-indigo-300">{member.stats.calma}</span>
                      </div>
                    </div>

                    {/* Fatigue Bar */}
                    <div className="mt-2.5">
                      <div className="flex justify-between font-mono-telemetry text-[10px]">
                        <span className="text-slate-400">Fatiga (Calma {member.stats.calma})</span>
                        <span
                          className={
                            fatiguePct >= 80
                              ? 'font-bold text-rose-400'
                              : fatiguePct >= 50
                              ? 'text-amber-300'
                              : 'text-emerald-300'
                          }
                        >
                          {fatiguePct}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full transition-all duration-150 ${
                            fatiguePct >= 80
                              ? 'bg-rose-500'
                              : fatiguePct >= 50
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${fatiguePct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Current Assignment or Quick Button */}
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2">
                    <span className="truncate text-[11px] text-slate-300">
                      {activeTicket ? activeTicket.title : 'Descansando en consola'}
                    </span>
                    {activeTicket ? (
                      <button
                        type="button"
                        onClick={() => unassignCrew(member.id)}
                        className="shrink-0 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-300 hover:border-amber-400 hover:text-amber-200"
                      >
                        Descansar
                      </button>
                    ) : (
                      selectedTicket && (
                        <button
                          type="button"
                          onClick={() => assignCrewToTicket(member.id, selectedTicket.id)}
                          className="inline-flex shrink-0 items-center gap-1 rounded bg-cyan-500 px-2 py-1 text-[10px] font-bold text-slate-950 hover:bg-cyan-400"
                        >
                          <UserCheck className="h-3 w-3" aria-hidden="true" />
                          Asignar
                        </button>
                      )
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Live Mission Timeline Log */}
        <section className="flex flex-col rounded-2xl border border-slate-800 bg-[#091124] p-3.5">
          <h2 className="mb-2 flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
            <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
            Línea de Tiempo &amp; Bitácora
          </h2>
          <div className="telemetry-scroll max-h-[168px] space-y-1.5 overflow-y-auto pr-1 text-[11px]">
            {snapshot.logs.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-lg border px-2.5 py-1.5 ${
                  entry.severity === 'critical'
                    ? 'border-rose-500/40 bg-rose-950/30 text-rose-200'
                    : entry.severity === 'warning'
                    ? 'border-amber-500/35 bg-amber-950/25 text-amber-200'
                    : entry.severity === 'success'
                    ? 'border-emerald-500/35 bg-emerald-950/20 text-emerald-200'
                    : 'border-slate-800 bg-slate-950/70 text-slate-300'
                }`}
              >
                <span className="mr-1.5 font-mono-telemetry font-bold opacity-80">
                  [T+{entry.timeSec}s]
                </span>
                <span>{entry.message}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};
