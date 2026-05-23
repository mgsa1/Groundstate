export const palette = {
  page: "#fbfaf7",
  card: "#ffffff",
  local: "#f8f1df",
  cloud: "#e9f0fb",
  sunken: "#f5f4f0",
  mono: "#14161a",
  border1: "#e6e3dc",
  border2: "#d5d2ca",
  borderLocal: "#e9d9a6",
  borderCloud: "#c9d8f0",
  borderFocus: "#2c6ef2",
  text1: "#1c1d20",
  text2: "#5b6470",
  text3: "#8a8f99",
  textInverse: "#ffffff",
  primary: "#3b6df5",
  primaryInk: "#1d4ac9",
  localInk: "#2f7a5a",
  alert: "#d24a3b",
  warn: "#cf8a1a",
};

export const fonts = {
  ui: '"Figtree", system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
};

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationFrames: 1315, // 43.83 seconds — sized to fit per-scene voiceovers
};

// VeoIntro is unwired for now (audio decode issues in Studio).
// Re-enable by uncommenting in Main.tsx and shifting SCENES starts by +480.
export const VEO_INTRO = {
  dur: 480,
};

// Scene durations are sized to fit each scene_N_voice.wav voiceover
// (audio is decoded from .m4a → .wav to avoid Chromium AAC decode issues).
// Scenes 1, 2, 3 use *_trim.wav files with leading silence removed.
export const SCENES = {
  s1: { start: 0,     dur: 188 },  //  0.00 -  6.27s · voice 6.15s (trimmed 1.4s head)
  s2: { start: 188,   dur: 345 },  //  6.27 - 17.77s · voice 11.29s (trimmed 1.0s head)
  s3: { start: 533,   dur: 227 },  // 17.77 - 25.33s · voice  7.50s (trimmed 0.6s head)
  s4: { start: 760,   dur: 315 },  // 25.33 - 35.83s · voice 7.89s (trimmed 1.5s of tail)
  s5: { start: 1075,  dur: 240 },  // 35.83 - 43.83s · voice 7.25s
};
