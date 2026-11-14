import React from 'react';
import { BookOpen, CheckCircle2, X } from 'lucide-react';
import { NASA_OFFICIAL_RESOURCES } from '../data/missionCatalog';
import { NativeDialog } from './NativeDialog';

interface NasaResourcesModalProps {
  open: boolean;
  onClose: () => void;
}

export const NasaResourcesModal: React.FC<NasaResourcesModalProps> = ({ open, onClose }) => {
  return (
    <NativeDialog open={open} onClose={onClose} labelledBy="nasa-resources-title" lightDismiss>
      <div className="flex max-h-[88dvh] flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-cyan-400" aria-hidden="true" />
            <div>
              <h2 id="nasa-resources-title" className="font-display text-lg font-bold text-white">
                Los 9 Recursos Oficiales de la NASA Integrados
              </h2>
              <p className="text-xs text-slate-400">
                Trazabilidad directa entre la documentación del reto NASA Space Apps 2026 y las mecánicas de LaicaPro
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar recursos oficiales"
            className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 transition hover:border-cyan-500/50 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="telemetry-scroll grid gap-3 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3">
          {NASA_OFFICIAL_RESOURCES.map((res) => (
            <article
              key={res.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/75 p-4"
            >
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 font-mono-telemetry text-[11px] font-bold text-cyan-300">
                    RECURSO #{res.id}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Integrado
                  </span>
                </div>
                <h3 className="font-display text-sm font-bold text-white">{res.name}</h3>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                  {res.category}
                </p>
                <p className="mt-2 text-xs font-medium text-cyan-100">{res.roleInGame}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{res.details}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="flex justify-end border-t border-slate-800 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            Entendido
          </button>
        </div>
      </div>
    </NativeDialog>
  );
};
