import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { palette, fonts } from "../styles";
import { typewriter } from "../components/typewriter";

// 10s @ 30fps = 300 frames. Designed to loop cleanly: opens and closes on the
// same calm "stays-local · agent done" frame.
//
// Beats (frames):
//   0  – 25  : title + record dot ignites
//   25 – 95  : voice waveform pulses, raw transcript types (with PII highlight)
//   95 – 150 : sanitizer filter sweeps; redactions blur; sanitized JSON token
//              ejects right
// 150 – 240  : Gemini 3.5 Flash agent runs 3 tool calls, ledger ticks green
// 240 – 285  : payoff — "Secrets stayed local. Work got done."
// 285 – 300  : crossfade-friendly hold for loop

const RAW_TRANSCRIPT =
  "Move my Tartine meeting; I can't be seen there this week.";
const PII_TERMS = ["Tartine", "can't be seen there"];

const SANITIZED_JSON_LINES = [
  "{",
  '  "action": "reschedule_meeting",',
  '  "urgency": "high",',
  '  "duration_minutes": 30',
  "}",
];

const TOOLS = [
  { name: "list_upcoming_events", t0: 160, t1: 188 },
  { name: "reschedule_conflicting_appointment", t0: 188, t1: 216 },
  { name: "draft_confirmation_email", t0: 216, t1: 244 },
];

