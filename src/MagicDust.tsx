import { random, useCurrentFrame, useVideoConfig } from "remotion";

/** Look and motion of the dust. Distances are in frame pixels. */
export const MAGIC_DUST = {
  /** Particles on screen at intensity 0 and at intensity 1. */
  minParticles: 10,
  maxParticles: 20,
  /** Every Nth particle is a four-pointed star; the rest are soft dots. */
  starEvery: 4,
  dotSize: [4, 9],
  starSize: [14, 22],
  colors: ["#FFD45E", "#FFE89A", "#FFF3C4", "#F7B733"],
  /** How long one particle lives. */
  lifeSeconds: [0.4, 0.75],
  /** How far particles spawn to the sides of, and below, the source point. */
  spreadX: 30,
  belowMin: 2,
  belowMax: 24,
  /**
   * The longest a particle can lag behind the moving source. Most stay close
   * under it, and a few fall further back to form the short fading trail.
   */
  maxTrail: 120,
  wobble: 3,
  floatUp: 10,
  /** After landing: how long the fade takes and how far particles scatter. */
  scatterSeconds: 0.5,
  scatterDistance: [14, 38],
  fadeInFrames: 3,
};

const STAR_PATH =
  "M12 0C12.8 7 17 11.2 24 12C17 12.8 12.8 17 12 24C11.2 17 7 12.8 0 12C7 11.2 11.2 7 12 0Z";

const between = (range: readonly number[], amount: number) =>
  range[0] + (range[1] - range[0]) * amount;

const easeOut = (amount: number) => 1 - (1 - amount) * (1 - amount);

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Dust that rises under a moving object, then scatters when it lands.
 * `getSourceAt` gives the object's position at any frame, so the dust has no
 * path of its own.
 */
export const MagicDust: React.FC<{
  readonly getSourceAt: (frame: number) => { x: number; y: number };
  readonly startFrame: number;
  /** New particles stop here and the remaining ones scatter and fade. */
  readonly landFrame: number;
  /** 0 is invisible, 1 is the strongest. */
  readonly intensity: number;
  readonly seed?: string;
}> = ({
  getSourceAt,
  startFrame,
  landFrame,
  intensity,
  seed = "magic-dust",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scatterFrames = MAGIC_DUST.scatterSeconds * fps;

  if (
    intensity <= 0 ||
    frame < startFrame ||
    frame > landFrame + scatterFrames
  ) {
    return null;
  }

  const count = Math.round(
    between([MAGIC_DUST.minParticles, MAGIC_DUST.maxParticles], intensity),
  );
  const framesAfterLanding = Math.max(0, frame - landFrame);
  const landingFade = 1 - framesAfterLanding / scatterFrames;
  const scatter = easeOut(framesAfterLanding / scatterFrames);
  const source = getSourceAt(frame);

  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const stat = (name: string) => random(`${seed}-${name}-${index}`);

        // Each particle repeats a staggered life cycle, respawning under the
        // source's position at the time, for as long as the source is moving.
        const life = between(MAGIC_DUST.lifeSeconds, stat("life")) * fps;
        const elapsed = frame - startFrame + stat("stagger") * life;
        const cycle = Math.floor(elapsed / life);
        const nominalBirth = frame - (elapsed - cycle * life);
        const birth = Math.max(startFrame, nominalBirth);

        if (birth > landFrame) {
          return null;
        }

        const age = frame - birth;
        const lifeLeft = nominalBirth + life - frame;
        const respawn = (name: string) =>
          random(`${seed}-${name}-${index}-${cycle}`);

        const spawnedAt = getSourceAt(birth);
        const toSpawnX = spawnedAt.x - source.x;
        const toSpawnY = spawnedAt.y - source.y;
        const distance = Math.hypot(toSpawnX, toSpawnY);
        const trail = Math.min(
          distance,
          MAGIC_DUST.maxTrail * respawn("trail") * respawn("trail2"),
        );
        const lag = distance > 0 ? trail / distance : 0;
        const scatterAngle = -Math.PI * respawn("angle");
        const scatterDistance =
          between(MAGIC_DUST.scatterDistance, respawn("distance")) * scatter;

        const x =
          source.x +
          toSpawnX * lag +
          (respawn("x") * 2 - 1) * MAGIC_DUST.spreadX +
          Math.sin(age * 0.35 + stat("wobble") * 6.28) * MAGIC_DUST.wobble +
          Math.cos(scatterAngle) * scatterDistance;
        const y =
          source.y +
          toSpawnY * lag +
          between([MAGIC_DUST.belowMin, MAGIC_DUST.belowMax], respawn("y")) -
          (age / life) * MAGIC_DUST.floatUp +
          Math.sin(scatterAngle) * scatterDistance;

        const isStar = index % MAGIC_DUST.starEvery === 0;
        const size = between(
          isStar ? MAGIC_DUST.starSize : MAGIC_DUST.dotSize,
          respawn("size"),
        );
        const color =
          MAGIC_DUST.colors[
            Math.floor(respawn("color") * MAGIC_DUST.colors.length)
          ];

        const opacity =
          Math.sqrt(intensity) *
          clamp01(age / MAGIC_DUST.fadeInFrames) *
          clamp01(lifeLeft / (life * 0.5)) *
          clamp01(landingFade) *
          (0.8 + 0.2 * Math.sin(age * 0.9 + stat("twinkle") * 6.28));

        const placement: React.CSSProperties = {
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          opacity,
        };

        return isStar ? (
          <svg
            key={index}
            viewBox="0 0 24 24"
            style={{
              ...placement,
              rotate: `${age * 2 + stat("spin") * 45}deg`,
              filter: `drop-shadow(0 0 ${size * 0.25}px ${color})`,
            }}
          >
            <path d={STAR_PATH} fill={color} />
          </svg>
        ) : (
          <div
            key={index}
            style={{
              ...placement,
              borderRadius: "50%",
              backgroundColor: color,
              boxShadow: `0 0 ${size}px ${color}`,
            }}
          />
        );
      })}
    </>
  );
};
