import React from "react";
import { palette, fonts } from "../styles";

export const Header: React.FC = () => {
  return (
    <div
      style={{
        height: 72,
        padding: "0 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: palette.card,
        borderBottom: `1px solid ${palette.border1}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryInk})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            fontFamily: fonts.mono,
            fontSize: 18,
          }}
        >
          G
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>Groundstate</div>
          <div style={{ fontSize: 13, color: palette.text2, marginTop: -2 }}>Secure AI Workspace Agent</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Pill label="Local: Gemma 3n" tint="local" />
        <Pill label="Cloud: Gemini 3.5 Flash" tint="cloud" />
        <Pill label="Managed Agent" tint="primary" />
      </div>
    </div>
  );
};

const Pill: React.FC<{ label: string; tint: "local" | "cloud" | "primary" }> = ({ label, tint }) => {
  const bg = tint === "local" ? palette.local : tint === "cloud" ? palette.cloud : palette.primary;
  const fg = tint === "primary" ? "white" : palette.text1;
  const border = tint === "local" ? palette.borderLocal : tint === "cloud" ? palette.borderCloud : palette.primaryInk;
  return (
    <div
      style={{
        background: bg,
        color: fg,
        border: `1px solid ${border}`,
        padding: "6px 14px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: fonts.ui,
      }}
    >
      {label}
    </div>
  );
};
