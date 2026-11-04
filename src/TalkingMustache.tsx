import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const MUSTACHE_SRC = staticFile("assets/mustache.png");

// Native pixel size of the artwork. Only used to keep the aspect ratio exact.
const MUSTACHE_IMAGE = { width: 2172, height: 724 };

/** Middle of the dip in the mustache's upper edge, on the mustache's image. */
const MUSTACHE_UPPER_CENTER = { x: 1080, y: 226 };

/** Speaking motion. Distances are in frame pixels. */
export const MUSTACHE_TALK = {
  /** Movements per second. Whole cycles in 10s keep the loop seamless. */
  movementsPerSecond: 3.5,
  /** Shortest and longest downward travel of a movement. */
  minTravel: 3,
  maxTravel: 5,
  /** How often the travel swings between its shortest and longest. */
  travelVariationPerSecond: 1.3,
  /** Rhythm irregularity: 0.6 at 0.7/s varies the pace between ~3.1 and ~3.9. */
  rhythmWobble: 0.6,
  rhythmWobblePerSecond: 0.7,
  /** Extra overlap with the nose, so no gap opens at the lowest point. */
  noseOverlap: 1,
};

/**
 * Where the mustache goes on a pose, in that pose's source-image pixels, so it
 * follows the character whenever the pose is moved or scaled.
 */
export type MustachePlacement = {
  /** Horizontal center of the red nose on the pose's image. */
  readonly noseCenterImageX: number;
  /** Bottom edge of the red nose's outline on the pose's image. */
  readonly noseBottomImageY: number;
  /** Width of the mustache image, in the pose's source-image pixels. */
  readonly width: number;
  /** Tilt around the top center, for poses where the head is tilted. */
  readonly rotationDeg?: number;
};

const TAU = Math.PI * 2;

/** Downward offset at this time. 0 is the top of the motion. */
const getTalkOffset = (seconds: number) => {
  const phase =
    TAU * MUSTACHE_TALK.movementsPerSecond * seconds +
    MUSTACHE_TALK.rhythmWobble *
      Math.sin(TAU * MUSTACHE_TALK.rhythmWobblePerSecond * seconds);

  const variation =
    0.5 + 0.5 * Math.sin(TAU * MUSTACHE_TALK.travelVariationPerSecond * seconds);
  const travel =
    MUSTACHE_TALK.minTravel +
    (MUSTACHE_TALK.maxTravel - MUSTACHE_TALK.minTravel) * variation;

  return travel * (0.5 - 0.5 * Math.cos(phase));
};

/** Renders inside the pose's layer. `scale` is the scale of that pose. */
export const TalkingMustache: React.FC<{
  readonly placement: MustachePlacement;
  readonly scale: number;
}> = ({ placement, scale }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const width = placement.width * scale;
  const height = width * (MUSTACHE_IMAGE.height / MUSTACHE_IMAGE.width);
  const imageScale = width / MUSTACHE_IMAGE.width;

  // At the top of the motion the mustache overlaps the nose by the longest
  // travel, so at the lowest point it still touches the nose.
  const restY =
    placement.noseBottomImageY * scale -
    MUSTACHE_TALK.maxTravel -
    MUSTACHE_TALK.noseOverlap -
    MUSTACHE_UPPER_CENTER.y * imageScale;

  return (
    <Img
      src={MUSTACHE_SRC}
      style={{
        position: "absolute",
        left:
          placement.noseCenterImageX * scale -
          MUSTACHE_UPPER_CENTER.x * imageScale,
        top: restY,
        width,
        height,
        translate: `0px ${getTalkOffset(frame / fps)}px`,
        ...(placement.rotationDeg
          ? {
              rotate: `${placement.rotationDeg}deg`,
              transformOrigin: `${MUSTACHE_UPPER_CENTER.x * imageScale}px ${MUSTACHE_UPPER_CENTER.y * imageScale}px`,
            }
          : null),
      }}
    />
  );
};
