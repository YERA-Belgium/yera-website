import { url } from './utils';

// Server-side only: never import this module from client-hydrated components, or the
// whole manifest gets bundled into the browser. Compute image props in .astro files
// and pass them down as plain props instead.

type ImageEntry = { width: number; height: number; widths: readonly number[] };

// Globbing (instead of a static import) lets a fresh clone build/check before
// `npm run images` has produced the manifest: images then fall back to the originals.
const manifestModules = import.meta.glob<Record<string, ImageEntry>>('../generated/image-manifest.json', { eager: true, import: 'default' });
const imageManifest: Record<string, ImageEntry> = Object.values(manifestModules)[0] ?? {};

export type ResponsiveImage = { src: string; srcset?: string; sizes?: string; width?: number; height?: number };

/**
 * `sizes` strings that mirror the CSS layout in src/styles/global.css.
 * Container: min(1240px, 100vw - 96px); <=1050px: 100vw - 56px; <=760px: 100vw - 40px.
 * Keep these in sync when grid columns, gaps or breakpoints change.
 */
export const imageSizes = {
  // .article-grid / .social-post-grid: 3 columns, 30px gap; 1 column <=760px.
  card: '(max-width: 760px) calc(100vw - 40px), (max-width: 1050px) calc((100vw - 116px) / 3), (max-width: 1336px) calc((100vw - 156px) / 3), 394px',
  // .lead-story image: first column of 1.07fr 1fr (gap 52px; 30px <=1050px); full width <=760px.
  // It is object-fit:cover in a box 280px tall (<=760px) or up to 560px tall, so a wide image
  // renders wider than its column: never ask for less than boxHeight * aspect ratio.
  lead: (aspect = 1) => {
    const cover = (height: number) => `${Math.round(height * aspect)}px`;
    return `(max-width: 760px) max(calc(100vw - 40px), ${cover(280)}), (max-width: 1050px) max(calc((100vw - 86px) * 0.517), ${cover(560)}), (max-width: 1336px) max(calc((100vw - 148px) * 0.517), ${cover(560)}), max(614px, ${cover(560)})`;
  },
  // .upcoming-event poster: second column (1fr) of the same grid, but shown at its own aspect
  // ratio with max-height 520px (480px <=760px), so it is often narrower than the column.
  eventFeature: (aspect = 1) => {
    const capped = (height: number) => `${Math.round(height * aspect)}px`;
    return `(max-width: 760px) min(calc(100vw - 40px), ${capped(480)}), (max-width: 1050px) min(calc((100vw - 86px) * 0.483), ${capped(520)}), (max-width: 1336px) min(calc((100vw - 148px) * 0.483), ${capped(520)}), min(574px, ${capped(520)})`;
  },
  // .member-grid: 4 columns (26px gap); 3 columns <=1050px; 2 columns (18px gap) <=760px.
  // `scale` covers .member-photo--close, which zooms the image 1.35x inside its frame.
  member: (scale = 1) => `(max-width: 760px) calc((100vw - 58px) / 2 * ${scale}), (max-width: 1050px) calc((100vw - 108px) / 3 * ${scale}), (max-width: 1336px) calc((100vw - 174px) / 4 * ${scale}), ${Math.round(291 * scale)}px`,
  // .community-portrait: 62px circle (52px <=760px), same optional zoom.
  portrait: (scale = 1) => `(max-width: 760px) ${Math.round(52 * scale)}px, ${Math.round(62 * scale)}px`,
  // .board-photo: full container width, capped at 900px.
  board: '(max-width: 760px) calc(100vw - 40px), (max-width: 1050px) calc(100vw - 56px), 900px',
  // Content column of .reading-layout / .article-layout: minmax(0, 730px) next to a sidebar.
  content: '(max-width: 760px) calc(100vw - 40px), (max-width: 1050px) calc(100vw - 276px), 730px',
  // .event-gallery: 2 columns (18px gap) inside the content column; 1 column <=760px.
  eventGallery: '(max-width: 760px) calc(100vw - 40px), (max-width: 1050px) calc((100vw - 294px) / 2), 356px',
} as const;

/** Zoom applied by the `--close` portrait crop classes in global.css. */
export const closeCropScale = (crop?: string) => (crop === 'close' ? 1.35 : 1);

/** Content-column sizes for an image whose markup caps it at `maxWidth` CSS pixels. */
export function contentSizes(maxWidth: number) {
  return `(max-width: 760px) min(${maxWidth}px, calc(100vw - 40px)), (max-width: 1050px) min(${maxWidth}px, calc(100vw - 276px)), min(${maxWidth}px, 730px)`;
}

const variantSrc = (key: string, width: number) => `/generated/images/${key.replace(/\.[^./]+$/, '')}/${width}.webp`;

/** Width / height of the source image, or 1 when unknown. */
export function imageAspect(path: string) {
  const entry = imageManifest[path.replace(/^\//, '')];
  return entry ? entry.width / entry.height : 1;
}

/**
 * Builds src/srcset/sizes for an image under public/. `sizes` must describe the rendered
 * CSS width at each breakpoint (see `imageSizes`); the browser multiplies it by the DPR.
 */
export function responsiveImage(path: string, sizes: string): ResponsiveImage {
  const key = path.replace(/^\//, '');
  const entry = imageManifest[key];
  // Unknown dimensions: leave width/height off rather than guessing a wrong aspect ratio.
  if (!entry) return { src: url(path) };
  const widths = [...entry.widths].sort((a, b) => a - b);
  // Fallback src for browsers without srcset support: a mid-size variant.
  const fallback = widths.find(width => width >= 800) ?? widths.at(-1)!;
  return {
    src: url(variantSrc(key, fallback)),
    srcset: widths.map(width => `${url(variantSrc(key, width))} ${width}w`).join(', '),
    sizes,
    width: entry.width,
    height: entry.height,
  };
}
