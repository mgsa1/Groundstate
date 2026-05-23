import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { palette, fonts } from "../styles";

type Props = {
  text: string;
  inFrame?: number;
  outFrame?: number;
  totalFrames: number;
};

export const Caption: React.FC<Props> = ({ text, inFrame = 6, outFrame = 12, totalFrames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, inFrame, totalFrames - outFrame, totalFrames],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );
  return (
    <div
      style={{
        position: "absolute",
        bottom: 64,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          background: palette.mono,
          color: palette.textInverse,
          fontFamily: fonts.ui,
          fontWeight: 500,
          fontSize: 34,
          letterSpacing: -0.2,
          padding: "16px 28px",
          borderRadius: 14,
          maxWidth: 1400,
          textAlign: "center",
          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
        }}
      >
        {text}
      </div>
    </div>
  );
};
