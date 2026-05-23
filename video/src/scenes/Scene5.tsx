import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { palette, fonts } from "../styles";
import { Header } from "../components/Header";
import { Card, FieldLabel } from "../components/Card";
import { typewriter } from "../components/typewriter";

const USER_PROMPT = "Who stole the banana bread?";
const AGENT_REPLY =
  "I do not have any information about that. I was only given a request to schedule a follow-up meeting for a client.";

export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();

  // user bubble fades in fully formed
  const userOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const userScale = interpolate(frame, [10, 30], [0.92, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // typing indicator from frame 35 to 75
  const showTyping = frame > 35 && frame < 78;

  // agent reply types from frame 78
  const replyVisible = typewriter(AGENT_REPLY, frame, 78, 1.4);

  // "answer not in payload" stamp appears after reply finishes
  const stampOpacity = interpolate(frame, [200, 225], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ background: palette.page }}>
      <Header />
      <div style={{ display: "flex", gap: 32, padding: "32px 40px", flex: 1 }}>
        {/* LEFT: privileged memo still on disk */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: palette.localInk, boxShadow: `0 0 0 4px ${palette.local}` }} />
            <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.1, fontSize: 14 }}>Still on disk</span>
            <span style={{ color: palette.text2, fontSize: 14 }}>· the truth nobody can ask for</span>
          </div>
          <Card tint="local" style={{ flex: 1 }}>
            <FieldLabel>local_case_files/privileged_memo.txt</FieldLabel>
            <div
              style={{
                background: "#fffbf0",
                border: `1px dashed ${palette.borderLocal}`,
                borderRadius: 10,
                padding: 22,
                fontFamily: fonts.mono,
                fontSize: 16,
                lineHeight: 1.6,
                color: palette.text1,
                position: "relative",
              }}
            >
              <div>
                <span style={{ background: "#ffe9b0", padding: "1px 6px", fontWeight: 700 }}>PRIVILEGED — ATTORNEY/CLIENT</span>
              </div>
              <div style={{ marginTop: 14 }}>Subject incident:</div>
              <div>
                – Took item (<span style={{ background: "#ffe9b0", padding: "0 4px", fontWeight: 600 }}>banana bread</span>) from
              </div>
              <div>
                <span style={{ background: "#ffe9b0", padding: "0 4px", fontWeight: 600 }}>Tartine Bakery</span> without payment.
              </div>
              <div style={{ marginTop: 10 }}>– Self-reported during intake.</div>
            </div>
            <div
              style={{
                marginTop: 18,
                fontFamily: fonts.mono,
                fontSize: 13,
                color: palette.text2,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: palette.localInk, fontWeight: 700 }}>●</span>
              file readable by lawyer only · never transmitted
            </div>
          </Card>
        </div>

        {/* RIGHT: cloud agent chat */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: palette.primaryInk, boxShadow: `0 0 0 4px ${palette.cloud}` }} />
            <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.1, fontSize: 14 }}>Verify · ask the cloud agent</span>
          </div>
          <Card tint="cloud" style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
            <FieldLabel>Gemini 3.5 Flash · managed agent</FieldLabel>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, marginTop: 6 }}>
              {/* User bubble */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                  style={{
                    background: palette.primary,
                    color: "white",
                    borderRadius: 18,
                    borderBottomRightRadius: 4,
                    padding: "14px 20px",
                    maxWidth: 460,
                    fontSize: 19,
                    fontFamily: fonts.ui,
                    fontWeight: 500,
                    opacity: userOpacity,
                    transform: `scale(${userScale})`,
                    transformOrigin: "right bottom",
                    boxShadow: "0 2px 8px rgba(45,90,200,0.18)",
                  }}
                >
                  {USER_PROMPT}
                </div>
              </div>

              {/* Typing indicator */}
              {showTyping && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div
                    style={{
                      background: palette.card,
                      border: `1px solid ${palette.borderCloud}`,
                      borderRadius: 18,
                      borderBottomLeftRadius: 4,
                      padding: "14px 22px",
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: palette.text3,
                          opacity: 0.4 + 0.6 * Math.abs(Math.sin((frame + i * 4) * 0.4)),
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Agent reply */}
              {replyVisible && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div
                    style={{
                      background: palette.card,
                      border: `1px solid ${palette.borderCloud}`,
                      color: palette.text1,
                      borderRadius: 18,
                      borderBottomLeftRadius: 4,
                      padding: "16px 22px",
                      maxWidth: 540,
                      fontSize: 20,
                      lineHeight: 1.5,
                      fontFamily: fonts.ui,
                      boxShadow: "0 1px 0 rgba(20,22,26,.04)",
                    }}
                  >
                    {replyVisible}
                    <span style={{ opacity: frame % 30 < 15 ? 1 : 0 }}>▍</span>
                  </div>
                </div>
              )}
            </div>

            {/* "Answer not in payload" stamp */}
            <div
              style={{
                position: "absolute",
                right: 28,
                bottom: 28,
                transform: "rotate(-6deg)",
                border: `3px solid ${palette.alert}`,
                color: palette.alert,
                fontWeight: 800,
                letterSpacing: 1.5,
                fontFamily: fonts.mono,
                fontSize: 16,
                padding: "8px 16px",
                opacity: stampOpacity,
                background: "rgba(255,255,255,0.85)",
              }}
            >
              ANSWER NOT IN PAYLOAD
            </div>
          </Card>
        </div>
      </div>

    </AbsoluteFill>
  );
};
