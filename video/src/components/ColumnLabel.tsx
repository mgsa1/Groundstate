import React from "react";
import { palette, fonts } from "../styles";

type Props = { side: "local" | "cloud" };

export const ColumnLabel: React.FC<Props> = ({ side }) => {
  const isLocal = side === "local";
  const dotColor = isLocal ? palette.localInk : palette.primaryInk;
  const strong = isLocal ? "On device" : "Sent to cloud";
  const trail = isLocal ? "stays here" : "sanitized";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 14,
        color: palette.text2,
        fontFamily: fonts.ui,
        textTransform: "uppercase",
        letterSpacing: 1.1,
        marginBottom: 18,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: dotColor,
          boxShadow: `0 0 0 4px ${isLocal ? palette.local : palette.cloud}`,
        }}
      />
      <span style={{ fontWeight: 700, color: palette.text1 }}>{strong}</span>
      <span>·</span>
      <span>{trail}</span>
    </div>
  );
};
