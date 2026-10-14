/** Deterministic educational model. No field readings, survey depths or tide forecast. */
export type EnvironmentWeather = 'clear' | 'cloudy' | 'light-rain' | 'monsoon' | 'wind' | 'storm';
export type EnvironmentTide = 'high' | 'low' | 'rising' | 'falling' | 'manual';
export type EnvironmentPreset = 'calm' | 'rain' | 'low-tide' | 'high-tide' | 'storm';
export type EnvironmentLayer = 'observed' | 'depth' | 'salinity' | 'temperature';
export type EnvironmentControls = {
  weather: EnvironmentWeather;
  tideMode: EnvironmentTide;
  tideOffset: number;
  timeOfDay: number;
  freshwaterInflow: number;
  seawaterExchange: number;
  currentSpeed: number;
  currentDirection: number;
  windDirection: number;
  seaSalinity: number;
  freshwaterTemperature: number;
  seaTemperature: number;
  cageDepth: number;
  thresholds: { salinityMin: number; salinityMax: number; tempMax: number; clearanceMin: number };
};
export type EnvironmentZone = { salinity: number; temperature: number };
export type WeatherReadout = { airTemp: number; rain: number; wind: number; windDirection: number; cloud: number; irradiance: number; solarPower: number };
export type EnvironmentHistory = WeatherReadout & {
  minute: number; waterLevel: number;
  aSalinity: number; bSalinity: number; cSalinity: number;
  aTemperature: number; bTemperature: number; cTemperature: number;
};
export type EnvironmentState = EnvironmentControls & {
  enabled: boolean;
  layer: EnvironmentLayer;
  inspection: boolean;
  showCurrents: boolean;
  inspectPoint: [number, number];
  zones: { A: EnvironmentZone; B: EnvironmentZone; C: EnvironmentZone };
  history: EnvironmentHistory[];
};
export type EnvironmentReadout = WeatherReadout & {
  waterLevel: number; timeOfDay: number;
  seabedElevation: number; depth: number; localDepth: number; cageClearance: number;
  weather: WeatherReadout;
};

export const VERTICAL_SCALE = .25;
export const WATER_DATUM = -.115;
export const ENVIRONMENT_VOLUMES = { A: 10000, B: 8000, C: 20000 } as const;
export const DEFAULT_ENVIRONMENT_CONTROLS: EnvironmentControls = {
  weather: 'clear', tideMode: 'manual', tideOffset: 0, timeOfDay: 10,
  freshwaterInflow: 15, seawaterExchange: 160, currentSpeed: .18, currentDirection: 120, windDirection: 240,
  seaSalinity: 32, freshwaterTemperature: 26, seaTemperature: 29, cageDepth: 2.2,
  thresholds: { salinityMin: 18, salinityMax: 34, tempMax: 32, clearanceMin: .5 },
};
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback;
const bounded = (value: number, min: number, max: number, fallback: number) => clamp(finite(value, fallback), min, max);
const hour = (value: number) => ((value % 24) + 24) % 24;
const round = (value: number, places = 3) => Number(value.toFixed(places));

export function normalizeEnvironmentControls(base: EnvironmentControls, patch: Partial<EnvironmentControls>): EnvironmentControls {
  const merged = { ...base, ...patch, thresholds: { ...base.thresholds, ...patch.thresholds } };
  const weather = (['clear','cloudy','light-rain','monsoon','wind','storm'] as const).includes(merged.weather) ? merged.weather : base.weather;
  const tideMode = (['high','low','rising','falling','manual'] as const).includes(merged.tideMode) ? merged.tideMode : base.tideMode;
  const salinityMin = bounded(merged.thresholds.salinityMin, 0, 45, base.thresholds.salinityMin);
  return {
    weather, tideMode,
    tideOffset: bounded(merged.tideOffset, -1.5, 1.5, base.tideOffset),
    timeOfDay: hour(finite(merged.timeOfDay, base.timeOfDay)),
    freshwaterInflow: bounded(merged.freshwaterInflow, 0, 1000, base.freshwaterInflow),
    seawaterExchange: bounded(merged.seawaterExchange, 0, 2000, base.seawaterExchange),
    currentSpeed: bounded(merged.currentSpeed, 0, 3, base.currentSpeed),
    currentDirection: ((finite(merged.currentDirection, base.currentDirection) % 360) + 360) % 360,
    windDirection: ((finite(merged.windDirection, base.windDirection) % 360) + 360) % 360,
    seaSalinity: bounded(merged.seaSalinity, 0, 45, base.seaSalinity),
    freshwaterTemperature: bounded(merged.freshwaterTemperature, 5, 40, base.freshwaterTemperature),
    seaTemperature: bounded(merged.seaTemperature, 5, 40, base.seaTemperature),
    cageDepth: bounded(merged.cageDepth, .2, 6, base.cageDepth),
    thresholds: {
      salinityMin,
      salinityMax: bounded(merged.thresholds.salinityMax, salinityMin, 45, base.thresholds.salinityMax),
      tempMax: bounded(merged.thresholds.tempMax, 5, 45, base.thresholds.tempMax),
      clearanceMin: bounded(merged.thresholds.clearanceMin, 0, 5, base.thresholds.clearanceMin),
    },
  };
}

