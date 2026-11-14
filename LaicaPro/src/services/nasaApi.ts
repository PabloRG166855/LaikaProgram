import {
  DifficultyId,
  NasaApodData,
  NasaImageAsset,
  NasaNeoAsteroid,
  NasaSolarEvent,
  ProcessedNasaTelemetry,
} from '../types/mission';

const NASA_STORAGE_KEY = 'laicapro_nasa_api_key';

export function getSavedNasaApiKey(): string {
  try {
    return localStorage.getItem(NASA_STORAGE_KEY) || 'DEMO_KEY';
  } catch {
    return 'DEMO_KEY';
  }
}

export function saveNasaApiKey(key: string): string {
  const cleaned = key.trim() || 'DEMO_KEY';
  try {
    localStorage.setItem(NASA_STORAGE_KEY, cleaned);
  } catch {
    // ignore storage restriction
  }
  return cleaned;
}

function formatDateYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const FALLBACK_ASTEROIDS: NasaNeoAsteroid[] = [
  {
    id: '54498119',
    name: '(2024 YR4)',
    isPotentiallyHazardous: true,
    estimatedDiameterMaxM: 68,
    relativeVelocityKmS: 18.4,
    missDistanceKm: 412800,
    closeApproachDate: formatDateYmd(new Date()),
    kineticRiskScore: 84,
  },
  {
    id: '2099942',
    name: '99942 Apophis (Sim-Track)',
    isPotentiallyHazardous: true,
    estimatedDiameterMaxM: 370,
    relativeVelocityKmS: 12.6,
    missDistanceKm: 1840000,
    closeApproachDate: formatDateYmd(new Date()),
    kineticRiskScore: 91,
  },
  {
    id: '3840689',
    name: '(2019 AE3)',
    isPotentiallyHazardous: false,
    estimatedDiameterMaxM: 29,
    relativeVelocityKmS: 21.7,
    missDistanceKm: 924500,
    closeApproachDate: formatDateYmd(new Date()),
    kineticRiskScore: 63,
  },
  {
    id: '54421004',
    name: '(2025 BX1)',
    isPotentiallyHazardous: false,
    estimatedDiameterMaxM: 19,
    relativeVelocityKmS: 14.9,
    missDistanceKm: 560200,
    closeApproachDate: formatDateYmd(new Date()),
    kineticRiskScore: 52,
  },
];

const FALLBACK_SOLAR_EVENTS: NasaSolarEvent[] = [
  {
    id: 'FLR-FALLBACK-1',
    type: 'FLR',
    label: 'Llamarada Solar Región AR3842',
    classOrKp: 'M4.8',
    peakTime: new Date(Date.now() - 86400_000 * 2).toISOString(),
    severityFactor: 1.14,
    sourceLocation: 'S16W24',
  },
  {
    id: 'GST-FALLBACK-2',
    type: 'GST',
    label: 'Tormenta Geomagnética Planetaria',
    classOrKp: 'Kp 6.0',
    peakTime: new Date(Date.now() - 86400_000 * 4).toISOString(),
    severityFactor: 1.18,
    sourceLocation: 'Earth Magnetosphere',
  },
];

const FALLBACK_ARCHIVES: Record<DifficultyId, NasaImageAsset[]> = {
  easy: [
    {
      nasaId: 'PIA00143',
      title: 'Explorer 1 — Primer Satélite de EE. UU. (JPL)',
      description:
        'William H. Pickering, James A. Van Allen y Wernher von Braun sosteniendo la maqueta del Explorer 1 tras confirmar los cinturones de radiación en 1958.',
      imageUrl: '/assets/mission-leo.jpg',
      dateCreated: '1958-01-31',
      center: 'JPL',
    },
  ],
  medium: [
    {
      nasaId: 'GSFC_20171208_Archive_e001980',
      title: 'Lunar Reconnaissance Orbiter (LRO) — Cartografía Lunar',
      description:
        'Archivo oficial de la NASA sobre la exploración lunar y mapeo topográfico en órbita baja lunar (LLO).',
      imageUrl: '/assets/mission-lunar.jpg',
      dateCreated: '2009-06-18',
      center: 'GSFC',
    },
  ],
  hard: [
    {
      nasaId: 'GSFC_20171208_Archive_e000282',
      title: 'James Webb Space Telescope (JWST) — Punto L2',
      description:
        'El espejo primario hexagonal recubierto de oro operando en el punto de libración Sol-Tierra L2 a 1.5 millones de kilómetros.',
      imageUrl: '/assets/mission-l2.jpg',
      dateCreated: '2021-12-25',
      center: 'GSFC',
    },
  ],
};

