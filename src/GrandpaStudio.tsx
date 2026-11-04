import { AbsoluteFill, Img, staticFile } from "remotion";
import { MustachePlacement, TalkingMustache } from "./TalkingMustache";

const ASSETS = {
  background: staticFile("assets/background.png"),
  grandpa: staticFile("assets/grandpa-standing-base.png.png"),
};

// Native pixel size of the artwork. Only used to keep the aspect ratio exact.
export const GRANDPA_IMAGE = { width: 1024, height: 1536 };

/** Grandpa's placement in the 1920x1080 frame. */
export const GRANDPA = {
  /** Frame X of the horizontal center of the image. */
  centerX: 1690,
  /** Frame Y where the soles of his shoes touch the floor. */
  floorY: 1040,
  /** 1 = native image size. */
  scale: 0.5,
  /** Row of the source image where the soles end (the image has a glow below). */
  solesImageY: 1495,
};

export const MUSTACHE: MustachePlacement = {
  noseCenterImageX: 498,
  noseBottomImageY: 459,
  width: 380,
};

export const GrandpaStudio: React.FC = () => {
  const grandpaWidth = GRANDPA_IMAGE.width * GRANDPA.scale;
  const grandpaHeight = GRANDPA_IMAGE.height * GRANDPA.scale;

  return (
    <AbsoluteFill>
      <Img
        src={ASSETS.background}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      <div
        style={{
          position: "absolute",
          left: GRANDPA.centerX - grandpaWidth / 2,
          top: GRANDPA.floorY - GRANDPA.solesImageY * GRANDPA.scale,
          width: grandpaWidth,
          height: grandpaHeight,
        }}
      >
        <Img
          src={ASSETS.grandpa}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
        <TalkingMustache placement={MUSTACHE} scale={GRANDPA.scale} />
      </div>
    </AbsoluteFill>
  );
};
