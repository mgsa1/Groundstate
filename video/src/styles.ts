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
  durationFrames: 1200, // 40 seconds
};

// VeoIntro is unwired for now (audio decode issues in Studio).
// Re-enable by uncommenting in Main.tsx and shifting SCENES starts by +480.
export const VEO_INTRO = {
  dur: 480,
};

export const SCENES = {
  s1: { start: 0,    dur: 150 },  //  0.0 -  5.0s
  s2: { start: 150,  dur: 270 },  //  5.0 - 14.0s
  s3: { start: 420,  dur: 180 },  // 14.0 - 20.0s
  s4: { start: 600,  dur: 360 },  // 20.0 - 32.0s
  s5: { start: 960,  dur: 240 },  // 32.0 - 40.0s
};
