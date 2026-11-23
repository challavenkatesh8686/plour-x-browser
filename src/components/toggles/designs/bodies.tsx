/* eslint-disable react-refresh/only-export-components -- vendored toggle library: files export both components and helpers */
import type { ReactElement } from 'react';
import type { ResolvedToggleConfig } from '../resolveConfig';
import type { ToggleId } from '../types';
import { BODIES_A } from './bodies-a';
import { BODIES_B } from './bodies-b';
import { BODIES_C } from './bodies-c';
import { CheckIcon, CrossIcon, MoonIcon, SparkIcon, SunIcon } from './icons';

export interface BodyProps {
  cfg: ResolvedToggleConfig;
}
type Body = (p: BodyProps) => ReactElement;

/** Track (with its fill layer) + thumb. Everything else about a design lives in toggles.css under [data-type]. */
const Track = () => (
  <span className="tgl-track" aria-hidden="true">
    <span className="tgl-fill" />
  </span>
);

const plain: Body = () => (
  <>
    <Track />
    <span className="tgl-thumb" aria-hidden="true" />
  </>
);

/** Thumb carrying a single glyph that fades in when on. */
const glyphBody =
  (Glyph: typeof CheckIcon): Body =>
  ({ cfg }) => (
    <>
      <Track />
      <span className="tgl-thumb" aria-hidden="true">
        {cfg.showIcon && <Glyph className="tgl-ic tgl-ic-b" />}
      </span>
    </>
  );

/** ON / OFF text sits above the thumb so a sliding highlight can pass behind it. */
const textBody: Body = ({ cfg }) => (
  <>
    <Track />
    <span className="tgl-thumb" aria-hidden="true" />
    {cfg.showLabel && (
      <span className="tgl-txts" aria-hidden="true">
        <span className="tgl-t tgl-t-off">{cfg.offLabel}</span>
        <span className="tgl-t tgl-t-on">{cfg.onLabel}</span>
      </span>
    )}
  </>
);

const flipBody: Body = ({ cfg }) => (
  <>
    <Track />
    <span className="tgl-thumb" aria-hidden="true">
      <span className="tgl-face tgl-face-f">{cfg.showIcon && <CrossIcon className="tgl-ic" />}</span>
      <span className="tgl-face tgl-face-b">{cfg.showIcon && <CheckIcon className="tgl-ic" />}</span>
    </span>
  </>
);

const iconBody: Body = ({ cfg }) => (
  <>
    <Track />
    <span className="tgl-thumb" aria-hidden="true">
      {cfg.showIcon && (
        <>
          <SunIcon className="tgl-ic tgl-ic-a" />
          <MoonIcon className="tgl-ic tgl-ic-b" />
        </>
      )}
    </span>
  </>
);

/** One body per design. Designs that share a DOM shape share a body; the look is per-design CSS. */
const CORE_BODIES: Partial<Record<ToggleId, Body>> = {
  classic: plain,
  ios: plain,
  material: glyphBody(CheckIcon),
  minimal: plain,
  outline: plain,
  gradient: plain,
  glass: plain,
  neon: plain,
  neumorphic: plain,
  pill: plain,
  morph: plain,
  elastic: plain,
  flip: flipBody,
  liquid: plain,
  glow: plain,
  icon: iconBody,
  label: textBody,
  segmented: textBody,
  square: glyphBody(CheckIcon),
  'plourx-signature': glyphBody(SparkIcon),
};

export const DESIGN_BODIES = new Proxy({ ...CORE_BODIES, ...BODIES_A, ...BODIES_B, ...BODIES_C } as Record<ToggleId, Body>, {
  get: (t, k: string) => t[k as ToggleId] ?? plain,
});
