import { lazy, Suspense } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { Intensity, SeasonId } from '../../design/seasons';
import styles from './SeasonalLayer.module.css';

// The canvas engine (sprites + scenes) only downloads when Seasonal Themes are actually on.
const SeasonSceneCanvas = lazy(() => import('./SeasonSceneCanvas'));

interface SeasonalLayerProps {
  season: SeasonId;
  /** false = tinted background only, no animation. */
  animated?: boolean;
  intensity?: Intensity;
  speed?: number;
  /** true = fills its positioned parent (admin previews) instead of the whole viewport. */
  contained?: boolean;
}

/**
 * Independent seasonal layer: a translucent colour wash behind the page plus a Canvas 2D animation on top of it.
 * The canvas is pointer-events:none, so it never blocks clicks, scrolling or navigation, and it sits below
 * headers, drawers and modals. It never touches Morphism tokens.
 */
export function SeasonalLayer({ season, animated = true, intensity = 'medium', speed = 1, contained = false }: SeasonalLayerProps) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const run = animated && !reduceMotion;

  const wash = <div className={contained ? styles.washContained : styles.washFixed} data-season={season} aria-hidden="true" />;
  const canvas = run ? (
    <Suspense fallback={null}>
      <SeasonSceneCanvas season={season} intensity={intensity} speed={speed} contained={contained} />
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
