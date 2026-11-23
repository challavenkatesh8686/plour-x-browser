/* eslint-disable react-refresh/only-export-components -- vendored toggle library: files export both components and helpers */
import type { ReactElement, ReactNode, SVGProps } from 'react';
import type { ResolvedToggleConfig } from '../resolveConfig';
import type { ToggleId } from '../types';

interface BodyProps {
  cfg: ResolvedToggleConfig;
}
type Body = (p: BodyProps) => ReactElement;

/* ---- local icons (24-unit viewBox, currentColor); decorative only ---- */
const ico: SVGProps<SVGSVGElement> = { viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false, className: 'tb-g' };

const LeafGlyph = () => (
  <svg {...ico}>
    <path d="M3.5 20.5C3 11 9 3.5 20.5 3.5 20.5 14.5 14 21 3.5 20.5z" fill="currentColor" />
    <path className="tb-vein" d="M4 20L15 9M9.5 14.5V9.5M12 12h4.5" fill="none" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const FlameGlyph = () => (
  <svg {...ico}>
    <path d="M12 2c.6 3.6 5.5 6.2 5.5 11.4a5.5 5.5 0 0 1-11 0c0-2.2 1-3.7 2.3-4.9.1 1.6.7 2.6 1.7 3C10.2 8.5 10.4 5 12 2z" fill="currentColor" />
    <path className="tb-core" d="M12 12.5c.3 1.4 2.2 2.2 2.2 4.2a2.2 2.2 0 0 1-4.4 0c0-1.2.9-1.8 1.2-2.6.4.5.7.6 1 .4z" />
  </svg>
);

const DropGlyph = () => (
  <svg {...ico}>
    <path className="tb-drop" d="M12 2.2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.8-7-12.8z" />
    <path className="tb-shine" d="M8.6 14.6a3.6 3.6 0 0 0 2.6 3.4" fill="none" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const FlakeGlyph = () => (
  <svg {...ico}>
    <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
      <path d="M9.6 4.9L12 7l2.4-2.1M9.6 19.1L12 17l2.4 2.1M4.6 11.2l3 .3-.5-3M19.4 12.8l-3-.3.5 3M4.6 12.8l3-.3-.5 3M19.4 11.2l-3 .3.5-3" strokeWidth="1.5" />
    </g>
  </svg>
);

const CloudGlyph = () => (
  <svg viewBox="0 0 32 20" aria-hidden="true" focusable="false" className="tb-g tb-cloud">
    <path d="M9 19.2a6 6 0 0 1-.7-12A8.2 8.2 0 0 1 23.6 6.6 6.3 6.3 0 0 1 24.2 19.2z" fill="currentColor" />
  </svg>
);

const StarGlyph = () => (
  <svg {...ico}>
    <path d="M12 2.4l2.9 6.2 6.7.8-5 4.6 1.4 6.7-6-3.4-6 3.4 1.4-6.7-5-4.6 6.7-.8z" fill="currentColor" strokeLinejoin="round" stroke="currentColor" strokeWidth="1" />
  </svg>
);

const BoltGlyph = () => (
  <svg {...ico}>
    <path d="M13.6 1.8L4.8 13.4h6L9.8 22.2l9.4-12.4h-6.3z" fill="currentColor" strokeLinejoin="round" stroke="currentColor" strokeWidth="1" />
  </svg>
);

const ArcGlyph = () => (
  <svg {...ico}>
    <g fill="none" strokeWidth="2.4" strokeLinecap="round">
      <path className="tb-a1" d="M3.5 18a8.5 8.5 0 0 1 17 0" />
      <path className="tb-a2" d="M7 18a5 5 0 0 1 10 0" />
      <path className="tb-a3" d="M10.4 18a1.6 1.6 0 0 1 3.2 0" />
    </g>
  </svg>
);

const WaveGlyph = () => (
  <svg {...ico}>
    <path d="M2.5 9.5c2-2.6 3.6-2.6 5.5 0s3.6 2.6 5.5 0 3.6-2.6 5.5 0M2.5 15.5c2-2.6 3.6-2.6 5.5 0s3.6 2.6 5.5 0 3.6-2.6 5.5 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

/** Track (own scenery inside) + thumb. All parts stay absolutely positioned, so nothing shifts layout. */
const Track = ({ children }: { children?: ReactNode }) => (
  <span className="tgl-track" aria-hidden="true">
    <span className="tgl-fill" />
    {children}
  </span>
);
const Thumb = ({ children }: { children?: ReactNode }) => (
  <span className="tgl-thumb" aria-hidden="true">
    {children}
  </span>
);
const make =
  (glyph: ReactNode, scenery?: ReactNode): Body =>
  () => (
    <>
      <Track>{scenery}</Track>
      <Thumb>{glyph}</Thumb>
    </>
  );

const sparkles = [0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={`tb-s tb-s${i}`} />);

const sunrise: Body = () => (
  <>
    <Track />
    <Thumb />
    <span className="tb-hz" aria-hidden="true">
      <span className="tb-hill" />
    </span>
  </>
);

const wave: Body = () => (
  <>
    <Track>
      <span className="tb-water tb-water-b"><span className="tb-wv" /></span>
      <span className="tb-water tb-water-a"><span className="tb-wv" /></span>
    </Track>
    <Thumb>
      <WaveGlyph />
    </Thumb>
  </>
);

const bolt: Body = () => (
  <>
    <Track>
      <svg className="tb-zig" viewBox="0 0 48 26" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <polyline points="0,14 7,6 13,18 21,4 28,20 36,7 42,16 48,10" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </Track>
    <Thumb>
      <BoltGlyph />
    </Thumb>
  </>
);

/** Set B: DOM bodies for this set's designs. Designs not listed here fall back to the plain track + thumb body. */
export const BODIES_B: Partial<Record<ToggleId, Body>> = {
  leaf: make(<LeafGlyph />),
  flame: make(<FlameGlyph />),
  droplet: make(<DropGlyph />),
  snow: make(<FlakeGlyph />),
  cloud: make(<CloudGlyph />),
  stars: make(<StarGlyph />, sparkles),
  sunrise,
  rainbow: make(<ArcGlyph />, <span className="tb-arc" />),
  wave,
  bolt,
};
