import React from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Cpu,
  History,
  RotateCcw,
  SlidersHorizontal,
  Users,
  XCircle,
} from 'lucide-react';
import { NASA_OFFICIAL_RESOURCES } from '../data/missionCatalog';
import { generateCauseAndEffectDiagnosis } from '../services/missionEngine';
import { MissionRunResult, ProcessedNasaTelemetry } from '../types/mission';
import { NativeDialog } from './NativeDialog';

interface DebriefingModalProps {
  result: MissionRunResult | null;
  nasaTelemetry: ProcessedNasaTelemetry;
  onRetryMission: () => void;
  onBackToBuilder: () => void;
  onBackToSelect: () => void;
}

export const DebriefingModal: React.FC<DebriefingModalProps> = ({
  result,
  nasaTelemetry,
  onRetryMission,
  onBackToBuilder,
  onBackToSelect,
}) => {
  if (!result) {
    return null;
  }

  const diagnosis = generateCauseAndEffectDiagnosis(result);
  const archiveAsset = nasaTelemetry.missionArchives[result.scenario.id]?.[0];
  const realRef = result.scenario.realMissionReference;

  const cmlColors: Record<number, string> = {
    4: 'border-emerald-400 bg-emerald-500/15 text-emerald-300',
    3: 'border-cyan-400 bg-cyan-500/15 text-cyan-300',
    2: 'border-amber-400 bg-amber-500/15 text-amber-300',
    1: 'border-rose-500 bg-rose-500/15 text-rose-300',
  };

  return (
    <NativeDialog
      open={Boolean(result)}
      onClose={onBackToBuilder}
      labelledBy="debriefing-modal-title"
      lightDismiss={false}
    >
      <div className="flex max-h-[90dvh] flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-6 py-4">
          <div>
            <span className="font-mono-telemetry text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              Expediente Post-Misión · Concept Maturity Level (CML)
            </span>
            <h2 id="debriefing-modal-title" className="font-display text-xl font-bold text-white">
              Debriefing: {result.scenario.title}
            </h2>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 font-mono-telemetry text-sm font-bold ${
              cmlColors[result.cmlLevel]
            }`}
          >
            <Award className="h-4 w-4" aria-hidden="true" />
            <span>{result.cmlTitle}</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="telemetry-scroll space-y-6 overflow-y-auto p-6">
          {/* Score Breakdown (Section 6.4 exact formula) */}
          <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-sm font-bold text-white">
                Cálculo Oficial de Puntaje CML (Sección 6.4)
              </h3>
              <span className="font-mono-telemetry text-2xl font-bold text-cyan-300">
                {result.scoreFinal} PTS
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-4">
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
                <p className="text-slate-400">Misiones Objetivo ({result.objectivesCompleted} × 250)</p>
                <p className="mt-0.5 font-mono-telemetry text-sm font-bold text-emerald-300">
                  +{result.objectivesCompleted * 250}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
                <p className="text-slate-400">
                  Datos Transmitidos ({Math.round(result.dataTransmittedGB)} GB × 10)
                </p>
                <p className="mt-0.5 font-mono-telemetry text-sm font-bold text-cyan-300">
                  +{Math.round(result.dataTransmittedGB) * 10}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
                <p className="text-slate-400">
                  Integridad Nave ({Math.round(result.finalIntegrityPct)}% × 5)
                </p>
                <p className="mt-0.5 font-mono-telemetry text-sm font-bold text-slate-100">
                  +{Math.round(result.finalIntegrityPct) * 5}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
                <p className="text-slate-400">
                  Emergencias Falladas ({result.emergenciesFailed} × 150)
                </p>
                <p className="mt-0.5 font-mono-telemetry text-sm font-bold text-rose-400">
                  -{result.emergenciesFailed * 150}
                </p>
              </div>
            </div>
          </section>

          {/* Diagnosis: The "Why" (Cause & Effect) */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <h3 className="font-display text-base font-bold text-white">
              Diagnóstico Técnico: El &ldquo;Porqué&rdquo; (Causa y Efecto)
            </h3>
            <p className="mt-1 text-xs font-medium text-cyan-200">{diagnosis.headline}</p>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="space-y-2.5">
                <h4 className="flex items-center gap-1.5 font-mono-telemetry text-xs font-bold uppercase tracking-wider text-cyan-300">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  1. Desempeño del Crew
                </h4>
                {diagnosis.crewInsights.map((ins, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-3 text-xs ${
                      ins.status === 'positive'
                        ? 'border-emerald-500/30 bg-emerald-950/20'
                        : ins.status === 'warning'
                        ? 'border-amber-500/30 bg-amber-950/20'
                        : 'border-rose-500/35 bg-rose-950/25'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      {ins.status === 'positive' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                      ) : ins.status === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
                      )}
                      <span>{ins.title}</span>
                    </div>
                    <p className="mt-1.5 leading-relaxed text-slate-300">{ins.detail}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                <h4 className="flex items-center gap-1.5 font-mono-telemetry text-xs font-bold uppercase tracking-wider text-amber-300">
                  <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
                  2. Análisis de Trade-offs de Sistemas
                </h4>
                {diagnosis.systemInsights.map((ins, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-3 text-xs ${
                      ins.status === 'positive'
                        ? 'border-emerald-500/30 bg-emerald-950/20'
                        : ins.status === 'warning'
                        ? 'border-amber-500/30 bg-amber-950/20'
                        : 'border-rose-500/35 bg-rose-950/25'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      {ins.status === 'positive' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                      ) : ins.status === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
                      )}
                      <span>{ins.title}</span>
                    </div>
                    <p className="mt-1.5 leading-relaxed text-slate-300">{ins.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Real NASA Historical Comparison */}
          <section className="rounded-xl border border-cyan-500/25 bg-[#060d1f] p-4">
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              <h3 className="font-display text-base font-bold text-white">
                Comparativa con Misión Real de la NASA: {realRef.name}
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                <img
                  src={archiveAsset?.imageUrl || result.scenario.coverImage}
                  alt={archiveAsset?.title || realRef.name}
                  className="h-36 w-full object-cover"
                />
                <div className="p-2.5 text-[11px]">
                  <p className="font-semibold text-cyan-300">
                    {archiveAsset?.title || realRef.name}
                  </p>
                  <p className="font-mono-telemetry text-[10px] text-slate-400">
                    Archivo NASA · {archiveAsset?.center || realRef.agency} (
                    {archiveAsset?.dateCreated || realRef.year})
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs leading-relaxed text-slate-300">{realRef.summary}</p>

                <div className="overflow-hidden rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 font-mono-telemetry text-[11px] text-slate-400">
                      <tr>
                        <th className="px-3 py-2">Parámetro</th>
                        <th className="px-3 py-2 text-cyan-300">Tu Diseño LaicaPro</th>
                        <th className="px-3 py-2 text-amber-300">Misión Real NASA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono-telemetry text-[11px]">
                      <tr>
                        <td className="px-3 py-2 text-slate-400">Órbita</td>
                        <td className="px-3 py-2 text-slate-100">{result.scenario.orbit}</td>
                        <td className="px-3 py-2 text-slate-200">{realRef.orbit}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-slate-400">Masa Total</td>
                        <td className="px-3 py-2 text-slate-100">{result.metrics.totalMassKg} kg</td>
                        <td className="px-3 py-2 text-slate-200">{realRef.massKg} kg</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-slate-400">Potencia Generada</td>
                        <td className="px-3 py-2 text-slate-100">{result.metrics.powerGeneratedW} W</td>
                        <td className="px-3 py-2 text-slate-200">{realRef.powerW} W</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-slate-400">Presupuesto / Costo</td>
                        <td className="px-3 py-2 text-slate-100">
                          ${result.metrics.totalCostM}M / ${result.scenario.initialBudgetM}M
                        </td>
                        <td className="px-3 py-2 text-slate-200">{realRef.costNote}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <ul className="space-y-1 text-xs text-slate-300">
                  {realRef.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Cpu className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* NASA Data & Official Resources Used (9 Official Resources) */}
          <section className="rounded-xl border border-slate-800 bg-slate-950/75 p-4">
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-white">
              <BookOpen className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              NASA Data &amp; Official Resources Used (9 Recursos Oficiales)
            </h3>
            <div className="grid gap-2 sm:grid-cols-3">
              {NASA_OFFICIAL_RESOURCES.map((res) => (
                <div
                  key={res.id}
                  className="rounded-lg border border-slate-800/90 bg-slate-900/60 p-2.5 text-[11px]"
                >
                  <p className="font-mono-telemetry text-[10px] font-bold text-cyan-300">
                    #{res.id} · {res.category}
                  </p>
                  <p className="font-semibold text-white">{res.name}</p>
                  <p className="mt-0.5 text-slate-400">{res.roleInGame}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 px-6 py-4">
          <button
            type="button"
            onClick={onBackToSelect}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:text-white"
          >
            Elegir Otro Expediente
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onBackToBuilder}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-500/25"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ajustar Diseño en MDL</span>
            </button>
            <button
              type="button"
              onClick={onRetryMission}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Relanzar Misión</span>
            </button>
          </div>
        </div>
      </div>
    </NativeDialog>
  );
};
