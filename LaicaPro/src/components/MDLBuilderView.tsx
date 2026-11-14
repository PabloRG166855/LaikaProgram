import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BatteryCharging,
  CheckCircle2,
  Cpu,
  Database,
  DollarSign,
  HardDrive,
  Layers,
  Radio,
  Rocket,
  Scale,
  ShieldAlert,
  Sparkles,
  UserMinus,
  UserPlus,
  Users,
  Wand2,
} from 'lucide-react';
import {
  CREW_CANDIDATES,
  HARDWARE_CATALOG,
  RECOMMENDED_PRESETS,
} from '../data/missionCatalog';
import { computeMissionMetrics } from '../services/missionEngine';
import {
  CrewCandidate,
  HardwareCategory,
  HardwareItem,
  MissionScenario,
  ProcessedNasaTelemetry,
  SkillKey,
  SpacecraftConfig,
} from '../types/mission';

interface MDLBuilderViewProps {
  scenario: MissionScenario;
  selectedCrew: CrewCandidate[];
  config: SpacecraftConfig;
  nasaTelemetry: ProcessedNasaTelemetry;
  onChangeCrew: (crew: CrewCandidate[]) => void;
  onChangeConfig: (config: SpacecraftConfig) => void;
  onLaunchMission: () => void;
  onBackToSelect: () => void;
}

const SKILL_META: Array<{ key: SkillKey; label: string; short: string; colorClass: string }> = [
  { key: 'matematico', label: 'Matemático', short: 'MAT', colorClass: 'bg-cyan-400' },
  { key: 'cientifico', label: 'Científico', short: 'CIE', colorClass: 'bg-emerald-400' },
  { key: 'tecnologia', label: 'Tecnología', short: 'TEC', colorClass: 'bg-amber-400' },
  { key: 'calma', label: 'Calma', short: 'CAL', colorClass: 'bg-indigo-400' },
];

