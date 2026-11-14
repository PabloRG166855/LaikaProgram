import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  DollarSign,
  Flame,
  Orbit,
  Radio,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { MISSION_SCENARIOS } from '../data/missionCatalog';
import { MissionScenario, ProcessedNasaTelemetry } from '../types/mission';

interface MissionSelectViewProps {
  nasaTelemetry: ProcessedNasaTelemetry;
  onSelectScenario: (scenario: MissionScenario) => void;
}

export const MissionSelectView: React.FC<MissionSelectViewProps> = ({
  nasaTelemetry,
  onSelectScenario,
}) => {
  const topAsteroid = nasaTelemetry.asteroids[0];
  const topSolar = nasaTelemetry.solarEvents[0];

  const badgeStyle = (id: MissionScenario['id']) => {
    if (id === 'easy') {
      return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300';
    }
    if (id === 'medium') {
      return 'border-amber-500/40 bg-amber-500/15 text-amber-300';
    }
    return 'border-rose-500/40 bg-rose-500/15 text-rose-300';
  };

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      {/* Hero Banner */}
      <section className="relative mb-8 overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#081023] p-6 sm:p-8">
        <div className="bg-telemetry-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>USER SEGMENT · EXPEDIENTES HISTÓRICOS &amp; TRADE-OFFS DE INGENIERÍA</span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Diseña la nave, contrata tu equipo MDL y sobrevive al despacho en tiempo real.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Cada misión espacial es un equilibrio extremo entre{' '}
              <strong className="text-cyan-300">Masa, Energía, Presupuesto, Datos, Comunicaciones y Tiempo</strong>.
              Elige un escenario histórico: tu presupuesto inicial financia tanto los 4 operadores del{' '}
              <em>Mission Design Lab</em> como el satélite y cohete de lanzamiento.
            </p>
          </div>

          {/* Live NASA Space Weather & NEO Feed Summary */}
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/85 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono-telemetry text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                Telemetría Espacial NASA Procesada
              </span>
              <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono-telemetry text-[11px] font-semibold text-amber-300">
                Clima: {nasaTelemetry.spaceWeatherLevel}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-slate-200">
                    NEO Tracked: {topAsteroid?.name || '2024 YR4'}
                  </p>
                  <p className="font-mono-telemetry text-[11px] text-slate-400">
                    {topAsteroid
                      ? `${topAsteroid.relativeVelocityKmS.toFixed(1)} km/s · Ø ~${Math.round(topAsteroid.estimatedDiameterMaxM)} m · Riesgo ${topAsteroid.kineticRiskScore}/100`
                      : 'Sincronizando NeoWs...'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
                <Flame className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-slate-200">
                    DONKI: {topSolar?.label || 'Actividad Solar'} ({topSolar?.classOrKp || 'M-Class'})
                  </p>
                  <p className="font-mono-telemetry text-[11px] text-slate-400">
                    Factor de amenaza orbital: {nasaTelemetry.spaceWeatherRiskMultiplier}x
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Mission Scenario Cards */}
      <section aria-label="Selector de Expedientes Históricos">
        <div className="grid gap-6 lg:grid-cols-3">
          {MISSION_SCENARIOS.map((scenario) => (
            <article
              key={scenario.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#091124] transition hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-950/40"
            >
              {/* Artwork */}
              <div className="relative aspect-video overflow-hidden border-b border-slate-800 bg-slate-950">
                <img
                  src={scenario.coverImage}
                  alt={`Ilustración de misión ${scenario.title}`}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#091124] via-transparent to-black/30" />
                <div className="absolute left-3 top-3 flex items-center gap-2">
                  <span
                    className={`rounded-md border px-2.5 py-0.5 font-mono-telemetry text-xs font-bold ${badgeStyle(scenario.id)}`}
                  >
                    NIVEL {scenario.levelNumber} · {scenario.difficultyLabel}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <h2 className="font-display text-xl font-bold text-white">{scenario.title}</h2>
                    <p className="text-xs font-medium text-cyan-300">{scenario.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div className="space-y-4">
                  <p className="text-xs leading-relaxed text-slate-300">
                    {scenario.historicalContext}
                  </p>

                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                      Objetivo User Segment
                    </p>
                    <p className="mt-1 text-xs text-slate-200">{scenario.userSegmentObjective}</p>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                        Presupuesto
                      </span>
                      <p className="mt-0.5 font-mono-telemetry text-sm font-bold text-white">
                        ${scenario.initialBudgetM}M USD
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                        Ventana Operativa
                      </span>
                      <p className="mt-0.5 font-mono-telemetry text-sm font-bold text-white">
                        {scenario.durationSec} seg
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Orbit className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                        Órbita GMAT
                      </span>
                      <p className="mt-0.5 font-mono-telemetry text-xs font-semibold text-slate-100">
                        {scenario.orbit} ({scenario.orbitAltitude})
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Radio className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                        Comms Mínimo
                      </span>
                      <p className="mt-0.5 font-mono-telemetry text-xs font-semibold text-slate-100">
                        {scenario.requiredMinCommsKbps} kbps
                      </p>
                    </div>
                  </div>

                  {/* Tags & Real Ref */}
                  <div className="space-y-2 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                      <span>
                        Ref. Debriefing:{' '}
                        <strong className="text-white">{scenario.realMissionReference.name}</strong>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {scenario.nasaResourceTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono-telemetry text-[10px] text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectScenario(scenario)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
                >
                  <span>Abrir Laboratorio MDL</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};