const FALLBACK_APOD: NasaApodData = {
  title: 'Telemetría del Espacio Profundo & Campos de Radiación Orbital',
  date: formatDateYmd(new Date()),
  explanation:
    'Datos astronómicos cacheados del archivo NASA APOD. Conecta una clave personal de api.nasa.gov o restablece la red para sincronizar la imagen astronómica del día en vivo.',
  url: '/assets/mission-l2.png',
  mediaType: 'image',
};

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 6500): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchNasaNeoWs(apiKey: string): Promise<{
  status: 'LIVE_API' | 'CACHED_TELEMETRY';
  asteroids: NasaNeoAsteroid[];
}> {
  try {
    const today = new Date();
    const start = formatDateYmd(today);
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${start}&end_date=${start}&api_key=${encodeURIComponent(apiKey)}`;
    const json = await fetchJsonWithTimeout<{
      near_earth_objects?: Record<
        string,
        Array<{
          id: string;
          name: string;
          is_potentially_hazardous_asteroid: boolean;
          estimated_diameter?: { meters?: { estimated_diameter_max?: number } };
          close_approach_data?: Array<{
            close_approach_date?: string;
            relative_velocity?: { kilometers_per_second?: string };
            miss_distance?: { kilometers?: string };
          }>;
        }>
      >;
    }>(url);

    const bucket = json.near_earth_objects ? Object.values(json.near_earth_objects).flat() : [];
    if (bucket.length === 0) {
      return { status: 'CACHED_TELEMETRY', asteroids: FALLBACK_ASTEROIDS };
    }

    const processed: NasaNeoAsteroid[] = bucket
      .map((neo) => {
        const approach = neo.close_approach_data?.[0];
        const vel = Number(approach?.relative_velocity?.kilometers_per_second ?? 15);
        const dist = Number(approach?.miss_distance?.kilometers ?? 1_500_000);
        const diam = Number(neo.estimated_diameter?.meters?.estimated_diameter_max ?? 40);
        const hazardBoost = neo.is_potentially_hazardous_asteroid ? 25 : 0;
        const kineticRiskScore = Math.min(
          99,
          Math.round(hazardBoost + vel * 1.8 + Math.min(30, diam / 15))
        );
        return {
          id: neo.id,
          name: neo.name,
          isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
          estimatedDiameterMaxM: diam,
          relativeVelocityKmS: vel,
          missDistanceKm: dist,
          closeApproachDate: approach?.close_approach_date ?? start,
          kineticRiskScore,
        };
      })
      .sort((a, b) => b.kineticRiskScore - a.kineticRiskScore)
      .slice(0, 8);

    return { status: 'LIVE_API', asteroids: processed };
  } catch {
    return { status: 'CACHED_TELEMETRY', asteroids: FALLBACK_ASTEROIDS };
  }
}

async function fetchNasaDonki(apiKey: string): Promise<{
  status: 'LIVE_API' | 'CACHED_TELEMETRY';
  events: NasaSolarEvent[];
}> {
  try {
    const end = new Date();
    const start = new Date(Date.now() - 86400_000 * 14);
    const startStr = formatDateYmd(start);
    const endStr = formatDateYmd(end);

    const [flrRes, gstRes] = await Promise.allSettled([
      fetchJsonWithTimeout<
        Array<{
          flrID: string;
          classType?: string;
          peakTime?: string;
          sourceLocation?: string;
        }>
      >(
        `https://api.nasa.gov/DONKI/FLR?startDate=${startStr}&endDate=${endStr}&api_key=${encodeURIComponent(apiKey)}`
      ),
      fetchJsonWithTimeout<
        Array<{
          gstID: string;
          startTime?: string;
          allKpIndex?: Array<{ kpIndex?: number }>;
        }>
      >(
        `https://api.nasa.gov/DONKI/GST?startDate=${startStr}&endDate=${endStr}&api_key=${encodeURIComponent(apiKey)}`
      ),
    ]);

    const events: NasaSolarEvent[] = [];

    if (flrRes.status === 'fulfilled' && Array.isArray(flrRes.value)) {
      for (const flr of flrRes.value.slice(-5)) {
        const cls = flr.classType || 'C1.0';
        const isX = cls.startsWith('X');
        const isM = cls.startsWith('M');
        events.push({
          id: flr.flrID,
          type: 'FLR',
          label: `Llamarada Solar (${flr.sourceLocation || 'Disco Solar'})`,
          classOrKp: cls,
          peakTime: flr.peakTime || new Date().toISOString(),
          severityFactor: isX ? 1.28 : isM ? 1.15 : 1.05,
          sourceLocation: flr.sourceLocation || 'Sol',
        });
      }
    }

    if (gstRes.status === 'fulfilled' && Array.isArray(gstRes.value)) {
      for (const gst of gstRes.value.slice(-4)) {
        const maxKp =
          gst.allKpIndex?.reduce((m, item) => Math.max(m, item.kpIndex ?? 0), 4) ?? 5;
        events.push({
          id: gst.gstID,
          type: 'GST',
          label: 'Tormenta Geomagnética DONKI',
          classOrKp: `Kp ${maxKp.toFixed(1)}`,
          peakTime: gst.startTime || new Date().toISOString(),
          severityFactor: maxKp >= 7 ? 1.3 : maxKp >= 5 ? 1.16 : 1.06,
          sourceLocation: 'Magnetósfera Terrestre',
        });
      }
    }

    if (events.length === 0) {
      return { status: 'CACHED_TELEMETRY', events: FALLBACK_SOLAR_EVENTS };
    }

    return { status: 'LIVE_API', events: events.reverse() };
  } catch {
    return { status: 'CACHED_TELEMETRY', events: FALLBACK_SOLAR_EVENTS };
  }
}

