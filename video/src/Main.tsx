import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { palette, fonts, SCENES } from "./styles";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";
import { Scene5 } from "./scenes/Scene5";

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: palette.page, fontFamily: fonts.ui, color: palette.text1 }}>
      <Sequence from={SCENES.s1.start} durationInFrames={SCENES.s1.dur}><Scene1 /></Sequence>
      <Sequence from={SCENES.s2.start} durationInFrames={SCENES.s2.dur}><Scene2 /></Sequence>
      <Sequence from={SCENES.s3.start} durationInFrames={SCENES.s3.dur}><Scene3 /></Sequence>
      <Sequence from={SCENES.s4.start} durationInFrames={SCENES.s4.dur}><Scene4 /></Sequence>
      <Sequence from={SCENES.s5.start} durationInFrames={SCENES.s5.dur}><Scene5 /></Sequence>
    </AbsoluteFill>
  );
};
