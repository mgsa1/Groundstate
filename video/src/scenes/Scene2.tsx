import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { palette, fonts } from "../styles";
import { Header } from "../components/Header";
import { ColumnLabel } from "../components/ColumnLabel";
import { Card, FieldLabel } from "../components/Card";
import { typewriter } from "../components/typewriter";

const CLIENT_LINE =
  "They have footage of me stealing the bread this week. I do not know what to do, this must stay confidential.";

const LAWYER_LINE =
  "Let's meet next week to discuss in more details, all is confidential here.";

const MEMO_LINES = [
  "PRIVILEGED — ATTORNEY/CLIENT WORK PRODUCT",
  "",
  "Client: Matthieu R.",
  "Date: 2026-05-23",
  "",
  "Subject incident:",
  "- Client reports surveillance footage exists showing",
  "  him taking bread this week.",
  "- Self-disclosed during intake; client visibly anxious.",
  "- Client requested strict confidentiality.",
  "",
  "Action items:",
  "- Schedule confidential consultation next week, ≤ 60 min.",
  "- Maintain attorney-client privilege; do NOT transmit.",
];

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();

  const clientStart = 18;
  const clientVisible = typewriter(CLIENT_LINE, frame, clientStart, 2.4);
  const clientDone = clientStart + Math.ceil(CLIENT_LINE.length / 2.4);

  const lawyerStart = clientDone + 8; // small beat before lawyer responds
  const lawyerVisible = typewriter(LAWYER_LINE, frame, lawyerStart, 2.4);
  const lawyerShown = frame >= lawyerStart;
  const lawyerDone = lawyerStart + Math.ceil(LAWYER_LINE.length / 2.4);

  // Memo lines appear one at a time after the lawyer line begins
  const memoStartFrame = lawyerDone + 4;
  const memoLineEvery = 7;
  const memoShown = MEMO_LINES.map((line, i) =>
    frame > memoStartFrame + i * memoLineEvery ? line : null
  );

  const filePathOpacity = interpolate(frame, [memoStartFrame + 80, memoStartFrame + 110], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Pulsing red dot for "recording"
  const recordPulse = 0.5 + 0.5 * Math.sin(frame * 0.25);

  return (
    <AbsoluteFill style={{ background: palette.page }}>
      <Audio src={staticFile("scene2_voice_trim.wav")} />
      <Header />
      <div style={{ display: "flex", gap: 32, padding: "32px 40px", flex: 1 }}>
        {/* Local column zoomed/highlighted */}
        <div style={{ flex: 1.5, display: "flex", flexDirection: "column" }}>
          <ColumnLabel side="local" />
          <Card tint="local" style={{ flex: 1, position: "relative" }}>
            <div style={{ position: "absolute", top: 18, right: 22, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: palette.alert, opacity: recordPulse }} />
              <span style={{ fontFamily: fonts.mono, fontSize: 12, color: palette.alert, letterSpacing: 1.2 }}>REC · LOCAL</span>
            </div>

            <FieldLabel>Raw transcript · Gemma 3n (on-device)</FieldLabel>
            <div
              style={{
                background: palette.card,
                border: `1px solid ${palette.borderLocal}`,
                borderRadius: 10,
                padding: 18,
                minHeight: 150,
                fontFamily: fonts.mono,
                fontSize: 16,
                color: palette.text1,
                lineHeight: 1.5,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Client turn */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: palette.alert, letterSpacing: 1.2, marginBottom: 4 }}>
                  CLIENT · MATTHIEU
                </div>
                <div>
                  <Highlight text={clientVisible} />
                  {frame >= clientStart && frame < clientDone && (
                    <span style={{ opacity: frame % 30 < 15 ? 1 : 0 }}>▍</span>
                  )}
                </div>
              </div>

              {/* Lawyer turn */}
              {lawyerShown && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: palette.primaryInk, letterSpacing: 1.2, marginBottom: 4 }}>
                    LAWYER
                  </div>
                  <div>
                    <Highlight text={lawyerVisible} />
                    {frame >= lawyerStart && frame < lawyerDone && (
                      <span style={{ opacity: frame % 30 < 15 ? 1 : 0 }}>▍</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ height: 20 }} />
            <FieldLabel>Privileged memo · written to local disk</FieldLabel>
            <div
              style={{
                background: "#fffbf0",
                border: `1px dashed ${palette.borderLocal}`,
                borderRadius: 10,
                padding: 22,
                minHeight: 360,
                fontFamily: fonts.mono,
                fontSize: 15,
                color: palette.text1,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}
            >
              {memoShown.map((line, i) =>
                line === null ? null : (
                  <div key={i} style={{ minHeight: 22 }}>
                    {line === "PRIVILEGED — ATTORNEY/CLIENT WORK PRODUCT" ? (
                      <span style={{ background: "#ffe9b0", color: palette.text1, padding: "1px 6px", fontWeight: 700 }}>{line}</span>
                    ) : (
                      <Highlight text={line} />
                    )}
                  </div>
                )
              )}
            </div>

            <div
              style={{
                marginTop: 14,
                opacity: filePathOpacity,
                fontFamily: fonts.mono,
                fontSize: 14,
                color: palette.text2,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ color: palette.localInk, fontWeight: 700 }}>✓ wrote</span>
              <span
                style={{
                  background: palette.sunken,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: `1px solid ${palette.border1}`,
                }}
              >
                local_case_files/privileged_memo.txt
              </span>
              <span style={{ color: palette.text3 }}>· never leaves this disk</span>
            </div>
          </Card>
        </div>

        {/* Cloud column dim/idle */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", opacity: 0.35 }}>
          <ColumnLabel side="cloud" />
          <Card tint="cloud" style={{ flex: 1 }}>
            <FieldLabel>Sanitized payload</FieldLabel>
            <div
              style={{
                background: palette.mono,
                color: "#7e9bd1",
                fontFamily: fonts.mono,
                fontSize: 14,
                padding: 16,
                borderRadius: 8,
                minHeight: 100,
              }}
            >
              {"{ \"status\": \"Waiting for sanitized handoff...\" }"}
            </div>
            <div style={{ height: 16 }} />
            <FieldLabel>Workspace actions</FieldLabel>
            <div
              style={{
                background: palette.card,
                border: `1px solid ${palette.borderCloud}`,
                borderRadius: 10,
                padding: 18,
                minHeight: 360,
                color: palette.text3,
                fontStyle: "italic",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              No agent activity yet.
            </div>
          </Card>
        </div>
      </div>

    </AbsoluteFill>
  );
};

// Highlight the load-bearing privileged terms.
const HL = ["footage", "stealing the bread", "taking bread", "surveillance footage", "confidential", "confidentiality"];
const Highlight: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const parts: Array<{ text: string; hl: boolean }> = [{ text, hl: false }];
  for (const term of HL) {
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].hl) continue;
      const idx = parts[i].text.indexOf(term);
      if (idx === -1) continue;
      const before = parts[i].text.slice(0, idx);
      const after = parts[i].text.slice(idx + term.length);
      parts.splice(i, 1, { text: before, hl: false }, { text: term, hl: true }, { text: after, hl: false });
    }
  }
  return (
    <>
      {parts.map((p, i) =>
        p.hl ? (
          <span key={i} style={{ background: "#ffe9b0", color: palette.text1, padding: "0 4px", borderRadius: 3, fontWeight: 600 }}>
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
};
