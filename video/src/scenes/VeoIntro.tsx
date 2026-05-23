import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile } from "remotion";
import { palette } from "../styles";

// veo_1.mp4 and veo_2.mp4 are each 8s @ 720p. At 30fps, 8s = 240 frames.
const VEO_FRAMES = 240;

export const VeoIntro: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: palette.mono }}>
      <Sequence from={0} durationInFrames={VEO_FRAMES}>
        <VideoFitted videoSrc={staticFile("veo_1.mp4")} audioSrc={staticFile("veo_1.wav")} />
      </Sequence>
      <Sequence from={VEO_FRAMES} durationInFrames={VEO_FRAMES}>
        <VideoFitted videoSrc={staticFile("veo_2.mp4")} audioSrc={staticFile("veo_2.wav")} />
      </Sequence>
    </AbsoluteFill>
  );
};

// Letterbox the 1280x720 source video to fit a 1920x1080 canvas without cropping.
// Video is muted because Chromium's WebCodecs decoder rejects the source AAC track;
// audio plays through a separate <Audio> using the extracted mp3 (different decode path).
const VideoFitted: React.FC<{ videoSrc: string; audioSrc: string }> = ({ videoSrc, audioSrc }) => {
  return (
    <AbsoluteFill
      style={{
        background: palette.mono,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <OffthreadVideo
        src={videoSrc}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
      <Audio src={audioSrc} />
    </AbsoluteFill>
  );
};

export const VEO_INTRO_FRAMES = VEO_FRAMES * 2; // 480 frames total