export const MDLBuilderView: React.FC<MDLBuilderViewProps> = ({
  scenario,
  selectedCrew,
  config,
  nasaTelemetry,
  onChangeCrew,
  onChangeConfig,
  onLaunchMission,
  onBackToSelect,
}) => {
  const [skillFilter, setSkillFilter] = useState<'all' | SkillKey>('all');
  const [hwTab, setHwTab] = useState<HardwareCategory>('chassis');

  const metrics = useMemo(
    () => computeMissionMetrics(scenario, selectedCrew, config),
    [scenario, selectedCrew, config]
  );

  const selectedChassis = useMemo(
    () => HARDWARE_CATALOG.find((h) => h.id === config.chassisId),
    [config.chassisId]
  );

  const filteredCandidates = useMemo(() => {
    if (skillFilter === 'all') return CREW_CANDIDATES;
    return CREW_CANDIDATES.filter((c) => c.primarySkill === skillFilter);
  }, [skillFilter]);

  const toggleCrewMember = (candidate: CrewCandidate) => {
    const exists = selectedCrew.some((c) => c.id === candidate.id);
    if (exists) {
      onChangeCrew(selectedCrew.filter((c) => c.id !== candidate.id));
      return;
    }
    if (selectedCrew.length >= 4) {
      return;
    }
    onChangeCrew([...selectedCrew, candidate]);
  };

  const selectHardwareItem = (item: HardwareItem) => {
    if (item.category === 'chassis') {
      const trimmedPayloads = config.payloadIds.slice(0, item.maxPayloadSlots);
      onChangeConfig({ ...config, chassisId: item.id, payloadIds: trimmedPayloads });
    } else if (item.category === 'power') {
      onChangeConfig({ ...config, powerId: item.id });
    } else if (item.category === 'comms') {
      onChangeConfig({ ...config, commsId: item.id });
    } else if (item.category === 'rocket') {
      onChangeConfig({ ...config, rocketId: item.id });
    } else if (item.category === 'payload') {
      const already = config.payloadIds.includes(item.id);
      if (already) {
        onChangeConfig({
          ...config,
          payloadIds: config.payloadIds.filter((id) => id !== item.id),
        });
      } else {
        const maxSlots = selectedChassis?.maxPayloadSlots ?? 2;
        if (config.payloadIds.length >= maxSlots) {
          // Replace the last slot so clicking feels immediate
          onChangeConfig({
            ...config,
            payloadIds: [...config.payloadIds.slice(0, maxSlots - 1), item.id],
          });
        } else {
          onChangeConfig({
            ...config,
            payloadIds: [...config.payloadIds, item.id],
          });
        }
      }
    }
  };

  const applyRecommendedPreset = () => {
    const preset = RECOMMENDED_PRESETS[scenario.id];
    const presetCrew = preset.crewIds
      .map((id) => CREW_CANDIDATES.find((c) => c.id === id))
      .filter((c): c is CrewCandidate => Boolean(c));
    onChangeCrew(presetCrew);
    onChangeConfig({ ...preset.config });
  };

  // Compute radar chart points for hired crew average
  const crewRadarPoints = useMemo(() => {
    const avg = (key: SkillKey) =>
      selectedCrew.length === 0
        ? 0
        : selectedCrew.reduce((s, c) => s + c.stats[key], 0) / selectedCrew.length;

    const vals = {
      matematico: avg('matematico'),
      cientifico: avg('cientifico'),
      tecnologia: avg('tecnologia'),
      calma: avg('calma'),
    };
    const cx = 70;
    const cy = 70;
    const maxR = 48;
    const pts = [
      { x: cx, y: cy - (vals.matematico / 100) * maxR }, // Top: Math
      { x: cx + (vals.cientifico / 100) * maxR, y: cy }, // Right: Science
      { x: cx, y: cy + (vals.tecnologia / 100) * maxR }, // Bottom: Tech
      { x: cx - (vals.calma / 100) * maxR, y: cy }, // Left: Calma
    ];
    return {
      vals,
      polygon: pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    };
  }, [selectedCrew]);

  const hwCategories: Array<{
    id: HardwareCategory;
    label: string;
    segment: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'chassis',
      label: 'Chasis',
      segment: 'Space',
      icon: <Layers className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    {
      id: 'payload',
      label: 'Instrumentos',
      segment: 'Space',
      icon: <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    {
      id: 'power',
      label: 'Energía',
      segment: 'Space',
      icon: <BatteryCharging className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    {
      id: 'comms',
      label: 'Antenas',
      segment: 'Ground',
      icon: <Radio className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    {
      id: 'rocket',
      label: 'Cohete',
      segment: 'Launch',
      icon: <Rocket className="h-3.5 w-3.5" aria-hidden="true" />,
    },
  ];

  const itemsInActiveTab = HARDWARE_CATALOG.filter((h) => h.category === hwTab);

  return (
    <main className="mx-auto max-w-[1440px] px-4 pb-12 pt-5 sm:px-6">
      {/* Top Scenario Subheader */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#091124] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 font-mono-telemetry text-[11px] font-bold text-cyan-300">
              NIVEL {scenario.levelNumber} · {scenario.difficultyLabel}
            </span>
            <h1 className="font-display text-lg font-bold text-white sm:text-xl">
              Laboratorio MDL: {scenario.title}
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Órbita GMAT: <strong className="text-slate-200">{scenario.orbitLabel}</strong> · Comms mínimos:{' '}
            <strong className="text-cyan-300">{scenario.requiredMinCommsKbps} kbps</strong> · Riesgo solar DONKI:{' '}
            <strong className="text-amber-300">{nasaTelemetry.spaceWeatherRiskMultiplier}x</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={applyRecommendedPreset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25"
          >
            <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Auto-Configurar Balanceado</span>
          </button>
          <button
            type="button"
            onClick={onBackToSelect}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Cambiar Nivel
          </button>
        </div>
      </div>

      {/* Fixed Top Bar: The 6 Critical Variables */}
      <section
        aria-label="Las 6 variables críticas de ingeniería espacial"
        className="sticky top-[65px] z-20 mb-6 grid grid-cols-2 gap-2.5 rounded-2xl border border-cyan-500/30 bg-[#060c1c]/95 p-3 shadow-lg shadow-black/50 backdrop-blur-md sm:grid-cols-3 lg:grid-cols-6"
      >
        {/* 1. Budget */}
        <div
          className={`rounded-xl border p-2.5 ${
            metrics.isBudgetValid
              ? 'border-slate-800 bg-slate-950/75'
              : 'border-rose-500/60 bg-rose-950/30'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-semibold">
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              BUDGET
            </span>
            <span className="font-mono-telemetry">
              {metrics.budgetRemainingM >= 0 ? 'OK' : 'EXCEDIDO'}
            </span>
          </div>
          <p
            className={`mt-1 font-mono-telemetry text-base font-bold ${
              metrics.isBudgetValid ? 'text-white' : 'text-rose-300'
            }`}
          >
            ${metrics.totalCostM}M / ${scenario.initialBudgetM}M
          </p>
          <p className="font-mono-telemetry text-[10px] text-slate-400">
            Crew ${metrics.crewCostM}M · HW ${metrics.hardwareCostM}M
          </p>
        </div>

        {/* 2. Mass */}
        <div
          className={`rounded-xl border p-2.5 ${
            metrics.isMassValid
              ? 'border-slate-800 bg-slate-950/75'
              : 'border-rose-500/60 bg-rose-950/30'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-semibold">
              <Scale className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              MASS
            </span>
            <span className="font-mono-telemetry">
              {metrics.isMassValid ? 'EN RANGO' : 'SOBREPESO'}
            </span>
          </div>
          <p
            className={`mt-1 font-mono-telemetry text-base font-bold ${
              metrics.isMassValid ? 'text-white' : 'text-rose-300'
            }`}
          >
            {metrics.totalMassKg} / {metrics.rocketCapacityKg} kg
          </p>
          <p className="font-mono-telemetry text-[10px] text-slate-400">
            Capacidad Cohete ({scenario.orbit})
          </p>
        </div>

        {/* 3. Power */}
        <div
          className={`rounded-xl border p-2.5 ${
            metrics.isPowerValid
              ? 'border-slate-800 bg-slate-950/75'
              : 'border-rose-500/60 bg-rose-950/30'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-semibold">
              <BatteryCharging className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              POWER
            </span>
            <span className="font-mono-telemetry">
              {metrics.powerMarginW >= 0 ? `+${metrics.powerMarginW}W` : `${metrics.powerMarginW}W`}
            </span>
          </div>
          <p
            className={`mt-1 font-mono-telemetry text-base font-bold ${
              metrics.isPowerValid ? 'text-white' : 'text-rose-300'
            }`}
          >
            {metrics.powerGeneratedW}W / {metrics.powerConsumedW}W
          </p>
          <p className="font-mono-telemetry text-[10px] text-slate-400">Generación vs. Consumo</p>
        </div>

        {/* 4. Data */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-semibold">
              <Database className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              DATA &amp; BUFFER
            </span>
            <HardDrive className="h-3 w-3 text-slate-500" aria-hidden="true" />
          </div>
          <p className="mt-1 font-mono-telemetry text-base font-bold text-white">
            {metrics.dataRatePerMissionGB} GB/op
          </p>
          <p className="font-mono-telemetry text-[10px] text-slate-400">
            Memoria a bordo: {metrics.storageCapGB} GB
          </p>
        </div>

        {/* 5. Comms */}
        <div
          className={`rounded-xl border p-2.5 ${
            metrics.isCommsValid
              ? 'border-slate-800 bg-slate-950/75'
              : 'border-rose-500/60 bg-rose-950/30'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-semibold">
              <Radio className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              COMMS
            </span>
            <span className="font-mono-telemetry">
              Mín {scenario.requiredMinCommsKbps}
            </span>
          </div>
          <p
            className={`mt-1 font-mono-telemetry text-base font-bold ${
              metrics.isCommsValid ? 'text-white' : 'text-rose-300'
            }`}
          >
            {metrics.commsKbps} kbps
          </p>
          <p className="font-mono-telemetry text-[10px] text-slate-400">
            Latencia: {scenario.orbitLatency}
          </p>
        </div>

        {/* 6. Time & Reliability */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-semibold">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              TIME / RIESGO
            </span>
            <span className="font-mono-telemetry">{scenario.durationSec}s</span>
          </div>
          <p className="mt-1 font-mono-telemetry text-base font-bold text-white">
            {Math.round(metrics.avgReliability * 100)}% Fiab.
          </p>
          <p className="font-mono-telemetry text-[10px] text-slate-400">
            Tasa crisis: {metrics.riskMultiplier}x
          </p>
        </div>
      </section>

      {/* Main 2-Column Builder */}
      <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
        {/* LEFT COLUMN: GROUND SEGMENT / MDL CREW */}
        <section className="flex flex-col rounded-2xl border border-slate-800 bg-[#091124] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="font-mono-telemetry text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                Ground Segment · Mission Design Lab (MDL)
              </span>
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white">
                <Users className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                Contratación del Crew ({selectedCrew.length}/4 Asientos)
              </h2>
            </div>
            <span
              className={`rounded-lg border px-2.5 py-1 font-mono-telemetry text-xs font-bold ${
                metrics.isCrewValid
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
              }`}
            >
              Nómina: ${metrics.crewCostM}M USD
            </span>
          </div>

          {/* Active 4 Console Seats + Radar Chart */}
          <div className="mb-5 grid gap-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 sm:grid-cols-[1fr_140px]">
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((slotIdx) => {
                const member = selectedCrew[slotIdx];
                if (!member) {
                  return (
                    <div
                      key={slotIdx}
                      className="flex h-[72px] items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-2 text-center text-xs text-slate-500"
                    >
                      Asiento #{slotIdx + 1} Vacío
                    </div>
                  );
                }
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleCrewMember(member)}
                    className="group flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-950/25 p-2 text-left transition hover:border-rose-400/60 hover:bg-rose-950/20"
                    title="Clic para liberar asiento"
                  >
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="h-11 w-11 shrink-0 rounded-lg border border-slate-700 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white">{member.callsign}</p>
                      <p className="truncate text-[10px] text-cyan-300">
                        {member.primarySkill.toUpperCase()} · {member.stats[member.primarySkill]}
                      </p>
                      <p className="font-mono-telemetry text-[10px] text-emerald-300">
                        ${member.costM}M · Quitar ×
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* SVG Radar Chart of Team Stats */}
            <div className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 p-1">
              <svg viewBox="0 0 140 140" className="h-32 w-32" aria-label="Gráfico radar del Crew">
                <circle cx="70" cy="70" r="48" fill="none" stroke="#1e293b" strokeWidth="1" />
                <circle cx="70" cy="70" r="32" fill="none" stroke="#1e293b" strokeWidth="1" />
                <circle cx="70" cy="70" r="16" fill="none" stroke="#1e293b" strokeWidth="1" />
                <line x1="70" y1="22" x2="70" y2="118" stroke="#1e293b" strokeWidth="1" />
                <line x1="22" y1="70" x2="118" y2="70" stroke="#1e293b" strokeWidth="1" />
                <polygon
                  points={crewRadarPoints.polygon}
                  fill="rgba(6, 182, 212, 0.28)"
                  stroke="#22d3ee"
                  strokeWidth="2"
                />
                <text x="70" y="13" textAnchor="middle" fill="#22d3ee" fontSize="9" fontWeight="bold">
                  MAT {Math.round(crewRadarPoints.vals.matematico)}
                </text>
                <text x="122" y="73" textAnchor="start" fill="#34d399" fontSize="9" fontWeight="bold">
                  CIE {Math.round(crewRadarPoints.vals.cientifico)}
                </text>
                <text x="70" y="133" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold">
                  TEC {Math.round(crewRadarPoints.vals.tecnologia)}
                </text>
                <text x="18" y="73" textAnchor="end" fill="#818cf8" fontSize="9" fontWeight="bold">
                  CAL {Math.round(crewRadarPoints.vals.calma)}
                </text>
              </svg>
            </div>
          </div>

          {/* Skill Filter */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSkillFilter('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                skillFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'border border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              Todos (12)
            </button>
            {SKILL_META.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSkillFilter(s.key)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  skillFilter === s.key
                    ? 'bg-cyan-500 text-slate-950'
                    : 'border border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Candidate Cards */}
          <div className="telemetry-scroll grid max-h-[540px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            {filteredCandidates.map((cand) => {
              const isHired = selectedCrew.some((c) => c.id === cand.id);
              const isFull = selectedCrew.length >= 4 && !isHired;
              return (
                <article
                  key={cand.id}
                  className={`flex flex-col justify-between rounded-xl border p-3 transition ${
                    isHired
                      ? 'border-cyan-400 bg-cyan-950/30'
                      : 'border-slate-800 bg-slate-950/75 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-start gap-2.5">
                      <img
                        src={cand.avatarUrl}
                        alt={cand.name}
                        className="h-12 w-12 shrink-0 rounded-xl border border-slate-700 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-display text-sm font-bold text-white">
                            {cand.name}
                          </span>
                          <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono-telemetry text-xs font-bold text-emerald-300">
                            ${cand.costM}M
                          </span>
                        </div>
                        <p className="truncate text-[11px] font-medium text-cyan-300">
                          {cand.roleTitle}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono-telemetry text-[10px] text-slate-300">
                            Tier {cand.tier} · {cand.tierLabel}
                          </span>
                          <span className="truncate font-mono-telemetry text-[10px] text-slate-400">
                            {cand.nasaReference}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] leading-snug text-slate-400">{cand.bio}</p>

                    {/* 4 Stat Bars */}
                    <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {SKILL_META.map((s) => {
                        const val = cand.stats[s.key];
                        return (
                          <div key={s.key}>
                            <div className="flex justify-between font-mono-telemetry text-[10px]">
                              <span
                                className={
                                  cand.primarySkill === s.key
                                    ? 'font-bold text-white'
                                    : 'text-slate-400'
                                }
                              >
                                {s.short}
                              </span>
                              <span className="text-slate-200">{val}</span>
                            </div>
                            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className={`h-full rounded-full ${s.colorClass}`}
                                style={{ width: `${val}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCrewMember(cand)}
                    disabled={isFull}
                    className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      isHired
                        ? 'border border-rose-500/40 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25'
                        : isFull
                        ? 'cursor-not-allowed border border-slate-800 bg-slate-900 text-slate-500'
                        : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                    }`}
                  >
                    {isHired ? (
                      <>
                        <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Despedir de Consola</span>
                      </>
                    ) : isFull ? (
                      <span>Consola Llena (4/4)</span>
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Contratar (${cand.costM}M)</span>
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* RIGHT COLUMN: SPACE & LAUNCH SEGMENTS */}
        <section className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#091124] p-5">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono-telemetry text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Space &amp; Launch Segments · CubeSat 101 &amp; GMAT
                </span>
                <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white">
                  <Cpu className="h-5 w-5 text-amber-400" aria-hidden="true" />
                  Configuración de Nave y Cohete
                </h2>
              </div>
              <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono-telemetry text-xs font-bold text-amber-300">
                Hardware: ${metrics.hardwareCostM}M USD
              </span>
            </div>

            {/* Hardware Category Tabs */}
            <div className="mb-4 flex flex-wrap gap-1.5">
              {hwCategories.map((cat) => {
                const isSelectedTab = hwTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setHwTab(cat.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      isSelectedTab
                        ? 'bg-amber-400 text-slate-950'
                        : 'border border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-400/50 hover:text-white'
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                    <span
                      className={`rounded px-1 py-0.5 font-mono-telemetry text-[9px] uppercase ${
                        isSelectedTab ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {cat.segment}
                    </span>
                  </button>
                );
              })}
            </div>

            {hwTab === 'payload' && (
              <div className="mb-3 rounded-lg border border-cyan-500/30 bg-cyan-950/25 px-3 py-2 text-xs text-cyan-200">
                Bahías de carga útil ocupadas:{' '}
                <strong className="font-mono-telemetry">
                  {config.payloadIds.length} / {selectedChassis?.maxPayloadSlots ?? 0}
                </strong>{' '}
                (definido por tu chasis seleccionado). Puedes combinar varios instrumentos.
              </div>
            )}

            {/* Hardware Options List */}
            <div className="telemetry-scroll max-h-[430px] space-y-2.5 overflow-y-auto pr-1">
              {itemsInActiveTab.map((item) => {
                const isSelected =
                  item.category === 'payload'
                    ? config.payloadIds.includes(item.id)
                    : config.chassisId === item.id ||
                      config.powerId === item.id ||
                      config.commsId === item.id ||
                      config.rocketId === item.id;

                const rocketOrbitCap =
                  item.category === 'rocket'
                    ? item.maxMassByOrbit?.[scenario.orbit] ?? 0
                    : null;
                const rocketIncompatible =
                  rocketOrbitCap !== null && rocketOrbitCap <= 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectHardwareItem(item)}
                    className={`w-full rounded-xl border p-3.5 text-left transition ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/25 shadow-inner shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-950/75 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-sm font-bold text-white">
                            {item.name}
                          </span>
                          <span className="rounded border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 font-mono-telemetry text-[10px] font-semibold text-amber-300">
                            {item.nasaSegment}
                          </span>
                          <span className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono-telemetry text-[10px] text-cyan-300">
                            {item.nasaResourceTag}
                          </span>
                          {item.bonusScenarios?.includes(scenario.id) && (
                            <span className="inline-flex items-center gap-1 rounded border border-emerald-400/50 bg-emerald-500/15 px-1.5 py-0.5 font-mono-telemetry text-[10px] font-bold text-emerald-300">
                              ★ BONO OBJETIVO (+25% Ciencia)
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono-telemetry text-xs font-bold text-emerald-300">
                          ${item.costM}M
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Equipado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Technical Badges */}
                    <div className="mt-2.5 flex flex-wrap gap-2 font-mono-telemetry text-[11px]">
                      {item.massKg > 0 && (
                        <span className="rounded bg-slate-900 px-2 py-0.5 text-slate-200">
                          Masa: {item.massKg} kg
                        </span>
                      )}
                      {item.powerGenW > 0 && (
                        <span className="rounded bg-emerald-950/60 px-2 py-0.5 text-emerald-300">
                          Genera: +{item.powerGenW} W
                        </span>
                      )}
                      {item.powerUseW > 0 && (
                        <span className="rounded bg-amber-950/60 px-2 py-0.5 text-amber-300">
                          Consume: -{item.powerUseW} W
                        </span>
                      )}
                      {item.dataRateGB > 0 && (
                        <span className="rounded bg-cyan-950/60 px-2 py-0.5 text-cyan-300">
                          Ciencia: +{item.dataRateGB} GB/op
                        </span>
                      )}
                      {item.commsKbps > 0 && (
                        <span className="rounded bg-cyan-950/60 px-2 py-0.5 text-cyan-300">
                          Enlace: {item.commsKbps} kbps
                        </span>
                      )}
                      {item.storageCapGB > 0 && (
                        <span className="rounded bg-slate-900 px-2 py-0.5 text-slate-200">
                          Buffer: {item.storageCapGB} GB · {item.maxPayloadSlots} Slots
                        </span>
                      )}
                      {rocketOrbitCap !== null && (
                        <span
                          className={`rounded px-2 py-0.5 font-bold ${
                            rocketIncompatible
                              ? 'bg-rose-950/70 text-rose-300'
                              : 'bg-cyan-950/70 text-cyan-300'
                          }`}
                        >
                          Cap. {scenario.orbit}: {rocketOrbitCap} kg
                        </span>
                      )}
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-slate-300">
                        Fiabilidad: {Math.round(item.reliability * 100)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pre-Launch Validation Panel (Section 6.1) */}
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/90 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white">
                Validación Pre-Lanzamiento (Sección 6.1)
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  metrics.isLaunchReady
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {metrics.isLaunchReady ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    LISTO PARA DESPEGUE
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    REVISAR REQUISITOS
                  </>
                )}
              </span>
            </div>

            {metrics.validationErrors.length > 0 ? (
              <ul className="mb-3 space-y-1 text-xs text-rose-300">
                {metrics.validationErrors.map((err, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-3 text-xs text-emerald-300">
                Todas las ecuaciones de Masa, Energía, Presupuesto, Comms y Crew están validadas.
              </p>
            )}

            <button
              type="button"
              onClick={onLaunchMission}
              disabled={!metrics.isLaunchReady}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 font-display text-sm font-bold tracking-wide text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              <Rocket className="h-4 w-4" aria-hidden="true" />
              <span>LAUNCH &amp; DISPATCH</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};
