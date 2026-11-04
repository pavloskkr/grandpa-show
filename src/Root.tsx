import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import {
  calculateEpisodeMetadata,
  DEFAULT_EPISODE_CONFIG,
  EPISODE_FPS,
  getEpisodeDurationInFrames,
  GrandpaEpisode,
} from "./GrandpaEpisode";
import { GrandpaSeatedPreview } from "./GrandpaSeatedPreview";
import { GrandpaStudio } from "./GrandpaStudio";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition
        id="GrandpaStudio"
        component={GrandpaStudio}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="GrandpaEpisode"
        component={GrandpaEpisode}
        durationInFrames={getEpisodeDurationInFrames(
          DEFAULT_EPISODE_CONFIG,
          EPISODE_FPS,
        )}
        fps={EPISODE_FPS}
        width={1920}
        height={1080}
        defaultProps={{ config: DEFAULT_EPISODE_CONFIG }}
        calculateMetadata={calculateEpisodeMetadata}
      />
      <Composition
        id="GrandpaSeatedPreview"
        component={GrandpaSeatedPreview}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