/** Negative metres relative to an assumed datum; unrelated to image water color. */
export function seabedElevationAt(u: number, v: number): number {
  const x = clamp(finite(u, .5), 0, 1), y = clamp(finite(v, .5), 0, 1);
  const offshore = clamp((x - (.035 + .53 * y)) / .58, 0, 1);
  const channel = 2.2 * Math.exp(-(((x - .72) / .17) ** 2 + ((y - .83) / .22) ** 2));
  const sandbar = 1.2 * Math.exp(-(((x - .65) / .14) ** 2 + ((y - .60) / .10) ** 2));
  return -clamp(.55 + 3.5 * Math.pow(offshore, .7) + channel - sandbar, .4, 6.2);
}

/** Same analytical assumed elevation as JS; GPU layers do not infer depths. */
export const BATHYMETRY_GLSL = `
float assumedSeabedElevation(vec2 siteUV) {
  vec2 p = clamp(siteUV, vec2(0.0), vec2(1.0));
  float offshore = clamp((p.x - (0.035 + 0.53 * p.y)) / 0.58, 0.0, 1.0);
  vec2 channelP = (p - vec2(0.72, 0.83)) / vec2(0.17, 0.22);
  vec2 sandbarP = (p - vec2(0.65, 0.60)) / vec2(0.14, 0.10);
  float channel = 2.2 * exp(-dot(channelP, channelP));
  float sandbar = 1.2 * exp(-dot(sandbarP, sandbarP));
  return -clamp(0.55 + 3.5 * pow(offshore, 0.7) + channel - sandbar, 0.4, 6.2);
}
`;

const WEATHER = {
  clear: { rain: 0, wind: 2.5, cloud: .15, transmission: .88 },
  cloudy: { rain: 0, wind: 4, cloud: .75, transmission: .30 },
  'light-rain': { rain: 8, wind: 4, cloud: .80, transmission: .24 },
  monsoon: { rain: 24, wind: 9, cloud: .94, transmission: .10 },
  wind: { rain: 0, wind: 12, cloud: .35, transmission: .68 },
  storm: { rain: 45, wind: 18, cloud: 1, transmission: .04 },
} as const;

export function environmentReadout(env: EnvironmentState, minute: number): EnvironmentReadout {
  const simulatedMinute = finite(minute, 0), timeOfDay = hour(env.timeOfDay + simulatedMinute / 60);
  const preset = WEATHER[env.weather], daylight = Math.max(0, Math.sin(Math.PI * (timeOfDay - 6) / 12));
  const weather: WeatherReadout = {
    airTemp: round(26.5 + daylight * 7 - preset.cloud * 1.5 - preset.rain * .03, 2),
    rain: preset.rain, wind: preset.wind, windDirection: env.windDirection, cloud: preset.cloud,
    irradiance: round(1000 * daylight * preset.transmission, 1),
    solarPower: round(1000 * daylight * preset.transmission * 6 * .20, 1),
  };
  const phase = simulatedMinute * Math.PI * 2 / 720;
  const tide = env.tideMode === 'high' ? .6 : env.tideMode === 'low' ? -.6
    : env.tideMode === 'rising' ? -.6 * Math.cos(phase)
    : env.tideMode === 'falling' ? .6 * Math.cos(phase) : 0;
  const waterLevel = env.enabled ? tide + env.tideOffset : 0;
  const seabedElevation = seabedElevationAt(...env.inspectPoint), depth = Math.max(0, waterLevel - seabedElevation);
  return { ...weather, weather, waterLevel, timeOfDay, seabedElevation, depth, localDepth: depth, cageClearance: depth - env.cageDepth };
}

