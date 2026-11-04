import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  GRANDPA,
  GRANDPA_IMAGE,
  MUSTACHE,
} from "./GrandpaStudio";
import {
  SEATED_GRANDPA,
  SEATED_GRANDPA_IMAGE,
  SEATED_MUSTACHE,
} from "./GrandpaSeatedPreview";
import { MagicDust } from "./MagicDust";
import { MustachePlacement, TalkingMustache } from "./TalkingMustache";

/** Episode timing, in seconds. */
export interface EpisodeConfig {
  /** How long Grandpa stands before he starts to sit down. */
  standingDurationSeconds: number;
  /** How long sitting down takes. */
  sittingTransitionSeconds: number;
  /** How long he stays seated before the episode ends. */
  seatedDurationSeconds: number;
  /** How long he holds the coffee, once seated, before it moves to the table. */
  coffeePlacementDelaySeconds: number;
  /** How long the cup takes to travel to the table and settle. */
  coffeePlacementDurationSeconds: number;
  /** Whether golden dust appears under the floating cup. */
  magicDustEnabled: boolean;
  /** Strength of the dust, from 0 to 1. Affects particle count and opacity. */
  magicDustIntensity: number;
}

export const DEFAULT_EPISODE_CONFIG: EpisodeConfig = {
  standingDurationSeconds: 8,
  sittingTransitionSeconds: 2,
  seatedDurationSeconds: 10,
  coffeePlacementDelaySeconds: 2,
  coffeePlacementDurationSeconds: 1.2,
  magicDustEnabled: true,
  magicDustIntensity: 0.6,
};

/** Throws if the coffee placement or the dust settings aren't usable. */
export const validateEpisodeConfig = (config: EpisodeConfig) => {
  if (config.magicDustIntensity < 0 || config.magicDustIntensity > 1) {
    throw new Error(
      `EpisodeConfig: magicDustIntensity (${config.magicDustIntensity}) must be between 0 and 1.`,
    );
  }

  const {
    coffeePlacementDelaySeconds: delay,
    coffeePlacementDurationSeconds: duration,
    seatedDurationSeconds: seated,
  } = config;

  if (delay < 0 || duration < 0) {
    throw new Error(
      `EpisodeConfig: coffeePlacementDelaySeconds (${delay}) and coffeePlacementDurationSeconds (${duration}) can't be negative.`,
    );
  }

  if (delay + duration > seated) {
    throw new Error(
      `EpisodeConfig: coffeePlacementDelaySeconds (${delay}) + coffeePlacementDurationSeconds (${duration}) = ${delay + duration}, which exceeds seatedDurationSeconds (${seated}).`,
    );
  }
};

export const EPISODE_FPS = 30;

export type GrandpaEpisodeProps = {
  readonly config: EpisodeConfig;
};

export const getEpisodeDurationInFrames = (
  config: EpisodeConfig,
  fps: number,
) =>
  Math.round(
    (config.standingDurationSeconds +
      config.sittingTransitionSeconds +
      config.seatedDurationSeconds) *
      fps,
  );

export const calculateEpisodeMetadata: CalculateMetadataFunction<
  GrandpaEpisodeProps
> = ({ props }) => {
  validateEpisodeConfig(props.config);

  return {
    durationInFrames: getEpisodeDurationInFrames(props.config, EPISODE_FPS),
  };
};

type PoseName = "standing" | "halfSitting" | "seated" | "seatedNoCoffee";

type Pose = {
  readonly src: string;
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly scale: number;
  /** Midpoint between the soles, on the pose's image. The pose pivots here. */
  readonly solesImageX: number;
  readonly solesImageY: number;
  readonly mustache: MustachePlacement;
};

/** The half-sitting pose. 0.525 matches the head size of the other two poses. */
export const TRANSITION_GRANDPA = {
  scale: 0.525,
  /** Soles position in the frame when the pose appears and when it ends. */
  solesStartX: 1487,
  solesEndX: 1475,
  solesY: 1028,
};

export const TRANSITION_MUSTACHE: MustachePlacement = {
  noseCenterImageX: 501,
  noseBottomImageY: 391,
  width: 358,
  /** His head is tilted in this pose. */
  rotationDeg: -9,
};

/**
 * How the no-coffee drawing lines up with the seated one: it is drawn larger
 * and offset, so these place its head exactly over the seated pose's head.
 */
const NO_COFFEE_ALIGNMENT = {
  /** Size of the no-coffee image relative to the seated image. */
  scale: 0.901,
  /** Top-left of the no-coffee image, on the seated image. */
  offsetX: 103,
  offsetY: 5,
};

