import { imageManifest } from '@/generated/image-manifest';
import { url } from './utils';

const widths = [160, 400, 800, 1200, 1600];

type ImageVariant = { width: number; src: string };
type ImageEntry = { width: number; height: number; variants: readonly ImageVariant[] };

export function responsiveImage(path: string, displayWidth: number) {
  const key = path.replace(/^\//, '');
  const entry = (imageManifest as Record<string, ImageEntry>)[key];
  if (!entry) {
    return { src: url(path), srcset: undefined, sizes: `${displayWidth}px`, width: displayWidth, height: displayWidth };
  }
  const variants = entry.variants.filter(variant => widths.includes(variant.width));
  const source = variants.find(variant => variant.width >= displayWidth) ?? variants.at(-1);
  return {
    src: url(source?.src ?? path),
    srcset: variants.map(variant => `${url(variant.src)} ${variant.width}w`).join(', '),
    sizes: `${displayWidth}px`,
    width: entry.width,
    height: entry.height,
  };
}