async function fetchNasaImageArchive(
  query: string,
  fallback: NasaImageAsset[]
): Promise<{ ok: boolean; assets: NasaImageAsset[] }> {
  try {
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&page_size=4`;
    const json = await fetchJsonWithTimeout<{
      collection?: {
        items?: Array<{
          data?: Array<{
            nasa_id?: string;
            title?: string;
            description?: string;
            date_created?: string;
            center?: string;
          }>;
          links?: Array<{ href?: string; rel?: string }>;
        }>;
      };
    }>(url);

    const items = json.collection?.items ?? [];
    const mapped: NasaImageAsset[] = [];
    for (const item of items) {
      const meta = item.data?.[0];
      const thumb = item.links?.find((l) => l.href)?.href;
      if (meta?.nasa_id && thumb) {
        mapped.push({
          nasaId: meta.nasa_id,
          title: meta.title || query,
          description: (meta.description || '').slice(0, 260),
          imageUrl: thumb,
          dateCreated: (meta.date_created || '').slice(0, 10),
          center: meta.center || 'NASA',
        });
      }
    }
    if (mapped.length > 0) {
      return { ok: true, assets: mapped };
    }
    return { ok: false, assets: fallback };
  } catch {
    return { ok: false, assets: fallback };
  }
}

async function fetchNasaApod(apiKey: string): Promise<{
  status: 'LIVE_API' | 'CACHED_TELEMETRY';
  apod: NasaApodData;
}> {
  try {
    const url = `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(apiKey)}`;
    const json = await fetchJsonWithTimeout<{
      title?: string;
      date?: string;
      explanation?: string;
      url?: string;
      media_type?: string;
    }>(url);

    if (json.title && json.url) {
      return {
        status: 'LIVE_API',
        apod: {
          title: json.title,
          date: json.date || formatDateYmd(new Date()),
          explanation: json.explanation || '',
          url: json.url,
          mediaType: json.media_type || 'image',
        },
      };
    }
    return { status: 'CACHED_TELEMETRY', apod: FALLBACK_APOD };
  } catch {
    return { status: 'CACHED_TELEMETRY', apod: FALLBACK_APOD };
  }
}

export async function fetchAndProcessNasaApis(
  customApiKey?: string
): Promise<ProcessedNasaTelemetry> {
  const apiKey = customApiKey?.trim() || getSavedNasaApiKey();

  const [neoRes, donkiRes, imgEasy, imgMed, imgHard, apodRes] = await Promise.all([
    fetchNasaNeoWs(apiKey),
    fetchNasaDonki(apiKey),
    fetchNasaImageArchive('Explorer 1 JPL', FALLBACK_ARCHIVES.easy),
    fetchNasaImageArchive('Lunar Reconnaissance Orbiter', FALLBACK_ARCHIVES.medium),
    fetchNasaImageArchive('James Webb Space Telescope', FALLBACK_ARCHIVES.hard),
    fetchNasaApod(apiKey),
  ]);

  const maxSolarFactor = donkiRes.events.reduce(
    (max, ev) => Math.max(max, ev.severityFactor),
    1.0
  );
  const spaceWeatherRiskMultiplier = Number(Math.min(1.35, maxSolarFactor).toFixed(2));
  const spaceWeatherLevel =
    spaceWeatherRiskMultiplier >= 1.22
      ? 'TORMENTA SOLAR'
      : spaceWeatherRiskMultiplier >= 1.1
      ? 'MODERADO'
      : 'CALMO';

  const imagesLive = imgEasy.ok || imgMed.ok || imgHard.ok;
  const anyLive =
    neoRes.status === 'LIVE_API' ||
    donkiRes.status === 'LIVE_API' ||
    imagesLive ||
    apodRes.status === 'LIVE_API';

  return {
    lastUpdatedIso: new Date().toISOString(),
    apiKeyUsed: apiKey,
    overallStatus: anyLive ? 'LIVE_API' : 'CACHED_TELEMETRY',
    endpoints: {
      neows: neoRes.status,
      donki: donkiRes.status,
      images: imagesLive ? 'LIVE_API' : 'CACHED_TELEMETRY',
      apod: apodRes.status,
    },
    asteroids: neoRes.asteroids,
    solarEvents: donkiRes.events,
    spaceWeatherRiskMultiplier,
    spaceWeatherLevel,
    missionArchives: {
      easy: imgEasy.assets,
      medium: imgMed.assets,
      hard: imgHard.assets,
    },
    apod: apodRes.apod,
  };
}

export function getInitialCachedTelemetry(apiKey = getSavedNasaApiKey()): ProcessedNasaTelemetry {
  return {
    lastUpdatedIso: new Date().toISOString(),
    apiKeyUsed: apiKey,
    overallStatus: 'LOADING',
    endpoints: {
      neows: 'LOADING',
      donki: 'LOADING',
      images: 'LOADING',
      apod: 'LOADING',
    },
    asteroids: FALLBACK_ASTEROIDS,
    solarEvents: FALLBACK_SOLAR_EVENTS,
    spaceWeatherRiskMultiplier: 1.15,
    spaceWeatherLevel: 'MODERADO',
    missionArchives: FALLBACK_ARCHIVES,
    apod: FALLBACK_APOD,
  };
}