const toNoCoffeeX = (seatedImageX: number) =>
  (seatedImageX - NO_COFFEE_ALIGNMENT.offsetX) / NO_COFFEE_ALIGNMENT.scale;
const toNoCoffeeY = (seatedImageY: number) =>
  (seatedImageY - NO_COFFEE_ALIGNMENT.offsetY) / NO_COFFEE_ALIGNMENT.scale;

export const NO_COFFEE_MUSTACHE: MustachePlacement = {
  noseCenterImageX: toNoCoffeeX(SEATED_MUSTACHE.noseCenterImageX),
  noseBottomImageY: toNoCoffeeY(SEATED_MUSTACHE.noseBottomImageY),
  width: SEATED_MUSTACHE.width / NO_COFFEE_ALIGNMENT.scale,
};

const POSES: Record<PoseName, Pose> = {
  standing: {
    src: staticFile("assets/grandpa-standing-base.png.png"),
    imageWidth: GRANDPA_IMAGE.width,
    imageHeight: GRANDPA_IMAGE.height,
    scale: GRANDPA.scale,
    solesImageX: 469.5,
    solesImageY: GRANDPA.solesImageY,
    mustache: MUSTACHE,
  },
  halfSitting: {
    src: staticFile("assets/grandpa-sitting-transition.png.png"),
    imageWidth: 1199,
    imageHeight: 1312,
    scale: TRANSITION_GRANDPA.scale,
    solesImageX: 532.5,
    solesImageY: 1276,
    mustache: TRANSITION_MUSTACHE,
  },
  seated: {
    src: staticFile("assets/grandpa-sitting-base.png.png"),
    imageWidth: SEATED_GRANDPA_IMAGE.width,
    imageHeight: SEATED_GRANDPA_IMAGE.height,
    scale: SEATED_GRANDPA.scale,
    solesImageX: 508.5,
    solesImageY: 1276,
    mustache: SEATED_MUSTACHE,
  },
  seatedNoCoffee: {
    src: staticFile("assets/grandpa-sitting-no-coffee.png"),
    imageWidth: 1086,
    imageHeight: 1448,
    scale: SEATED_GRANDPA.scale * NO_COFFEE_ALIGNMENT.scale,
    solesImageX: toNoCoffeeX(508.5),
    solesImageY: toNoCoffeeY(1276),
    mustache: NO_COFFEE_MUSTACHE,
  },
};

// The start and end of the move come from the working compositions.
const STANDING_SOLES = {
  x:
    GRANDPA.centerX +
    (POSES.standing.solesImageX - GRANDPA_IMAGE.width / 2) * GRANDPA.scale,
  y: GRANDPA.floorY,
};
const SEATED_SOLES = {
  x:
    SEATED_GRANDPA.seatX +
    (POSES.seated.solesImageX - SEATED_GRANDPA.hipsImageX) *
      SEATED_GRANDPA.scale,
  y:
    SEATED_GRANDPA.seatY +
    (POSES.seated.solesImageY - SEATED_GRANDPA.hipsImageY) *
      SEATED_GRANDPA.scale,
};

/**
 * Shape of the sitting motion. Phases are fractions of the transition, so they
 * stretch with `sittingTransitionSeconds`.
 *
 * Tilt and vertical squash are chosen so that his nose and feet barely move at
 * each image swap: change them together, and check the swaps frame by frame.
 */
export const SIT_MOTION = {
  /** Fraction of the transition when standing becomes half-sitting. */
  stepsEnd: 0.45,
  /** Fraction of the transition when half-sitting becomes seated. */
  lowerEnd: 0.8,
  /** Steps taken from the standing spot to the front of the armchair. */
  stepCount: 2,
  stepHeight: 14,
  stepSwayDeg: 1.5,
  /** Fraction of the steps phase when he starts to crouch into the swap. */
  crouchStart: 0.65,
  standingEndTiltDeg: -3.5,
  standingEndSquash: 0.94,
  transitionStartSquash: 1.04,
  transitionEndSquash: 0.98,
  transitionEndTiltDeg: 4.5,
  seatedStartSquash: 0.94,
  seatedStartTiltDeg: -2,
};

const smooth = Easing.inOut(Easing.cubic);
const settle = Easing.out(Easing.cubic);

