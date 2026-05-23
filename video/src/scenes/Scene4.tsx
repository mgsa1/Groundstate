import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { palette, fonts } from "../styles";
import { Header } from "../components/Header";
import { Card, FieldLabel } from "../components/Card";
import {
  CalendarPanel,
  LAWYER_EVENTS,
  CLIENT_BASE,
  HAIR_ORIGINAL_START,
  HAIR_NEW_START,
  HAIR_DURATION,
  CONSULT_START,
  CONSULT_DURATION,
} from "../components/Calendar";

// ---------- Tool timeline (360 frames total) ----------
// Each tool's running window is the visible "cause" of a calendar change.

type ToolCall = {
  name: string;
  args: string;
  startFrame: number;
  doneFrame: number;
};

const TOOLS: ToolCall[] = [
  { name: "list_upcoming_events",                args: "hours_ahead = 168",                                                  startFrame:  10, doneFrame:  60 },
  { name: "reschedule_conflicting_appointment",  args: 'event_id = "groceries_wed_2pm", new_start = "Wed 15:30"',           startFrame:  70, doneFrame: 130 },
  { name: "schedule_consultation",               args: 'start = "Wed 14:00", duration_min = 60, attendee = "cod.legend95"', startFrame: 140, doneFrame: 200 },
  { name: "draft_confirmation_email",            args: 'to = "cod.legend95@…", subject = "Consultation confirmed"',         startFrame: 210, doneFrame: 270 },
];

const EMAIL_PREVIEW = `Subject: Consultation confirmed — Wed 2:00 PM

Hi — confirming Wed 2:00 PM (60 min, Pacific).
To clear the slot, we've moved your groceries run
to 3:30 PM the same day.

— The Firm`;

// ---------- Scene ----------

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calendars enter while tool 1 (list_upcoming_events) is running.
  const calOpacity = interpolate(frame, [10, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const calY = interpolate(frame, [10, 50], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Lawyer's free slot beacon: pops in after tool 1 starts reading, fades when
  // tool 3 fills it with the consultation block.
  const gapVisible = frame >= 40;
  const gapFadeOutFromFrame = 165;

  // Hairdresser conflict pulse: red while tool 2 (reschedule) is preparing/running,
  // settles back to normal flamingo after the slide completes.
  const hairWarn = frame >= 55 && frame < 128;
  const hairMoved = frame >= 125;

  // Hairdresser slides from 2:00 PM → 3:30 PM during tool 2's active window.
  const hairStartHour = interpolate(
    frame,
    [80, 125],
    [HAIR_ORIGINAL_START, HAIR_NEW_START],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Consultation block fades onto both calendars while tool 3 runs.
  const consultIn = spring({ frame: frame - 150, fps, config: { damping: 18 } });
  const consultOpacity = interpolate(consultIn, [0, 1], [0, 1]);
  const consultScale = interpolate(consultIn, [0, 1], [0.94, 1]);
  const showConsult = frame >= 150;

  // Email preview card slides up under the ledger while tool 4 runs.
  const emailIn = spring({ frame: frame - 220, fps, config: { damping: 20 } });
  const emailOpacity = interpolate(emailIn, [0, 1], [0, 1]);
  const emailY = interpolate(emailIn, [0, 1], [14, 0]);

  return (
    <AbsoluteFill style={{ background: palette.page }}>
      <Audio src={staticFile("scene4_voice.wav")} />
      <Header />

      <div style={{ display: "flex", gap: 24, padding: "20px 32px", flex: 1, minHeight: 0 }}>
        {/* LEFT 1/3 — ledger + email preview */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: palette.primaryInk,
                boxShadow: `0 0 0 4px ${palette.cloud}`,
              }}
            />
            <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.1, fontSize: 13 }}>
              Gemini 3.5 Flash
            </span>
            <span style={{ color: palette.text2, fontSize: 13 }}>· managed agent · 4 tools</span>
          </div>

          <Card tint="cloud" style={{ marginBottom: 16 }}>
            <FieldLabel>Workspace actions</FieldLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {TOOLS.map((t, i) => (
                <ToolRow key={t.name} index={i + 1} tool={t} frame={frame} />
              ))}
            </div>
          </Card>

          {/* Email draft preview — fades in as tool 4 runs */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              opacity: emailOpacity,
              transform: `translateY(${emailY}px)`,
              display: "flex",
            }}
          >
            <Card tint="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: 10,
                  borderBottom: `1px solid ${palette.border1}`,
                  marginBottom: 12,
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 16 }}>✉</span>
                  <span
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 12,
                      color: palette.text2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    To: cod.legend95@gmail.com
                  </span>
                </div>
                <div
                  style={{
                    background: "#fff7e0",
                    border: `1px solid ${palette.warn}`,
                    color: palette.warn,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  Draft · not sent
                </div>
              </div>
              <pre
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 13,
                  color: palette.text1,
                  whiteSpace: "pre-wrap",
                  margin: 0,
                  lineHeight: 1.55,
                  flex: 1,
                }}
              >
                {EMAIL_PREVIEW}
              </pre>
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  background: palette.sunken,
                  border: `1px dashed ${palette.border2}`,
                  borderRadius: 8,
                  fontSize: 11,
                  color: palette.text2,
                }}
              >
                <strong style={{ color: palette.localInk }}>Confidentiality:</strong>{" "}
                no <em>Tartine</em>, no <em>banana bread</em>. ✓
              </div>
            </Card>
          </div>
        </div>

        {/* RIGHT 2/3 — two calendars driven by the tools above */}
        <div
          style={{
            flex: 2,
            display: "flex",
            gap: 20,
            opacity: calOpacity,
            transform: `translateY(${calY}px)`,
            minHeight: 0,
          }}
        >
          <CalendarPanel
            owner="Sarah Chen · Lawyer"
            accent={palette.primaryInk}
            events={LAWYER_EVENTS}
            highlightGap={
              gapVisible
                ? { startHour: 14, endHour: 15, frame, fromFrame: 40, fadeOutFromFrame: gapFadeOutFromFrame }
                : null
            }
            consultation={
              showConsult
                ? {
                    startHour: CONSULT_START,
                    duration: CONSULT_DURATION,
                    title: "Consultation · cod.legend95",
                    opacity: consultOpacity,
                    scale: consultScale,
                  }
                : null
            }
          />
          <CalendarPanel
            owner="cod.legend95 · Client"
            accent={palette.localInk}
            events={CLIENT_BASE}
            hairdresser={{
              startHour: hairStartHour,
              duration: HAIR_DURATION,
              warn: hairWarn,
              justMoved: hairMoved,
              frame,
              fromFrame: 55,
            }}
            consultation={
              showConsult
                ? {
                    startHour: CONSULT_START,
                    duration: CONSULT_DURATION,
                    title: "Consultation · Sarah Chen",
                    opacity: consultOpacity,
                    scale: consultScale,
                  }
                : null
            }
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Tool ledger row ----------