export const ReadmeGif: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Title is always visible (no fade-in) so the first frame doesn't look empty
  // when the GIF restarts. A README GIF needs a strong first frame.

  // ---------- Mic pulse ----------
  const recOn = frame >= 12;
  const micPulse = recOn ? 0.55 + 0.45 * Math.sin(frame * 0.35) : 0;

  // ---------- Waveform (always alive while recording) ----------
  const wfActive = frame >= 18 && frame <= 150;

  // ---------- Transcript typewriter ----------
  const transcriptStart = 30;
  const transcript = typewriter(RAW_TRANSCRIPT, frame, transcriptStart, 1.4);
  const transcriptDone = transcriptStart + Math.ceil(RAW_TRANSCRIPT.length / 1.4);

  // ---------- Sanitizer sweep across the divider ----------
  const sweepProgress = interpolate(frame, [95, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const redactionOp = interpolate(frame, [110, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---------- JSON appears on the right ----------
  const jsonStart = 130;
  const jsonOp = interpolate(frame, [jsonStart, jsonStart + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---------- Token travelling across the wire (subtle) ----------
  const tokenCycleLen = 80;
  const tokenStart = 100;
  const tokenLocalT = ((frame - tokenStart) % tokenCycleLen) / tokenCycleLen;
  const tokenVisible = frame >= tokenStart && frame <= 245;
  const tokenOp = tokenVisible
    ? interpolate(tokenLocalT, [0, 0.12, 0.88, 1], [0, 1, 1, 0])
    : 0;

  // ---------- Stays-local stamp ----------
  const stampSpring = spring({ frame: frame - 140, fps, config: { damping: 14 } });
  const stampOp = interpolate(stampSpring, [0, 1], [0, 1]);
  const stampScale = interpolate(stampSpring, [0, 1], [1.4, 1]);

  // ---------- Payoff banner ----------
  const payoffOp = interpolate(frame, [248, 268, 285, 298], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: palette.page,
        fontFamily: fonts.ui,
        color: palette.text1,
      }}
    >
      {/* ===== Header / Title ===== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 36px 12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryInk})`,
              color: "white",
              fontFamily: fonts.mono,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              boxShadow: "0 4px 10px rgba(45,90,200,0.25)",
            }}
          >
            G
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.3 }}>
              Groundstate
            </div>
            <div style={{ fontSize: 13, color: palette.text2, marginTop: -2 }}>
              Private voice in · cloud agent out
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Pill tint="local">Gemma 3n · on-device</Pill>
          <Pill tint="cloud">Gemini 3.5 Flash · managed agent</Pill>
        </div>
      </div>

      {/* ===== Two-column stage ===== */}
      <div
        style={{
          flex: 1,
          display: "flex",
          padding: "8px 36px 24px",
          gap: 0,
          position: "relative",
        }}
      >
        {/* ---- LEFT: local enclave ---- */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <SideLabel
            dotColor={palette.localInk}
            ring={palette.local}
            title="On device"
            sub="never leaves this disk"
          />

          <div
            style={{
              flex: 1,
              background: palette.local,
              border: `1px solid ${palette.borderLocal}`,
              borderRadius: 16,
              padding: 22,
              display: "flex",
              flexDirection: "column",
              gap: 18,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Mic + waveform row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "#fffbf0",
                border: `1px solid ${palette.borderLocal}`,
                borderRadius: 12,
                padding: "14px 16px",
              }}
            >
              {/* Mic icon */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: palette.alert,
                  opacity: 0.18 + 0.55 * micPulse,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 26,
                    background: palette.alert,
                    borderRadius: 9,
                  }}
                />
              </div>
              <Waveform active={wfActive} frame={frame} />
              <span
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  fontWeight: 700,
                  color: palette.alert,
                  letterSpacing: 1.5,
                }}
              >
                REC
              </span>
            </div>

            {/* Raw transcript card */}
            <div
              style={{
                background: "#fffbf0",
                border: `1px solid ${palette.borderLocal}`,
                borderRadius: 12,
                padding: "16px 18px",
                minHeight: 92,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 1.4,
                  color: palette.text2,
                  marginBottom: 8,
                }}
              >
                Gemma 3n · raw transcript
              </div>
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 18,
                  lineHeight: 1.5,
                  color: palette.text1,
                }}
              >
                <PiiHighlight
                  text={transcript}
                  terms={PII_TERMS}
                  blurAmount={redactionOp}
                />
                {frame >= transcriptStart && frame < transcriptDone && (
                  <span style={{ opacity: frame % 30 < 15 ? 1 : 0 }}>▍</span>
                )}
              </div>
            </div>

            {/* Privileged memo card */}
            <div
              style={{
                background: "#fffbf0",
                border: `1px dashed ${palette.borderLocal}`,
                borderRadius: 12,
                padding: "14px 16px",
                position: "relative",
                opacity: interpolate(frame, [transcriptDone + 6, transcriptDone + 26], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 1.4,
                  color: palette.text2,
                  marginBottom: 8,
                }}
              >
                local_case_files/privileged_memo.txt
              </div>
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: palette.text1,
                }}
              >
                <div style={{ fontWeight: 800 }}>
                  <span
                    style={{
                      background: "#ffe9b0",
                      padding: "1px 6px",
                    }}
                  >
                    PRIVILEGED — work product
                  </span>
                </div>
                <div style={{ height: 6 }} />
                <div>
                  · Client wants to avoid{" "}
                  <span style={{ background: "#ffe9b0", padding: "0 3px" }}>
                    Tartine
                  </span>{" "}
                  this week.
                </div>
                <div>
                  · Reason:{" "}
                  <span style={{ background: "#ffe9b0", padding: "0 3px" }}>
                    confidential.
                  </span>
                </div>
                <div>· Action: reschedule, ≤ 30 min, today.</div>
              </div>

              {/* STAYS LOCAL stamp */}
              <div
                style={{
                  position: "absolute",
                  right: 14,
                  top: 12,
                  transform: `rotate(-10deg) scale(${stampScale})`,
                  border: `2.5px solid ${palette.alert}`,
                  color: palette.alert,
                  fontWeight: 800,
                  letterSpacing: 1.4,
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  padding: "4px 8px",
                  opacity: stampOp,
                  borderRadius: 4,
                  transformOrigin: "center",
                }}
              >
                STAYS LOCAL
              </div>
            </div>
          </div>
        </div>

        {/* ---- CENTER: sanitizer / wire ---- */}
        <div
          style={{
            width: 150,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 34, // visually align with cards (column label adds height)
          }}
        >
          {/* Vertical filter membrane */}
          <div
            style={{
              position: "absolute",
              top: 56,
              bottom: 12,
              left: "50%",
              width: 2,
              transform: "translateX(-50%)",
              background: `linear-gradient(180deg, ${palette.borderLocal}, ${palette.borderCloud})`,
              opacity: 0.7,
            }}
          />

          {/* Filter label */}
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: fonts.ui,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: palette.primaryInk,
            }}
          >
            sanitize
          </div>

          {/* Sweep glow */}
          <div
            style={{
              position: "absolute",
              top: 36,
              bottom: 12,
              left: "50%",
              width: 70,
              transform: `translateX(-50%) scaleY(${0.4 + 0.6 * sweepProgress})`,
              background:
                "radial-gradient(ellipse at center, rgba(59,109,245,0.20) 0%, rgba(59,109,245,0) 70%)",
              opacity: sweepProgress * (1 - Math.max(0, sweepProgress - 0.85) * 6),
              pointerEvents: "none",
            }}
          />

          {/* SVG arrow + tokens */}
          <svg
            width="150"
            height="60"
            viewBox="0 0 150 60"
            style={{ position: "absolute", top: "50%", marginTop: -30 }}
          >
            <defs>
              <marker
                id="rg-arrow"
                markerWidth="12"
                markerHeight="12"
                refX="9"
                refY="6"
                orient="auto"
              >
                <path d="M0,0 L11,6 L0,12 Z" fill={palette.primary} />
              </marker>
            </defs>
            <line
              x1="6"
              y1="30"
              x2="138"
              y2="30"
              stroke={palette.primary}
              strokeWidth="4"
              strokeLinecap="round"
              opacity={interpolate(frame, [80, 110], [0.25, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
              markerEnd="url(#rg-arrow)"
            />
          </svg>

          {/* Travelling sanitized token */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 8 + tokenLocalT * 120,
              transform: "translateY(-50%)",
              opacity: tokenOp,
              background: palette.card,
              border: `1.5px solid ${palette.primary}`,
              borderRadius: 6,
              padding: "2px 8px",
              fontFamily: fonts.mono,
              fontSize: 11,
              color: palette.primaryInk,
              fontWeight: 700,
              boxShadow: "0 2px 6px rgba(45,90,200,0.25)",
              whiteSpace: "nowrap",
            }}
          >
            {"{…}"}
          </div>
        </div>

        {/* ---- RIGHT: cloud agent ---- */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <SideLabel
            dotColor={palette.primaryInk}
            ring={palette.cloud}
            title="To cloud"
            sub="sanitized — 4 fields, no PII"
            align="right"
          />

          <div
            style={{
              flex: 1,
              background: palette.cloud,
              border: `1px solid ${palette.borderCloud}`,
              borderRadius: 16,
              padding: 22,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Sanitized JSON */}
            <div
              style={{
                background: palette.mono,
                borderRadius: 10,
                padding: 16,
                fontFamily: fonts.mono,
                fontSize: 15,
                lineHeight: 1.55,
                color: "#cfd8e8",
                position: "relative",
                minHeight: 140,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 1.4,
                  color: "#7e9bd1",
                  marginBottom: 8,
                }}
              >
                POST /agent/run
              </div>
              {/* Placeholder shown until sanitized JSON arrives */}
              <div
                style={{
                  opacity: 1 - jsonOp,
                  color: "#7e9bd1",
                  fontStyle: "italic",
                  position: "absolute",
                  left: 16,
                  right: 16,
                  top: 38,
                }}
              >
                awaiting sanitized handoff…
              </div>
              <pre style={{ margin: 0, opacity: jsonOp }}>
                <JsonHL lines={SANITIZED_JSON_LINES} />
              </pre>
            </div>

            {/* Agent ledger */}
            <div
              style={{
                background: palette.card,
                border: `1px solid ${palette.borderCloud}`,
                borderRadius: 12,
                padding: "14px 16px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 1.4,
                  color: palette.text2,
                }}
              >
                Gemini 3.5 Flash · multi-step agent
              </div>
              {TOOLS.map((tool, idx) => {
                const running = frame >= tool.t0 && frame < tool.t1;
                const done = frame >= tool.t1;
                const visible = frame >= tool.t0 - 6;
                return (
                  <ToolRow
                    key={tool.name}
                    name={tool.name}
                    state={running ? "running" : done ? "done" : "pending"}
                    visible={visible}
                    index={idx}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Payoff banner ===== */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: payoffOp,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: palette.mono,
            color: palette.textInverse,
            fontWeight: 600,
            fontSize: 22,
            letterSpacing: -0.2,
            padding: "12px 22px",
            borderRadius: 12,
            boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span style={{ color: "#9ff0a8", fontWeight: 800 }}>✓</span>
          Secrets stayed local. Work got done.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- helpers ----------

const Pill: React.FC<{ tint: "local" | "cloud"; children: React.ReactNode }> = ({
  tint,
  children,
}) => {
  const bg = tint === "local" ? palette.local : palette.cloud;
  const border = tint === "local" ? palette.borderLocal : palette.borderCloud;
  const dot = tint === "local" ? palette.localInk : palette.primaryInk;
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 999,
        padding: "5px 12px",
        fontSize: 12,
        fontWeight: 700,
        color: palette.text1,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: dot,
        }}
      />
      {children}
    </div>
  );
};

const SideLabel: React.FC<{
  dotColor: string;
  ring: string;
  title: string;
  sub: string;
  align?: "left" | "right";
}> = ({ dotColor, ring, title, sub, align = "left" }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
      justifyContent: align === "right" ? "flex-end" : "flex-start",
    }}
  >
    {align === "left" && (
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: 999,
          background: dotColor,
          boxShadow: `0 0 0 4px ${ring}`,
        }}
      />
    )}
    <span
      style={{
        fontWeight: 800,
        color: palette.text1,
        textTransform: "uppercase",
        letterSpacing: 1.2,
        fontSize: 12,
      }}
    >
      {title}
    </span>
    <span style={{ color: palette.text2, fontSize: 12 }}>· {sub}</span>
    {align === "right" && (
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: 999,
          background: dotColor,
          boxShadow: `0 0 0 4px ${ring}`,
        }}
      />
    )}
  </div>
);

