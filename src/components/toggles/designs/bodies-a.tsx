/* eslint-disable react-refresh/only-export-components -- vendored toggle library: files export both components and helpers */
import type { ReactElement, SVGProps } from 'react';
import type { ResolvedToggleConfig } from '../resolveConfig';
import type { ToggleId } from '../types';

interface BodyProps {
  cfg: ResolvedToggleConfig;
}
type Body = (p: BodyProps) => ReactElement;

/* Local icons (set A only). */
const svgBase: SVGProps<SVGSVGElement> = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false };

const PowerIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svgBase} viewBox="0 0 24 24" strokeWidth={3} {...p}>
    <path d="M12 3v8" />
    <path d="M6.8 6.6a8 8 0 1 0 10.4 0" />
  </svg>
);

const Shackle = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svgBase} viewBox="0 0 12 10" strokeWidth={2.2} {...p}>
    <path d="M2.2 10V5a3.8 3.8 0 0 1 7.6 0v5" />
  </svg>
);

/** Half-circle scale with a split on/off arc and a needle that swings about the hub. */
const GaugeFace = () => (
  <svg className="a-face" viewBox="0 0 48 26" aria-hidden="true" focusable="false">
    <path className="a-arc a-arc-s" d="M8 16.2A17 17 0 0 1 24 5" />
    <path className="a-arc a-arc-e" d="M24 5A17 17 0 0 1 40 16.2" />
    <g className="a-needle">
      <path d="M24 22L24 7.5" />
    </g>
    <circle className="a-hub" cx="24" cy="22" r="2.6" />
  </svg>
);

const rockerBody: Body = () => (
  <>
    <span className="tgl-track" aria-hidden="true">
      <span className="tgl-fill" />
    </span>
    <span className="tgl-thumb a-rock" aria-hidden="true">
      <span className="a-half a-half-s" />
      <span className="a-half a-half-e" />
      <span className="a-mark a-mark-off" />
      <span className="a-mark a-mark-on" />
    </span>
  </>
);

const leverBody: Body = () => (
  <>
    <span className="tgl-track" aria-hidden="true">
      <span className="tgl-fill" />
    </span>
    <span className="tgl-thumb a-lever" aria-hidden="true">
      <span className="a-arm">
        <span className="a-ball" />
      </span>
      <span className="a-pivot" />
    </span>
  </>
);

const pushBody: Body = () => (
  <>
    <span className="tgl-track" aria-hidden="true">
      <span className="tgl-fill" />
    </span>
    <span className="tgl-thumb a-cap" aria-hidden="true">
      <span className="a-cap-mark" />
    </span>
  </>
);

const ledBody: Body = () => (
  <>
    <span className="tgl-track" aria-hidden="true">
      <span className="tgl-fill" />
    </span>
    <span className="a-slot" aria-hidden="true" />
    <span className="tgl-thumb a-slide" aria-hidden="true" />
    <span className="a-lens" aria-hidden="true" />
  </>
);

const powerBody: Body = () => (
  <>
    <span className="tgl-track" aria-hidden="true">
      <span className="tgl-fill" />
    </span>
    <span className="tgl-thumb" aria-hidden="true">
      <PowerIcon className="a-power" />
    </span>
  </>
);

const knobBody: Body = () => (
  <>
    <span className="tgl-track" aria-hidden="true">
      <span className="tgl-fill" />
    </span>
    <span className="a-dot a-dot-s" aria-hidden="true" />
    <span className="a-dot a-dot-e" aria-hidden="true" />
    <span className="tgl-thumb a-knob" aria-hidden="true">
      <span className="a-pointer" />
    </span>
  </>
);

const padlockBody: Body = () => (
  <>
    <span className="tgl-track" aria-hidden="true">
      <span className="tgl-fill" />
    </span>
    <span className="tgl-thumb a-lock" aria-hidden="true">
      <Shackle className="a-shackle" />
      <span className="a-body">
        <span className="a-keyhole" />
      </span>
    </span>
  </>
);

const pianoBody: Body = () => (
  <>
    <span className="tgl-track" aria-hidden="true">
      <span className="tgl-fill" />
    </span>
    <span className="a-key a-key-s" aria-hidden="true" />
    <span className="a-key a-key-e" aria-hidden="true" />
    <span className="a-sharp" aria-hidden="true" />
  </>
);

const mechanicalBody: Body = () => (
  <>
    <span className="tgl-track" aria-hidden="true">
      <span className="tgl-fill" />
    </span>
    <span className="tgl-thumb" aria-hidden="true">
      <span className="a-keycap" />
    </span>
  </>
);

const gaugeBody: Body = () => (
  <>
    <span className="tgl-track" aria-hidden="true">
      <span className="tgl-fill" />
    </span>
    <GaugeFace />
  </>
);

/** Set A: DOM bodies for this set's designs. Designs not listed here fall back to the plain track + thumb body. */
export const BODIES_A: Partial<Record<ToggleId, Body>> = {
  rocker: rockerBody,
  lever: leverBody,
  'push-button': pushBody,
  led: ledBody,
  power: powerBody,
  knob: knobBody,
  padlock: padlockBody,
  piano: pianoBody,
  mechanical: mechanicalBody,
  gauge: gaugeBody,
};
