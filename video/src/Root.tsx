import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { VIDEO } from "./styles";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";
import { Scene5 } from "./scenes/Scene5";
import { SceneCalendars } from "./scenes/SceneCalendars";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={VIDEO.durationFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition id="Scene1" component={Scene1} durationInFrames={150} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
      <Composition id="Scene2" component={Scene2} durationInFrames={270} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
      <Composition id="Scene3" component={Scene3} durationInFrames={180} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
      <Composition id="Scene4" component={Scene4} durationInFrames={360} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
      <Composition id="Scene5" component={Scene5} durationInFrames={240} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
      <Composition id="SceneCalendars" component={SceneCalendars} durationInFrames={300} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
    </>
  );
};
