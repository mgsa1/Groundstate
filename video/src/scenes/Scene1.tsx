import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { palette, fonts, SCENES } from "../styles";
import { Header } from "../components/Header";
import { ColumnLabel } from "../components/ColumnLabel";
import { Card, FieldLabel } from "../components/Card";

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const total = SCENES.s1.dur;

  const titleY = interpolate(frame, [10, 35], [40, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const titleOpacity = interpolate(frame, [10, 35, total - 18, total], [0, 1, 1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Sequential panel highlights: local first, then cloud.
  // Frames 30-90: local panel lit
  // Frames 90-150: cloud panel lit
  const localHighlight = interpolate(
    frame,
    [25, 40, 80, 95],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );
  const cloudHighlight = interpolate(
    frame,
    [85, 100, 140, 150],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill style={{ background: palette.page }}>
      <Audio src={staticFile("scene1_voice_trim.wav")} />
      <Header />
      <div style={{ display: "flex", gap: 32, padding: "32px 40px", flex: 1 }}>
        <DashboardColumn side="local" highlight={localHighlight} dim={cloudHighlight} />
        <DashboardColumn side="cloud" highlight={cloudHighlight} dim={localHighlight} />
      </div>

      {/* Lower-half black fade with the Groundstate headline inside */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "50%",
          background: `linear-gradient(to bottom, rgba(20,22,26,0) 0%, rgba(20,22,26,0.85) 35%, ${palette.mono} 70%)`,
          opacity: titleOpacity,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: palette.textInverse,
            transform: `translateY(${titleY}px)`,
            paddingTop: 80, // nudge the text below the gradient's transparent top
          }}
        >
          <div
            style={{
              fontFamily: fonts.ui,
              fontWeight: 700,
              fontSize: 128,
              letterSpacing: -2.5,
              lineHeight: 1.05,
              textShadow: "0 4px 30px rgba(0,0,0,0.6)",
            }}
          >
            Groundstate
          </div>
          <div
            style={{
              fontFamily: fonts.ui,
              fontWeight: 500,
              fontSize: 38,
              color: "#cdd2dc",
              marginTop: 18,
              letterSpacing: -0.3,
            }}
          >
            Keeping things private working with AI
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const DashboardColumn: React.FC<{
  side: "local" | "cloud";
  highlight: number; // 0..1 = strength of attention on this column
  dim: number;       // 0..1 = strength of attention on the OTHER column (dims this one)
}> = ({ side, highlight, dim }) => {
  const isLocal = side === "local";
  const glowColor = isLocal ? "rgba(207, 161, 49, 0.55)" : "rgba(59, 109, 245, 0.55)";
  const accentBorder = isLocal ? "#d9b552" : "#7aa0ee";
  const baseBorder = isLocal ? palette.borderLocal : palette.borderCloud;

  // When this side is highlighted: glow, brighter border, tiny lift.
  // When the OTHER side is highlighted: this one dims slightly.
  const opacity = 1 - 0.35 * dim;
  const scale = 1 + 0.008 * highlight;
  const glowSize = 28 * highlight;
  const borderColor = highlight > 0
    ? `rgba(${isLocal ? "217, 181, 82" : "122, 160, 238"}, ${0.6 + 0.4 * highlight})`
    : baseBorder;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: isLocal ? "left center" : "right center",
      }}
    >
      <ColumnLabel side={side} />
      <Card
        tint={side}
        style={{
          flex: 1,
          border: `1px solid ${borderColor}`,
          boxShadow:
            highlight > 0
              ? `0 0 ${glowSize}px ${glowColor}, 0 0 0 ${2 * highlight}px ${accentBorder}33, 0 1px 0 rgba(20,22,26,.04)`
              : "0 1px 0 rgba(20,22,26,.04), 0 1px 2px rgba(20,22,26,.04)",
        }}
      >
        <FieldLabel>{isLocal ? "Pipeline log" : "Sanitized payload"}</FieldLabel>
        <div
          style={{
            background: palette.mono,
            color: "#7ee0a9",
            fontFamily: fonts.mono,
            fontSize: 14,
            padding: 16,
            borderRadius: 8,
            minHeight: 80,
            lineHeight: 1.6,
            opacity: 0.6,
          }}
        >
          {isLocal ? (
            <>
              <div>{"> Secure enclave initialized."}</div>
              <div>{"> Google Calendar API loaded."}</div>
              <div>{"> Local Gemma 3n mapped to Metal."}</div>
            </>
          ) : (
            <div style={{ color: "#a1b3d6" }}>{"{ \"status\": \"Waiting for local model...\" }"}</div>
          )}
        </div>
        <div style={{ height: 16 }} />
        <FieldLabel>{isLocal ? "Privileged memo" : "Workspace actions"}</FieldLabel>
        <div
          style={{
            background: palette.card,
            border: `1px solid ${isLocal ? palette.borderLocal : palette.borderCloud}`,
            borderRadius: 10,
            padding: 18,
            minHeight: 240,
            color: palette.text3,
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontStyle: "italic",
          }}
        >
          {isLocal ? "Waiting for client voice input…" : "No agent activity yet."}
        </div>
      </Card>
    </div>
  );
};