const between = (
  value: number,
  from: number,
  to: number,
  output: [number, number],
  easing: (input: number) => number,
) =>
  interpolate(value, [from, to], output, {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

type CharacterState = {
  readonly pose: PoseName;
  readonly solesX: number;
  readonly solesY: number;
  readonly tiltDeg: number;
  readonly squash: number;
};

/** Where the character is at this point of the transition, from 0 to 1. */
const getCharacterState = (progress: number): CharacterState => {
  const { stepsEnd, lowerEnd } = SIT_MOTION;
  const transitionMidY = TRANSITION_GRANDPA.solesY;

  if (progress <= 0) {
    return {
      pose: "standing",
      solesX: STANDING_SOLES.x,
      solesY: STANDING_SOLES.y,
      tiltDeg: 0,
      squash: 1,
    };
  }

  if (progress < stepsEnd) {
    const stepWave = Math.sin(
      Math.PI * SIT_MOTION.stepCount * (progress / stepsEnd),
    );

    return {
      pose: "standing",
      solesX: between(
        progress,
        0,
        stepsEnd,
        [STANDING_SOLES.x, TRANSITION_GRANDPA.solesStartX],
        smooth,
      ),
      solesY:
        between(
          progress,
          0,
          stepsEnd,
          [STANDING_SOLES.y, transitionMidY],
          smooth,
        ) -
        Math.abs(stepWave) * SIT_MOTION.stepHeight,
      tiltDeg:
        between(
          progress,
          0,
          stepsEnd,
          [0, SIT_MOTION.standingEndTiltDeg],
          smooth,
        ) +
        stepWave * SIT_MOTION.stepSwayDeg,
      squash: between(
        progress,
        stepsEnd * SIT_MOTION.crouchStart,
        stepsEnd,
        [1, SIT_MOTION.standingEndSquash],
        smooth,
      ),
    };
  }

  if (progress < lowerEnd) {
    return {
      pose: "halfSitting",
      solesX: between(
        progress,
        stepsEnd,
        lowerEnd,
        [TRANSITION_GRANDPA.solesStartX, TRANSITION_GRANDPA.solesEndX],
        smooth,
      ),
      solesY: transitionMidY,
      tiltDeg: between(
        progress,
        stepsEnd,
        lowerEnd,
        [0, SIT_MOTION.transitionEndTiltDeg],
        smooth,
      ),
      squash: between(
        progress,
        stepsEnd,
        lowerEnd,
        [SIT_MOTION.transitionStartSquash, SIT_MOTION.transitionEndSquash],
        smooth,
      ),
    };
  }

  if (progress < 1) {
    return {
      pose: "seated",
      solesX: between(
        progress,
        lowerEnd,
        1,
        [TRANSITION_GRANDPA.solesEndX, SEATED_SOLES.x],
        settle,
      ),
      solesY: between(
        progress,
        lowerEnd,
        1,
        [transitionMidY, SEATED_SOLES.y],
        settle,
      ),
      tiltDeg: between(
        progress,
        lowerEnd,
        1,
        [SIT_MOTION.seatedStartTiltDeg, 0],
        settle,
      ),
      squash: between(
        progress,
        lowerEnd,
        1,
        [SIT_MOTION.seatedStartSquash, 1],
        settle,
      ),
    };
  }

  return {
    pose: "seated",
    solesX: SEATED_SOLES.x,
    solesY: SEATED_SOLES.y,
    tiltDeg: 0,
    squash: 1,
  };
};

// All poses stay mounted and only one is visible, so the images are already
// loaded when they are swapped in.
const PoseLayer: React.FC<{
  readonly name: PoseName;
  readonly state: CharacterState;
}> = ({ name, state }) => {
  const pose = POSES[name];
  const active = state.pose === name;
  const pivotX = pose.solesImageX * pose.scale;
  const pivotY = pose.solesImageY * pose.scale;

  return (
    <div
      style={{
        position: "absolute",
        left: state.solesX - pivotX,
        top: state.solesY - pivotY,
        width: pose.imageWidth * pose.scale,
        height: pose.imageHeight * pose.scale,
        transformOrigin: `${pivotX}px ${pivotY}px`,
        rotate: `${state.tiltDeg}deg`,
        scale: `1 ${state.squash}`,
        visibility: active ? "visible" : "hidden",
      }}
    >
      <Img
        src={pose.src}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      <TalkingMustache placement={pose.mustache} scale={pose.scale} />
    </div>
  );
};

/**
 * The separate cup's motion. Positions are in frame pixels and refer to the
 * center of the bottom of the mug. The first point sits on the cup drawn in the
 * seated pose; the last is the clear spot on the table, left of the books.
 */
export const COFFEE_CUP = {
  imageWidth: 1376,
  imageHeight: 1143,
  /** Center of the bottom of the mug, on the cup's image. */
  baseImageX: 735,
  baseImageY: 930,
  /** Curve from his hand to the table. The two middle points shape the arc. */
  path: [
    { x: 1496.6, y: 725 },
    { x: 1290, y: 790 },
    { x: 780, y: 745 },
    { x: 615, y: 848 },
  ],
  startScale: 0.095,
  tableScale: 0.078,
  /** Tilt at the middle of the flight, in degrees. */
  flightTiltDeg: -12,
  /** Fraction of the placement when the cup lands; the rest is settling. */
  landAt: 0.8,
  settleSquash: 0.14,
  settleWiden: 0.08,
  settleRockDeg: 3,
};

/** The cup's motion at this point of the placement, from 0 to 1. */
const getCupMotion = (progress: number) => {
  const flight = between(progress, 0, COFFEE_CUP.landAt, [0, 1], smooth);
  const settling = interpolate(progress, [COFFEE_CUP.landAt, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const [p0, p1, p2, p3] = COFFEE_CUP.path;
  const rest = 1 - flight;
  const onCurve = (a: number, b: number, c: number, d: number) =>
    rest * rest * rest * a +
    3 * rest * rest * flight * b +
    3 * rest * flight * flight * c +
    flight * flight * flight * d;
  const x = onCurve(p0.x, p1.x, p2.x, p3.x);
  const y = onCurve(p0.y, p1.y, p2.y, p3.y);

  const scale =
    COFFEE_CUP.startScale +
    (COFFEE_CUP.tableScale - COFFEE_CUP.startScale) * flight;

  // Both are zero at the start and end of settling, so the cup comes to rest.
  const squash = Math.sin(Math.PI * settling) * (1 - settling);
  const rock = Math.sin(2 * Math.PI * settling) * (1 - settling);

  return { flight, x, y, scale, squash, rock };
};

const CoffeeCup: React.FC<{
  readonly progress: number;
  readonly visible: boolean;
}> = ({ progress, visible }) => {
  const { flight, x, y, scale, squash, rock } = getCupMotion(progress);

  return (
    <Img
      src={staticFile("assets/coffee-cup.png")}
      style={{
        position: "absolute",
        left: x - COFFEE_CUP.baseImageX * scale,
        top: y - COFFEE_CUP.baseImageY * scale,
        width: COFFEE_CUP.imageWidth * scale,
        height: COFFEE_CUP.imageHeight * scale,
        transformOrigin: `${COFFEE_CUP.baseImageX * scale}px ${COFFEE_CUP.baseImageY * scale}px`,
        rotate: `${
          COFFEE_CUP.flightTiltDeg * Math.sin(Math.PI * flight) +
          COFFEE_CUP.settleRockDeg * rock
        }deg`,
        scale: `${1 + COFFEE_CUP.settleWiden * squash} ${1 - COFFEE_CUP.settleSquash * squash}`,
        visibility: visible ? "visible" : "hidden",
      }}
    />
  );
};

export const GrandpaEpisode: React.FC<GrandpaEpisodeProps> = ({ config }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const transitionStart = config.standingDurationSeconds * fps;
  const transitionFrames = config.sittingTransitionSeconds * fps;
  const progress =
    transitionFrames > 0
      ? (frame - transitionStart) / transitionFrames
      : frame < transitionStart
        ? 0
        : 1;
  const movingState = getCharacterState(progress);

  const placementStart =
    transitionStart +
    transitionFrames +
    config.coffeePlacementDelaySeconds * fps;
  const placementFrames = config.coffeePlacementDurationSeconds * fps;
  const coffeeReleased = frame >= placementStart;
  const coffeeProgress =
    placementFrames > 0
      ? (frame - placementStart) / placementFrames
      : coffeeReleased
        ? 1
        : 0;

  // On the same frame that the separate cup appears, the character switches to
  // the drawing without a cup, so there are never two cups on screen.
  const state: CharacterState = coffeeReleased
    ? { ...movingState, pose: "seatedNoCoffee" }
    : movingState;

  return (
    <AbsoluteFill>
      <Img
        src={staticFile("assets/background.png")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <PoseLayer name="standing" state={state} />
      <PoseLayer name="halfSitting" state={state} />
      <PoseLayer name="seated" state={state} />
      <PoseLayer name="seatedNoCoffee" state={state} />
      {config.magicDustEnabled ? (
        <MagicDust
          getSourceAt={(atFrame) =>
            getCupMotion(
              placementFrames > 0
                ? (atFrame - placementStart) / placementFrames
                : 1,
            )
          }
          startFrame={placementStart}
          landFrame={placementStart + placementFrames * COFFEE_CUP.landAt}
          intensity={config.magicDustIntensity}
        />
      ) : null}
      <CoffeeCup progress={coffeeProgress} visible={coffeeReleased} />
    </AbsoluteFill>
  );
};
