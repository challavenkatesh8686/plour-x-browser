import { useCallback } from 'react';
import SeasonCanvas from './SeasonCanvas';
import { createFestivalScene } from './engine/festivalScenes';
import type { SceneOpts } from './engine/scenes';
import type { FestivalSceneId } from '../../design/festivals';
import type { Intensity } from '../../design/seasons';

/** Lazy-loaded wrapper: the festival engine only downloads when a festival is actually showing. */
export default function FestivalSceneCanvas({ scene, intensity, speed, contained }: { scene: FestivalSceneId; intensity: Intensity; speed: number; contained: boolean }) {
  const build = useCallback((w: number, h: number, o: SceneOpts) => createFestivalScene(scene, w, h, o), [scene]);
  return <SeasonCanvas sceneKey={`festival:${scene}`} build={build} tier="festival" intensity={intensity} speed={speed} contained={contained} />;
}
