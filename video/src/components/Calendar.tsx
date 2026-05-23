import React from "react";
import { interpolate } from "remotion";
import { palette, fonts } from "../styles";

// ---------- Constants ----------

export const COLOR = {
  blueberry: "#4285F4",
  basil:     "#0B8043",
  banana:    "#F4B400",
  grape:     "#9334E6",
  tomato:    "#D50000",
  graphite:  "#616161",
  lavender:  "#7986CB",
  flamingo:  "#E67C73",
};

export const HOUR_START = 9;
export const HOUR_END = 18;
export const HOUR_COUNT = HOUR_END - HOUR_START;
export const HOUR_HEIGHT = 56;
const TIME_COL = 56;

// ---------- Types ----------

export type CalEvent = {
  id: string;
  title: string;
  startHour: number; // 24h decimal
  endHour: number;
  color: string;
  subtitle?: string;
};

export type GapHighlight = {
  startHour: number;
  endHour: number;
  frame: number;
  fromFrame: number;
  fadeOutFromFrame?: number;
};

export type Hairdresser = {
  startHour: number;
  duration: number;
  warn: boolean;
  justMoved: boolean;
  frame: number;
  fromFrame: number;
};

export type Consultation = {
  startHour: number;
  duration: number;
  title: string;
  opacity: number;
  scale: number;
};

// ---------- Demo data ----------

// Lawyer is wall-to-wall booked: same saturated blue across the day so the single
// 2:00–3:00 PM gap reads as a beacon. The day is intentionally crowded to look "swamped."
export const LAWYER_EVENTS: CalEvent[] = [
  { id: "L1",  title: "Davies depo prep",       startHour: 9,    endHour: 9.5,  color: COLOR.blueberry },
  { id: "L2",  title: "Partner standup",         startHour: 9.5,  endHour: 10,   color: COLOR.blueberry },
  { id: "L3",  title: "Call · Wong",             startHour: 10,   endHour: 10.5, color: COLOR.blueberry },
  { id: "L4",  title: "Klein review",            startHour: 10.5, endHour: 11.5, color: COLOR.blueberry },
  { id: "L5",  title: "Deposition prep",         startHour: 11.5, endHour: 12,   color: COLOR.blueberry },
  { id: "L6",  title: "Lunch · Reyes",           startHour: 12,   endHour: 12.75, color: COLOR.blueberry },
  { id: "L7",  title: "Brief: Patel v. Hayes",   startHour: 12.75, endHour: 13.5, color: COLOR.blueberry },
  { id: "L8",  title: "Intake call",             startHour: 13.5, endHour: 14,   color: COLOR.blueberry },
  // 14:00–15:00 — the only gap, the beacon
  { id: "L9",  title: "CLE webinar",             startHour: 15,   endHour: 15.75, color: COLOR.blueberry },
  { id: "L10", title: "Settlement call",         startHour: 15.75, endHour: 16.5, color: COLOR.blueberry },
  { id: "L11", title: "Trust amendments",        startHour: 16.5, endHour: 17.25, color: COLOR.blueberry },
  { id: "L12", title: "EOD partner sync",        startHour: 17.25, endHour: 18,   color: COLOR.blueberry },
];

// Client (cod.legend95) is mostly free — only Tartine ("banana bread") and the hairdresser.
// Easy, casual day = easy to reschedule. Soft colors reinforce the "low-stakes day" read.
export const CLIENT_BASE: CalEvent[] = [
  { id: "C1", title: "conspicuous banana bread observation at Tartine", startHour: 10.5, endHour: 11.5, color: COLOR.banana },
];

export const HAIR_ORIGINAL_START = 14;
export const HAIR_NEW_START = 15.5;
export const HAIR_DURATION = 1.5;
export const CONSULT_START = 14;
export const CONSULT_DURATION = 1;

// ---------- Panel ----------

export const CalendarPanel: React.FC<{
  owner: string;
  accent: string;
  events: CalEvent[];
  highlightGap?: GapHighlight | null;
  hairdresser?: Hairdresser | null;
  consultation?: Consultation | null;
}> = ({ owner, accent, events, highlightGap, hairdresser, consultation }) => {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: palette.card,
        border: `1px solid ${palette.border1}`,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 0 rgba(20,22,26,.04), 0 1px 2px rgba(20,22,26,.04)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          borderBottom: `1px solid ${palette.border1}`,
          background: palette.sunken,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              background: accent,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 11,
              fontFamily: fonts.mono,
              flexShrink: 0,
            }}
          >
            G
          </span>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Google Calendar</div>
          <span style={{ color: palette.text3, fontSize: 12 }}>·</span>
          <div style={{ color: palette.text2, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{owner}</div>
        </div>
        <div style={{ fontFamily: fonts.mono, fontSize: 11, color: palette.text2, flexShrink: 0, marginLeft: 8 }}>
          Wed · Apr 24
        </div>
      </div>

      <div style={{ position: "relative", flex: 1, padding: "10px 10px 14px" }}>
        <Grid />
        {events.map((e) => (
          <EventChip key={e.id} event={e} />
        ))}
        {highlightGap && <GapHighlightBox {...highlightGap} />}
        {hairdresser && <HairdresserChip {...hairdresser} />}
        {consultation && <ConsultChip {...consultation} />}
      </div>
    </div>
  );
};

// ---------- Grid + chips ----------

