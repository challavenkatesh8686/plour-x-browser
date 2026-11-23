import { lazy, Suspense } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { FestivalSceneId } from '../../design/festivals';
import type { Intensity } from '../../design/seasons';
import { FESTIVAL_WASH } from './festivalWash';
import styles from './SeasonalLayer.module.css';

const FestivalSceneCanvas = lazy(() => import('./FestivalSceneCanvas'));

interface FestivalLayerProps {
  scene: FestivalSceneId;
  /** false = tinted background only, no animation. */
  animated?: boolean;
  intensity?: Intensity;
  speed?: number;
  /** true = fills its positioned parent (admin preview) instead of the viewport. */
  contained?: boolean;
}

/**
 * Independent festival layer. Separate canvases from the seasonal layer (so both can run together), the same
 * non-interactive / reduced-motion / background-pause behaviour, and it never touches Morphism tokens.
 */
export function FestivalLayer({ scene, animated = true, intensity = 'medium', speed = 1, contained = false }: FestivalLayerProps) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const run = animated && !reduceMotion;

  const wash = <div className={contained ? styles.washContained : styles.festivalWash} style={{ background: FESTIVAL_WASH[scene] }} aria-hidden="true" />;
  const canvas = run ? (
    <Suspense fallback={null}>
      <FestivalSceneCanvas scene={scene} intensity={intensity} speed={speed} contained={contained} />
    </Suspense>
  ) : null;

  if (contained) {
    return (
      <div className={styles.containedRoot} aria-hidden="true">
        {wash}
        {canvas}
      </div>
    );
  }
  return (
    <>
      {wash}
      {canvas}
    </>
  );
}
