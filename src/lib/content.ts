import { contentSizes, responsiveImage } from './images';
import { url } from './utils';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function localHtml(html:string) {
  // 1. Prefix root-relative URLs with the site base path.
  const based = html.replace(/(src|href|poster)="\/(?!\/)([^"]*)"/g, (_, attr, path) => `${attr}="${url(path)}"`);
  // 2. Make uploaded images responsive. responsiveImage() returns already-based URLs,
  //    so this runs after step 1 instead of being prefixed a second time.
  const uploads = escapeRegExp(url('wp-content/uploads/'));
  const imgPattern = new RegExp(`<img\\b([^>]*?)\\s+src="${uploads}([^"]+)"([^>]*)>`, 'gi');
  return based.replace(imgPattern, (_, before: string, file: string, after: string) => {
    const path = `/wp-content/uploads/${file}`;
    const image = responsiveImage(path, '');
    const naturalWidth = image.width;
    // Never let an inline style stretch the image beyond its real width (that is what looked blurry).
    const adjustedAfter = naturalWidth ? after.replace(/width\s*:\s*(\d+)px/i, (_: string, width: string) => `width:${Math.min(Number(width), naturalWidth)}px`) : after;
    const attrs = before + adjustedAfter;
    // Rendered width = inline style width, else width attribute, else natural width; capped by the column.
    const declared = Number(attrs.match(/width\s*:\s*(\d+)px/i)?.[1] ?? attrs.match(/\bwidth\s*=\s*"?(\d+)/i)?.[1] ?? naturalWidth);
    const responsive = image.srcset ? ` srcset="${image.srcset}" sizes="${contentSizes(declared || 730)}"` : '';
    const width = image.width && !/\bwidth\s*=/i.test(attrs) ? ` width="${image.width}"` : '';
    const height = image.height && !/\bheight\s*=/i.test(attrs) ? ` height="${image.height}"` : '';
    const loading = /\bloading\s*=/i.test(attrs) ? '' : ' loading="lazy"';
    const decoding = /\bdecoding\s*=/i.test(attrs) ? '' : ' decoding="async"';
    return `<img${before} src="${image.src}"${responsive}${width}${height}${adjustedAfter}${loading}${decoding}>`;
  });
}
export function plainText(html:string) { return html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(); }
