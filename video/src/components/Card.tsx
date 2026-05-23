import React from "react";
import { palette } from "../styles";

type Props = {
  tint?: "local" | "cloud" | "card";
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export const Card: React.FC<Props> = ({ tint = "card", children, style }) => {
  const bg = tint === "local" ? palette.local : tint === "cloud" ? palette.cloud : palette.card;
  const border = tint === "local" ? palette.borderLocal : tint === "cloud" ? palette.borderCloud : palette.border1;
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 14,
        padding: 24,
        boxShadow: "0 1px 0 rgba(20,22,26,.04), 0 1px 2px rgba(20,22,26,.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 1.3,
      color: palette.text2,
      fontWeight: 700,
      marginBottom: 10,
    }}
  >
    {children}
  </div>
);
