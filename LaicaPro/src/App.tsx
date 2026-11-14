import { useCallback, useEffect, useMemo, useState } from 'react';
import { DebriefingModal } from './components/DebriefingModal';
import { DispatchConsoleView } from './components/DispatchConsoleView';
import { MDLBuilderView } from './components/MDLBuilderView';
import { MissionSelectView } from './components/MissionSelectView';
import { NasaApiModal } from './components/NasaApiModal';
import { NasaResourcesModal } from './components/NasaResourcesModal';
import { NavbarTelemetry } from './components/NavbarTelemetry';
import {
  CREW_CANDIDATES,
  MISSION_SCENARIOS,
  RECOMMENDED_PRESETS,
} from './data/missionCatalog';
import { computeMissionMetrics } from './services/missionEngine';
import {
  fetchAndProcessNasaApis,
  getInitialCachedTelemetry,
  saveNasaApiKey,
} from './services/nasaApi';
import {
  AppView,
  CrewCandidate,
  MissionRunResult,
  MissionScenario,
  ProcessedNasaTelemetry,
  SpacecraftConfig,
} from './types/mission';

function createEmptyConfig(): SpacecraftConfig {
  return {
    chassisId: 'chassis-12u',
    payloadIds: ['pay-geiger'],
    powerId: 'pwr-gaas-deploy',
    commsId: 'com-sband',
    rocketId: 'rkt-falcon',
  };
}

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('select');
  const [selectedScenario, setSelectedScenario] = useState<MissionScenario>(MISSION_SCENARIOS[0]);
  const [selectedCrew, setSelectedCrew] = useState<CrewCandidate[]>(() => {
    const preset = RECOMMENDED_PRESETS.easy;
    return preset.crewIds
      .map((id) => CREW_CANDIDATES.find((c) => c.id === id))
      .filter((c): c is CrewCandidate => Boolean(c));
  });
  const [config, setConfig] = useState<SpacecraftConfig>(() => ({
    ...RECOMMENDED_PRESETS.easy.config,
  }));

  const [nasaTelemetry, setNasaTelemetry] = useState<ProcessedNasaTelemetry>(() =>
    getInitialCachedTelemetry()
  );
  const [isRefreshingApi, setIsRefreshingApi] = useState(false);

  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [resourcesModalOpen, setResourcesModalOpen] = useState(false);
  const [missionResult, setMissionResult] = useState<MissionRunResult | null>(null);
  const [dispatchKey, setDispatchKey] = useState(1);

  const refreshNasaApis = useCallback(async (newKey?: string) => {
    setIsRefreshingApi(true);
    try {
      const effectiveKey = newKey !== undefined ? saveNasaApiKey(newKey) : undefined;
      const processed = await fetchAndProcessNasaApis(effectiveKey);
      setNasaTelemetry(processed);
    } finally {
      setIsRefreshingApi(false);
    }
  }, []);

  useEffect(() => {
    void refreshNasaApis();
  }, [refreshNasaApis]);

  const metrics = useMemo(
    () => computeMissionMetrics(selectedScenario, selectedCrew, config),
    [selectedScenario, selectedCrew, config]
  );

  const handleSelectScenario = (scenario: MissionScenario) => {
    setSelectedScenario(scenario);
    const preset = RECOMMENDED_PRESETS[scenario.id];
    const presetCrew = preset.crewIds
      .map((id) => CREW_CANDIDATES.find((c) => c.id === id))
      .filter((c): c is CrewCandidate => Boolean(c));
    setSelectedCrew(presetCrew);
    setConfig({ ...preset.config });
    setMissionResult(null);
    setCurrentView('builder');
  };

  const handleLaunchMission = () => {
    if (!metrics.isLaunchReady) return;
    setMissionResult(null);
    setDispatchKey((k) => k + 1);
    setCurrentView('dispatch');
  };

  const handleRetryMission = () => {
    setMissionResult(null);
    setDispatchKey((k) => k + 1);
    setCurrentView('dispatch');
  };

  const handleBackToBuilder = () => {
    setMissionResult(null);
    setCurrentView('builder');
  };

  const handleBackToSelect = () => {
    setMissionResult(null);
    setCurrentView('select');
  };

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100">
      <NavbarTelemetry
        currentView={currentView}
        selectedScenario={selectedScenario}
        nasaTelemetry={nasaTelemetry}
        onNavigate={(view) => {
          if (view !== 'dispatch') setCurrentView(view);
        }}
        onOpenApiModal={() => setApiModalOpen(true)}
        onOpenResourcesModal={() => setResourcesModalOpen(true)}
      />

      {currentView === 'select' && (
        <MissionSelectView
          nasaTelemetry={nasaTelemetry}
          onSelectScenario={handleSelectScenario}
        />
      )}

      {currentView === 'builder' && (
        <MDLBuilderView
          scenario={selectedScenario}
          selectedCrew={selectedCrew}
          config={config || createEmptyConfig()}
          nasaTelemetry={nasaTelemetry}
          onChangeCrew={setSelectedCrew}
          onChangeConfig={setConfig}
          onLaunchMission={handleLaunchMission}
          onBackToSelect={handleBackToSelect}
        />
      )}

      {currentView === 'dispatch' && (
        <DispatchConsoleView
          key={dispatchKey}
          scenario={selectedScenario}
          initialCrew={selectedCrew}
          config={config}
          metrics={metrics}
          nasaTelemetry={nasaTelemetry}
          onMissionComplete={(res) => setMissionResult(res)}
          onAbortToBuilder={handleBackToBuilder}
        />
      )}

      <DebriefingModal
        result={missionResult}
        nasaTelemetry={nasaTelemetry}
        onRetryMission={handleRetryMission}
        onBackToBuilder={handleBackToBuilder}
        onBackToSelect={handleBackToSelect}
      />

      <NasaApiModal
        open={apiModalOpen}
        onClose={() => setApiModalOpen(false)}
        telemetry={nasaTelemetry}
        isRefreshing={isRefreshingApi}
        onRefresh={(k) => void refreshNasaApis(k)}
      />

      <NasaResourcesModal
        open={resourcesModalOpen}
        onClose={() => setResourcesModalOpen(false)}
      />
    </div>
  );
}

export default App;