function historySample(env: EnvironmentState, minute: number): EnvironmentHistory {
  const r = environmentReadout(env, minute);
  return { minute, waterLevel: r.waterLevel, ...r.weather,
    aSalinity: env.zones.A.salinity, bSalinity: env.zones.B.salinity, cSalinity: env.zones.C.salinity,
    aTemperature: env.zones.A.temperature, bTemperature: env.zones.B.temperature, cTemperature: env.zones.C.temperature };
}

export function createEnvironmentState(): EnvironmentState {
  const state: EnvironmentState = {
    ...DEFAULT_ENVIRONMENT_CONTROLS, thresholds: { ...DEFAULT_ENVIRONMENT_CONTROLS.thresholds },
    enabled: false, layer: 'observed', inspection: false, showCurrents: false, inspectPoint: [.588, .434],
    zones: { A: { salinity: 25.2, temperature: 29.1 }, B: { salinity: 28.4, temperature: 29 }, C: { salinity: 31.2, temperature: 28.9 } },
    history: [],
  };
  state.history = [historySample(state, 0)];
  return state;
}

/** Append parameter changes without elapsed-time mixing or energy integration. */
export function recordEnvironment(env: EnvironmentState, minute: number): EnvironmentState {
  return { ...env, history: [...env.history.slice(-239), historySample(env, minute)] };
}

/** Three constant-volume well-mixed boxes. Internal exchange conserves salt/heat. */
export function advanceEnvironment(env: EnvironmentState, minute: number, dtMinutes = 1): EnvironmentState {
  const duration = bounded(dtMinutes, 0, 60, 1);
  if (!env.enabled || duration === 0) return env;
  let zones = { A: { ...env.zones.A }, B: { ...env.zones.B }, C: { ...env.zones.C } };
  const { A: VA, B: VB, C: VC } = ENVIRONMENT_VOLUMES;
  // Determine a stable upper bound, then update all zones from the same old state.
  const maxExchange = env.currentSpeed * 60 * 12 * 1.5;
  const maxFresh = env.freshwaterInflow + 45 * 12000 * .55 / 1000 / 60;
  const maxLoss = Math.max((maxFresh + maxExchange) / VA, (maxFresh + 2 * maxExchange) / VB, (maxFresh + maxExchange + env.seawaterExchange * 1.5) / VC);
  const steps = Math.max(1, Math.ceil(duration * maxLoss / .4)), dt = duration / steps;
  for (let step = 0; step < steps; step++) {
    const r = environmentReadout(env, minute - duration + (step + .5) * dt);
    const tideFactor = clamp(1 + r.waterLevel * .35, .5, 1.5);
    const alignment = .6 + .4 * Math.abs(Math.cos((env.currentDirection - 120) * Math.PI / 180));
    const Qab = env.currentSpeed * 60 * 8 * tideFactor * alignment;
    const Qbc = env.currentSpeed * 60 * 12 * tideFactor * alignment;
    const F = env.freshwaterInflow + r.rain * 12000 * .55 / 1000 / 60;
    const Qsea = env.seawaterExchange * tideFactor;
    const evolve = (key: 'salinity' | 'temperature', fresh: number, sea: number) => {
      const a = zones.A[key], b = zones.B[key], c = zones.C[key];
      return [
        a + dt * (F * (fresh - a) + Qab * (b - a)) / VA,
        b + dt * (F * (a - b) + Qab * (a - b) + Qbc * (c - b)) / VB,
        c + dt * (F * (b - c) + Qbc * (b - c) + Qsea * (sea - c)) / VC,
      ];
    };
    const [sa, sb, sc] = evolve('salinity', 0, env.seaSalinity);
    const [ta, tb, tc] = evolve('temperature', env.freshwaterTemperature, env.seaTemperature);
    zones = { A: { salinity: sa, temperature: ta }, B: { salinity: sb, temperature: tb }, C: { salinity: sc, temperature: tc } };
  }
  return recordEnvironment({ ...env, zones }, minute);
}

export function environmentPresetOptions(preset: EnvironmentPreset): Partial<EnvironmentControls> {
  if (preset === 'rain') return { weather: 'monsoon' };
  if (preset === 'low-tide') return { tideMode: 'low' };
  if (preset === 'high-tide') return { tideMode: 'high' };
  if (preset === 'storm') return { weather: 'storm' };
  return { weather: 'clear' };
}