const Grid: React.FC = () => {
  const hours = Array.from({ length: HOUR_COUNT + 1 }, (_, i) => HOUR_START + i);
  return (
    <div style={{ position: "relative", height: HOUR_COUNT * HOUR_HEIGHT }}>
      {hours.map((h, i) => (
        <div
          key={h}
          style={{
            position: "absolute",
            top: i * HOUR_HEIGHT,
            left: 0,
            right: 0,
            height: 0,
            borderTop: `1px solid ${palette.border1}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -8,
              left: 0,
              width: TIME_COL - 10,
              textAlign: "right",
              fontFamily: fonts.mono,
              fontSize: 10,
              color: palette.text3,
            }}
          >
            {formatHour(h)}
          </div>
        </div>
      ))}
    </div>
  );
};

const formatHour = (h: number) => {
  if (h === 12) return "12 PM";
  if (h === 24 || h === 0) return "12 AM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
};

const EventChip: React.FC<{ event: CalEvent }> = ({ event }) => {
  const top = (event.startHour - HOUR_START) * HOUR_HEIGHT;
  const height = (event.endHour - event.startHour) * HOUR_HEIGHT;
  return (
    <div
      style={{
        position: "absolute",
        top: 10 + top,
        left: TIME_COL + 4,
        right: 10,
        height: Math.max(20, height - 4),
        background: event.color,
        color: "white",
        borderRadius: 5,
        padding: "4px 8px",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: fonts.ui,
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        lineHeight: 1.25,
      }}
    >
      {event.title}
    </div>
  );
};

const GapHighlightBox: React.FC<GapHighlight> = ({
  startHour,
  endHour,
  frame,
  fromFrame,
  fadeOutFromFrame,
}) => {
  const t = frame - fromFrame;
  const enter = interpolate(t, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = fadeOutFromFrame !== undefined
    ? interpolate(frame, [fadeOutFromFrame, fadeOutFromFrame + 14], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  const pulse = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.12));
  const top = (startHour - HOUR_START) * HOUR_HEIGHT;
  const height = (endHour - startHour) * HOUR_HEIGHT;
  return (
    <div
      style={{
        position: "absolute",
        top: 10 + top,
        left: TIME_COL + 4,
        right: 10,
        height: height - 4,
        border: `2px dashed ${palette.localInk}`,
        background: "rgba(11, 128, 67, 0.08)",
        borderRadius: 7,
        opacity: enter * exit,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: palette.localInk,
          color: "white",
          fontFamily: fonts.mono,
          fontSize: 10,
          fontWeight: 700,
          padding: "4px 9px",
          borderRadius: 999,
          opacity: pulse,
          letterSpacing: 0.6,
        }}
      >
        ✓ AVAILABLE · 2:00–3:00 PM
      </div>
    </div>
  );
};

const HairdresserChip: React.FC<Hairdresser> = ({
  startHour,
  duration,
  warn,
  justMoved,
  frame,
  fromFrame,
}) => {
  const top = (startHour - HOUR_START) * HOUR_HEIGHT;
  const height = duration * HOUR_HEIGHT;
  const t = frame - fromFrame;
  const pulse = warn ? 0.65 + 0.35 * Math.abs(Math.sin(t * 0.18)) : 1;
  const bg = warn ? COLOR.tomato : COLOR.flamingo;

  return (
    <div
      style={{
        position: "absolute",
        top: 10 + top,
        left: TIME_COL + 4,
        right: 10,
        height: Math.max(20, height - 4),
        background: bg,
        color: "white",
        borderRadius: 5,
        padding: "4px 8px",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: fonts.ui,
        boxShadow: warn
          ? `0 0 0 3px rgba(213, 0, 0, ${0.18 * pulse}), 0 1px 2px rgba(0,0,0,0.1)`
          : "0 1px 2px rgba(0,0,0,0.1)",
        transition: "background 200ms",
        lineHeight: 1.2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span>Groceries</span>
        {warn && <Pill>CONFLICT</Pill>}
        {justMoved && !warn && <Pill>MOVED</Pill>}
      </div>
      <div style={{ fontSize: 10, opacity: 0.9, fontWeight: 500, fontFamily: fonts.mono }}>
        {hourLabel(startHour)}–{hourLabel(startHour + duration)}
      </div>
    </div>
  );
};

const ConsultChip: React.FC<Consultation> = ({ startHour, duration, title, opacity, scale }) => {
  const top = (startHour - HOUR_START) * HOUR_HEIGHT;
  const height = duration * HOUR_HEIGHT;
  return (
    <div
      style={{
        position: "absolute",
        top: 10 + top,
        left: TIME_COL + 4,
        right: 10,
        height: Math.max(20, height - 4),
        background: COLOR.blueberry,
        color: "white",
        borderRadius: 5,
        padding: "4px 8px",
        fontSize: 12,
        fontWeight: 700,
        fontFamily: fonts.ui,
        boxShadow: "0 4px 18px rgba(66,133,244,0.45), 0 1px 2px rgba(0,0,0,0.1)",
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "center",
        outline: `2px solid rgba(66,133,244,0.5)`,
        lineHeight: 1.2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        <Pill>NEW</Pill>
      </div>
      <div style={{ fontSize: 10, opacity: 0.9, fontWeight: 500, fontFamily: fonts.mono }}>
        {hourLabel(startHour)}–{hourLabel(startHour + duration)} · 60 min
      </div>
    </div>
  );
};

const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      fontFamily: fonts.mono,
      fontSize: 9,
      background: "rgba(255,255,255,0.22)",
      padding: "1px 5px",
      borderRadius: 999,
      letterSpacing: 0.8,
      flexShrink: 0,
    }}
  >
    {children}
  </span>
);

export const hourLabel = (h: number) => {
  const whole = Math.floor(h);
  const min = Math.round((h - whole) * 60);
  const ampm = whole >= 12 ? "PM" : "AM";
  const shown = whole > 12 ? whole - 12 : whole === 0 ? 12 : whole;
  return `${shown}:${min.toString().padStart(2, "0")} ${ampm}`;
};
