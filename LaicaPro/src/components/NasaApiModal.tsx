import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Flame,
  Image as ImageIcon,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { ProcessedNasaTelemetry } from '../types/mission';
import { NativeDialog } from './NativeDialog';

interface NasaApiModalProps {
  open: boolean;
  onClose: () => void;
  telemetry: ProcessedNasaTelemetry;
  isRefreshing: boolean;
  onRefresh: (newApiKey?: string) => void;
}

export const NasaApiModal: React.FC<NasaApiModalProps> = ({
  open,
  onClose,
  telemetry,
  isRefreshing,
  onRefresh,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(telemetry.apiKeyUsed);

  const renderEndpointPill = (name: string, status: ProcessedNasaTelemetry['endpoints']['neows']) => {
    const live = status === 'LIVE_API';
    return (
      <div
        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
          live
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
            : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
        }`}
      >
        <span className="font-mono-telemetry font-semibold">{name}</span>
        <span className="inline-flex items-center gap-1">
          {live ? (
            <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>{live ? 'LIVE' : status === 'LOADING' ? 'SYNC' : 'CACHÉ'}</span>
        </span>
      </div>
    );
  };

  return (
    <NativeDialog open={open} onClose={onClose} labelledBy="nasa-api-modal-title" lightDismiss>
      <div className="flex max-h-[88dvh] flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Activity className="h-5 w-5 text-cyan-400" aria-hidden="true" />
            <div>
              <h2 id="nasa-api-modal-title" className="font-display text-lg font-bold text-white">
                Centro de Procesamiento de APIs NASA en Vivo
              </h2>
              <p className="text-xs text-slate-400">
                Datos reales de NeoWs, DONKI Space Weather, NASA Images Library y APOD inyectados en la simulación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar inspector de APIs NASA"
            className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 transition hover:border-cyan-500/50 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="telemetry-scroll space-y-6 overflow-y-auto p-6">
          {/* API Key Config + Endpoints Status */}
          <div className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4 lg:grid-cols-2">
            <div>
              <label
                htmlFor="nasa-api-key-input"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-300"
              >
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                NASA Open API Key (DEMO_KEY o llave personal)
              </label>
              <div className="flex gap-2">
                <input
                  id="nasa-api-key-input"
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="DEMO_KEY"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono-telemetry text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => onRefresh(apiKeyInput)}
                  disabled={isRefreshing}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-500/50 bg-cyan-500/20 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/30 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>Procesar</span>
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Última sincronización:{' '}
                <span className="font-mono-telemetry text-slate-300">
                  {new Date(telemetry.lastUpdatedIso).toLocaleTimeString()}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {renderEndpointPill('NeoWs (Asteroides)', telemetry.endpoints.neows)}
              {renderEndpointPill('DONKI (Clima Solar)', telemetry.endpoints.donki)}
              {renderEndpointPill('NASA Images API', telemetry.endpoints.images)}
              {renderEndpointPill('APOD (Astronomía)', telemetry.endpoints.apod)}
            </div>
          </div>

          {/* Processed Space Weather Multiplier */}
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-display text-sm font-bold text-amber-300">
                  <Flame className="h-4 w-4" aria-hidden="true" />
                  NASA DONKI — Clima Espacial Procesado
                </h3>
                <span className="rounded border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 font-mono-telemetry text-xs font-semibold text-amber-200">
                  Riesgo: {telemetry.spaceWeatherLevel} ({telemetry.spaceWeatherRiskMultiplier}x)
                </span>
              </div>
              <p className="mb-3 text-xs text-slate-400">
                Las llamaradas solares (FLR) y tormentas geomagnéticas (GST) calculan el multiplicador de riesgo orbital e inyectan alertas reales en la consola Dispatch.
              </p>
              <ul className="space-y-2">
                {telemetry.solarEvents.slice(0, 4).map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-200">{ev.label}</p>
                      <p className="text-[11px] text-slate-400">
                        Fuente: {ev.sourceLocation} · {ev.peakTime.slice(0, 10)}
                      </p>
                    </div>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono-telemetry font-bold text-amber-300">
                      {ev.classOrKp}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* NeoWs Asteroids */}
            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-display text-sm font-bold text-rose-300">
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  NASA NeoWs — Objetos Cercanos (Asteroides)
                </h3>
                <span className="font-mono-telemetry text-xs text-slate-400">
                  Top {telemetry.asteroids.length} procesados
                </span>
              </div>
              <p className="mb-3 text-xs text-slate-400">
                Cada objeto procesa velocidad relativa (km/s), diámetro estimado y riesgo cinético para generar emergencias de evasión del Matemático.
              </p>
              <div className="space-y-2">
                {telemetry.asteroids.slice(0, 4).map((ast) => (
                  <div
                    key={ast.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="flex items-center gap-1.5 font-semibold text-slate-100">
                        {ast.isPotentiallyHazardous && (
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                        )}
                        <span>{ast.name}</span>
                      </p>
                      <p className="font-mono-telemetry text-[11px] text-slate-400">
                        Vel: {ast.relativeVelocityKmS.toFixed(1)} km/s · Ø ~
                        {Math.round(ast.estimatedDiameterMaxM)} m
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 font-mono-telemetry text-[11px] font-bold ${
                        ast.kineticRiskScore >= 75
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      Riesgo {ast.kineticRiskScore}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* APOD + NASA Images */}
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-cyan-300">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                NASA APOD — Imagen Astronómica del Día
              </h3>
              <div className="flex gap-3">
                {telemetry.apod.mediaType === 'image' && (
                  <img
                    src={telemetry.apod.url}
                    alt={telemetry.apod.title}
                    className="h-24 w-32 shrink-0 rounded-lg border border-slate-700 object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white">{telemetry.apod.title}</p>
                  <p className="font-mono-telemetry text-[11px] text-cyan-400">
                    {telemetry.apod.date}
                  </p>
                  <p className="mt-1 line-clamp-3 text-xs text-slate-300">
                    {telemetry.apod.explanation}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-emerald-300">
                <ImageIcon className="h-4 w-4" aria-hidden="true" />
                NASA Image Library — Archivo Histórico Cargado
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((lvl) => {
                  const asset = telemetry.missionArchives[lvl][0];
                  return (
                    <div
                      key={lvl}
                      className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950"
                    >
                      <img
                        src={asset?.imageUrl}
                        alt={asset?.title || lvl}
                        className="h-16 w-full object-cover"
                      />
                      <p className="truncate px-1.5 py-1 text-[10px] font-medium text-slate-300">
                        {asset?.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-800 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            Cerrar Inspector
          </button>
        </div>
      </div>
    </NativeDialog>
  );
};
