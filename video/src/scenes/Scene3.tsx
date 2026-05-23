import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { palette, fonts } from "../styles";
import { Header } from "../components/Header";
import { Card, FieldLabel } from "../components/Card";

const PRIVILEGED_MEMO_SNIPPET = [
  "PRIVILEGED — ATTORNEY/CLIENT WORK PRODUCT",
  "",
  "Client: Matthieu R.",
  "Subject incident:",
  "- Took item (banana bread) from",
  "  Tartine Bakery without payment.",
  "- Likely petty theft.",
  "",
  "Action: schedule follow-up,",
  "≤ 60 min, this week.",
];

const SANITIZED_JSON = `{
  "action": "schedule_consultation",
  "urgency": "high",
  "duration_minutes": 60,
  "priority": "urgent"
}`;

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  // Arrow draws from left to right (Local → Cloud)
  const arrowDraw = interpolate(frame, [10, 55], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Sanitized JSON fades in on the right after the arrow lands
  const jsonOpacity = interpolate(frame, [55, 85], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Travelling JSON token slides along the arrow, repeats
  const cycle = 90;
  const cyclePos = (frame % cycle) / cycle; // 0..1
  const tokenX = interpolate(cyclePos, [0, 1], [0, 1]);
  const tokenOpacity = interpolate(cyclePos, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  // Redaction stamp on the privileged side
  const redactProgress = interpolate(frame, [50, 110], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ background: palette.page }}>
      <Header />
      <div style={{ display: "flex", gap: 24, padding: "32px 40px", flex: 1, alignItems: "stretch", position: "relative" }}>
        {/* LEFT: privileged memo */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: palette.localInk, boxShadow: `0 0 0 4px ${palette.local}` }} />
            <span style={{ fontWeight: 700, color: palette.text1, textTransform: "uppercase", letterSpacing: 1.1, fontSize: 14 }}>What stays</span>
            <span style={{ color: palette.text2, fontSize: 14 }}>· privileged memo on local disk</span>
          </div>
          <Card tint="local" style={{ minHeight: 600, position: "relative" }}>
            <FieldLabel>local_case_files/privileged_memo.txt</FieldLabel>
            <div
              style={{
                background: "#fffbf0",
                border: `1px dashed ${palette.borderLocal}`,
                borderRadius: 10,
                padding: 24,
                fontFamily: fonts.mono,
                fontSize: 18,
                lineHeight: 1.6,
                color: palette.text1,
                whiteSpace: "pre-wrap",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {PRIVILEGED_MEMO_SNIPPET.map((line, i) => {
                const isPii = line.includes("banana bread") || line.includes("Tartine Bakery");
                return (
                  <div key={i} style={{ minHeight: 28, position: "relative" }}>
                    {i === 0 ? (
                      <span style={{ background: "#ffe9b0", padding: "1px 6px", fontWeight: 700 }}>{line}</span>
                    ) : isPii ? (
                      <span style={{ background: "#ffe9b0", padding: "0 4px", fontWeight: 600 }}>{line}</span>
                    ) : (
                      line
                    )}
                  </div>
                );
              })}
              {/* "REDACTED — does not leave" stamp */}
              <div
                style={{
                  position: "absolute",
                  right: 16,
                  top: 16,
                  transform: "rotate(-12deg)",
                  border: `3px solid ${palette.alert}`,
                  color: palette.alert,
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  fontFamily: fonts.mono,
                  fontSize: 14,
                  padding: "6px 12px",
                  opacity: redactProgress,
                }}
              >
                STAYS LOCAL
              </div>
            </div>
          </Card>
        </div>

        {/* LOCAL → CLOUD arrow column */}
        <div
          style={{
            width: 240,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            paddingTop: 32, // line up with cards (column label above them adds height)
          }}
        >
          <div style={{ position: "relative", width: 240, height: 120 }}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                textAlign: "center",
                fontFamily: fonts.ui,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: palette.primaryInk,
              }}
            >
              sanitized payload
            </div>

            <svg
              width="240"
              height="80"
              viewBox="0 0 240 80"
              style={{ overflow: "visible", position: "absolute", top: 40, left: 0 }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="14"
                  markerHeight="14"
                  refX="10"
                  refY="7"
                  orient="auto"
                >
                  <path d="M0,0 L12,7 L0,14 Z" fill={palette.primary} />
                </marker>
              </defs>
              <line
                x1="0"
                y1="40"
                x2={`${arrowDraw * 220}`}
                y2="40"
                stroke={palette.primary}
                strokeWidth="6"
                strokeLinecap="round"
                markerEnd={arrowDraw > 0.95 ? "url(#arrowhead)" : undefined}
              />
            </svg>

            {/* Travelling JSON token */}
            <div
              style={{
                position: "absolute",
                top: 80 - 14,
                left: tokenX * 200,
                opacity: arrowDraw > 0.95 ? tokenOpacity : 0,
                background: palette.card,
                border: `1.5px solid ${palette.primary}`,
                borderRadius: 8,
                padding: "4px 10px",
                fontFamily: fonts.mono,
                fontSize: 13,
                color: palette.primaryInk,
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(45,90,200,0.25)",
                whiteSpace: "nowrap",
              }}
            >
              {"{ ... }"}
            </div>
          </div>
        </div>

        {/* RIGHT: sanitized JSON */}
        <div style={{ flex: 1, opacity: jsonOpacity }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: palette.primaryInk, boxShadow: `0 0 0 4px ${palette.cloud}` }} />
            <span style={{ fontWeight: 700, color: palette.text1, textTransform: "uppercase", letterSpacing: 1.1, fontSize: 14 }}>What crosses</span>
            <span style={{ color: palette.text2, fontSize: 14 }}>· sanitized payload, 4 fields</span>
          </div>
          <Card tint="cloud" style={{ minHeight: 600 }}>
            <FieldLabel>POST /agent/run  ·  payload</FieldLabel>
            <pre
              style={{
                background: palette.mono,
                color: "#cfd8e8",
                fontFamily: fonts.mono,
                fontSize: 22,
                padding: 28,
                borderRadius: 10,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              <JsonHighlighted text={SANITIZED_JSON} />
            </pre>
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <Tag>0 PII fields</Tag>
              <Tag>0 names</Tag>
              <Tag>0 case details</Tag>
              <Tag>4 enums</Tag>
            </div>
          </Card>
        </div>
      </div>

    </AbsoluteFill>
  );
};

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      background: palette.card,
      border: `1px solid ${palette.borderCloud}`,
      color: palette.primaryInk,
      borderRadius: 999,
      padding: "6px 14px",
      fontSize: 14,
      fontWeight: 600,
    }}
  >
    {children}
  </div>
);

// Color JSON keys/strings/numbers
const JsonHighlighted: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const m = line.match(/^(\s*)("[^"]+")(\s*:\s*)("[^"]+"|\d+|true|false|null)(,?)\s*$/);
        if (!m) {
          return <div key={i}>{line}</div>;
        }
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
};