const Waveform: React.FC<{ active: boolean; frame: number }> = ({ active, frame }) => {
  const bars = 22;
  return (
    <div
      style={{
        flex: 1,
        height: 38,
        display: "flex",
        alignItems: "center",
        gap: 3,
      }}
    >
      {Array.from({ length: bars }, (_, i) => {
        const phase = i * 0.55 + frame * 0.35;
        const amp = active ? 0.35 + 0.65 * Math.abs(Math.sin(phase)) : 0.12;
        const h = 6 + amp * 28;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: h,
              background: active ? palette.alert : palette.border2,
              borderRadius: 2,
              opacity: active ? 0.9 : 0.6,
            }}
          />
        );
      })}
    </div>
  );
};

const PiiHighlight: React.FC<{ text: string; terms: string[]; blurAmount: number }> = ({
  text,
  terms,
  blurAmount,
}) => {
  if (!text) return null;
  const parts: Array<{ text: string; hl: boolean }> = [{ text, hl: false }];
  for (const term of terms) {
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].hl) continue;
      const idx = parts[i].text.indexOf(term);
      if (idx === -1) continue;
      const before = parts[i].text.slice(0, idx);
      const after = parts[i].text.slice(idx + term.length);
      parts.splice(
        i,
        1,
        { text: before, hl: false },
        { text: term, hl: true },
        { text: after, hl: false }
      );
    }
  }
  return (
    <>
      {parts.map((p, i) =>
        p.hl ? (
          <span
            key={i}
            style={{
              background: "#ffe9b0",
              color: palette.text1,
              padding: "0 4px",
              borderRadius: 3,
              fontWeight: 600,
              filter: `blur(${blurAmount * 3}px)`,
              transition: "filter 80ms linear",
            }}
          >
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
};

const JsonHL: React.FC<{ lines: string[] }> = ({ lines }) => (
  <>
    {lines.map((line, i) => {
      const m = line.match(
        /^(\s*)("[^"]+")(\s*:\s*)("[^"]+"|\d+|true|false|null)(,?)\s*$/
      );
      if (!m) return <div key={i}>{line}</div>;
      const [, ws, key, sep, val, comma] = m;
      const isString = val.startsWith('"');
      return (
        <div key={i}>
          {ws}
          <span style={{ color: "#7ec5ff" }}>{key}</span>
          {sep}
          <span style={{ color: isString ? "#9ff0a8" : "#f0c279" }}>{val}</span>
          {comma}
        </div>
      );
    })}
  </>
);

const ToolRow: React.FC<{
  name: string;
  state: "pending" | "running" | "done";
  visible: boolean;
  index: number;
}> = ({ name, state, visible, index }) => {
  if (!visible) return null;
  const color =
    state === "done"
      ? palette.localInk
      : state === "running"
      ? palette.primary
      : palette.text3;
  const bg =
    state === "done"
      ? "#e9f6ef"
      : state === "running"
      ? "#eaf0fb"
      : palette.sunken;
  const border =
    state === "done"
      ? "#bfe1cd"
      : state === "running"
      ? palette.borderCloud
      : palette.border1;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 8,
        padding: "8px 10px",
        fontFamily: fonts.mono,
        fontSize: 13,
        color: palette.text1,
      }}
    >
      <span
        style={{
          width: 16,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          fontWeight: 800,
        }}
      >
        {state === "done" ? "✓" : state === "running" ? "•" : "·"}
      </span>
      <span style={{ flex: 1 }}>{name}()</span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color,
          textTransform: "uppercase",
          letterSpacing: 1.2,
        }}
      >
        {state}
      </span>
    </div>
  );
};
