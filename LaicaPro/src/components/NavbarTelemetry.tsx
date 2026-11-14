import React from 'react';
import {
  BookOpen,
  Cpu,
  Orbit,
  Radio,
  Rocket,
  Satellite,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { AppView, MissionScenario, ProcessedNasaTelemetry } from '../types/mission';

interface NavbarTelemetryProps {
  currentView: AppView;
  selectedScenario: MissionScenario | null;
  nasaTelemetry: ProcessedNasaTelemetry;
  onNavigate: (view: AppView) => void;
  onOpenApiModal: () => void;
  onOpenResourcesModal: () => void;
}

export const NavbarTelemetry: React.FC<NavbarTelemetryProps> = ({
  currentView,
  selectedScenario,
  nasaTelemetry,
  onNavigate,
  onOpenApiModal,
  onOpenResourcesModal,
}) => {
  const statusBadge = () => {
    if (nasaTelemetry.overallStatus === 'LOADING') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          <span>Sincronizando NASA APIs</span>
        </span>
      );
    }
    if (nasaTelemetry.overallStatus === 'LIVE_API') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
          <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
          <span>NASA APIs: LIVE</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
        <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Telemetría Caché NASA</span>
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 border-b border-cyan-500/25 bg-[#060b18]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/15 text-cyan-300 shadow-inner shadow-cyan-500/20">
            <Satellite className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-bold tracking-wide text-white sm:text-lg">
                LaicaPro // MDL DISPATCH
              </span>
              <span className="hidden rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono-telemetry text-[10px] font-semibold uppercase tracking-wider text-amber-300 sm:inline-block">
                NASA Space Apps 2026
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Space Mission Design Game · Trade-Offs &amp; Control Táctico 2D
            </p>
          </div>
        </div>

        {/* Stepper de los 4 Segmentos */}
        <nav aria-label="Flujo de diseño de misión" className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onNavigate('select')}
            disabled={currentView === 'dispatch'}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              currentView === 'select'
                ? 'border border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                : 'border border-slate-700/70 bg-slate-900/70 text-slate-300 hover:border-cyan-500/40 hover:text-white disabled:opacity-40'
            }`}
          >
            <Orbit className="h-3.5 w-3.5" aria-hidden="true" />
            <span>1. User Segment</span>
          </button>

          <button
            type="button"
            onClick={() => selectedScenario && onNavigate('builder')}
            disabled={!selectedScenario || currentView === 'dispatch'}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              currentView === 'builder'
                ? 'border border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                : 'border border-slate-700/70 bg-slate-900/70 text-slate-300 hover:border-cyan-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
            <span>2. MDL Hangar (Space/Launch)</span>
          </button>

          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
              currentView === 'dispatch'
                ? 'border border-emerald-400/60 bg-emerald-500/20 text-emerald-200'
                : 'border border-slate-800 bg-slate-900/40 text-slate-500'
            }`}
          >
            <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
            <span>3. Consola Dispatch</span>
          </span>
        </nav>

        {/* Actions: NASA APIs & 9 Recursos */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenApiModal}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/90 px-2.5 py-1.5 text-xs transition hover:border-cyan-400/50 hover:bg-slate-800"
            title="Ver telemetría procesada de APIs de la NASA (NeoWs, DONKI, Images, APOD)"
          >
            {statusBadge()}
            <Radio className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onOpenResourcesModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/35 bg-cyan-950/40 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-900/50"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden md:inline">9 Recursos NASA</span>
            <span className="md:hidden">Recursos</span>
          </button>
        </div>
      </div>
    </header>
  );
};