const ToolRow: React.FC<{ index: number; tool: ToolCall; frame: number }> = ({
  index,
  tool,
  frame,
}) => {
  const state: "queued" | "running" | "done" =
    frame < tool.startFrame ? "queued" : frame < tool.doneFrame ? "running" : "done";

  const badge =
    state === "done"
      ? { bg: "#e7f7ec", fg: palette.localInk, label: "DONE" }
      : state === "running"
      ? { bg: "#fff5d6", fg: palette.warn, label: "RUN" }
      : { bg: palette.sunken, fg: palette.text3, label: "QUEUED" };

  const rowOpacity = state === "queued" ? 0.55 : 1;
  const pulse = state === "running" ? 0.5 + 0.5 * Math.sin(frame * 0.4) : 1;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "30px 1fr 70px",
        gap: 10,
        alignItems: "center",
        background: palette.card,
        border: `1px solid ${state === "done" ? "#bfe6ca" : palette.borderCloud}`,
        borderRadius: 10,
        padding: "10px 12px",
        opacity: rowOpacity,
        transition: "opacity 200ms",
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          background:
            state === "done"
              ? "#bfe6ca"
              : state === "running"
              ? "#fde2a3"
              : palette.sunken,
          color:
            state === "done"
              ? palette.localInk
              : state === "running"
              ? palette.warn
              : palette.text3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.mono,
          fontWeight: 700,
          fontSize: 12,
          opacity: pulse,
        }}
      >
        {state === "done" ? "✓" : index}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: fonts.mono,
            fontWeight: 600,
            fontSize: 13,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {tool.name}()
        </div>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 10.5,
            color: palette.text2,
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {tool.args}
        </div>
      </div>
      <div
        style={{
          background: badge.bg,
          color: badge.fg,
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: 1.0,
          textAlign: "center",
          padding: "4px 6px",
          borderRadius: 999,
          fontFamily: fonts.mono,
        }}
      >
        {badge.label}
      </div>
    </div>
  );
};
