import { useCallback } from 'react';
import SeasonCanvas from './SeasonCanvas';
import { createScene, type SceneOpts } from './engine/scenes';
import type { Intensity, SeasonId } from '../../design/seasons';

/** Lazy-loaded wrapper: keeps the whole seasonal engine out of the main bundle. */
export default function SeasonSceneCanvas({ season, intensity, speed, contained }: { season: SeasonId; intensity: Intensity; speed: number; contained: boolean }) {
  const build = useCallback((w: number, h: number, o: SceneOpts) => createScene(season, w, h, o), [season]);
  return <SeasonCanvas sceneKey={season} build={build} intensity={intensity} speed={speed} contained={contained} />;
}
