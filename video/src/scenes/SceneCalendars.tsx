import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { palette, fonts } from "../styles";
import { Header } from "../components/Header";
import { Caption } from "../components/Caption";
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

// ---------- Animation timeline (frames @ 30fps, total 300 = 10s) ----------

const T = {
  reveal:       { in: 0,   out: 30  },
  scanGap:      { in: 40,  out: 100 },
  findConflict: { in: 110, out: 170 },
  reschedule:   { in: 180, out: 240 },
  schedule:     { in: 245, out: 300 },
};

const TOOLS: { fromFrame: number; label: string }[] = [
  { fromFrame: 0,   label: "Reading both calendars…" },
  { fromFrame: 40,  label: "list_upcoming_events(168h)  ✓" },
  { fromFrame: 110, label: "Conflict detected · client groceries 2:00–3:30 PM" },
  { fromFrame: 180, label: "reschedule_conflicting_appointment(groceries_wed_2pm → Wed 15:30)" },
  { fromFrame: 245, label: "schedule_consultation(Wed 14:00, 60m, cod.legend95)  ✓" },
];

// ---------- Scene ----------

export const SceneCalendars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = 300;

  const panelSpring = spring({ frame: frame - T.reveal.in, fps, config: { damping: 20 } });
  const panelOpacity = interpolate(panelSpring, [0, 1], [0, 1]);
  const panelY = interpolate(panelSpring, [0, 1], [22, 0]);

  const hairStartHour = interpolate(
    frame,
    [T.reschedule.in, T.reschedule.out - 10],
    [HAIR_ORIGINAL_START, HAIR_NEW_START],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const consultIn = spring({ frame: frame - T.schedule.in, fps, config: { damping: 18 } });
  const consultOpacity = interpolate(consultIn, [0, 1], [0, 1]);
  const consultScale = interpolate(consultIn, [0, 1], [0.94, 1]);

  const activeTool = [...TOOLS].reverse().find((t) => frame >= t.fromFrame) ?? TOOLS[0];
  const toolOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: palette.page }}>
      <Header />

      {/* Agent status bar */}
      <div
        style={{
          padding: "16px 40px 0",
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: toolOpacity,
        }}
      >
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
        <span style={{ color: palette.text2, fontSize: 13 }}>· managed agent</span>
        <span style={{ color: palette.text3, fontSize: 13 }}>›</span>
        <span
          key={activeTool.label}
          style={{
            fontFamily: fonts.mono,
            fontSize: 14,
            color: palette.text1,
            background: palette.cloud,
            border: `1px solid ${palette.borderCloud}`,
            padding: "5px 12px",
            borderRadius: 8,
            animation: "fadeIn 240ms ease both",
          }}
        >
          {activeTool.label}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 28,
          padding: "20px 40px",
          flex: 1,
          opacity: panelOpacity,
          transform: `translateY(${panelY}px)`,
        }}
      >
        <CalendarPanel
          owner="Sarah Chen · Lawyer"
          accent={palette.primaryInk}
          events={LAWYER_EVENTS}
          highlightGap={
            frame >= T.scanGap.in
              ? { startHour: 14, endHour: 15, frame, fromFrame: T.scanGap.in }
              : null
          }
          consultation={
            frame >= T.schedule.in
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
            warn: frame >= T.findConflict.in && frame < T.reschedule.out,
            justMoved: frame >= T.reschedule.out - 10,
            frame,
            fromFrame: T.findConflict.in,
          }}
          consultation={
            frame >= T.schedule.in
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

      <Caption
        text='"Gemini 3.5 Flash, as a managed agent, resolves the calendar conflict."'
        totalFrames={total}
      />

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(2px);} to { opacity: 1; transform: none;} }`}</style>
    </AbsoluteFill>
  );
};
