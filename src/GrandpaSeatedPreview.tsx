import { AbsoluteFill, Img, staticFile } from "remotion";
import { MustachePlacement, TalkingMustache } from "./TalkingMustache";

const ASSETS = {
  background: staticFile("assets/background.png"),
  grandpa: staticFile("assets/grandpa-sitting-base.png.png"),
};

// Native pixel size of the artwork. Only used to keep the aspect ratio exact.
export const SEATED_GRANDPA_IMAGE = { width: 1199, height: 1312 };

/** Seated Grandpa's placement in the 1920x1080 frame. */
export const SEATED_GRANDPA = {
  /** Frame point on the armchair's seat cushion that his hips sit on. */
  seatX: 1488,
  seatY: 805,
  /** Point between his hips on the source image, placed on the seat point. */
  hipsImageX: 555,
  hipsImageY: 870,
  /** 1 = native image size. 0.54 matches the head size of the standing pose. */
  scale: 0.54,
};

export const SEATED_MUSTACHE: MustachePlacement = {
  noseCenterImageX: 598.5,
  noseBottomImageY: 378,
  width: 345,
};

export const GrandpaSeatedPreview: React.FC = () => {
  return (
    <AbsoluteFill>
      <Img
        src={ASSETS.background}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      <div
        style={{
          position: "absolute",
          left:
            SEATED_GRANDPA.seatX -
            SEATED_GRANDPA.hipsImageX * SEATED_GRANDPA.scale,
          top:
            SEATED_GRANDPA.seatY -
            SEATED_GRANDPA.hipsImageY * SEATED_GRANDPA.scale,
          width: SEATED_GRANDPA_IMAGE.width * SEATED_GRANDPA.scale,
          height: SEATED_GRANDPA_IMAGE.height * SEATED_GRANDPA.scale,
        }}
      >
        <Img
          src={ASSETS.grandpa}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
        <TalkingMustache
          placement={SEATED_MUSTACHE}
          scale={SEATED_GRANDPA.scale}
        />
      </div>
    </AbsoluteFill>
  );
};
