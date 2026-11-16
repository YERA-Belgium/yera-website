import { responsiveImage } from './images';
import { url } from './utils';
export function localHtml(html:string) {
  return html
    .replace(/<img\b([^>]*?)\s+src="(\/wp-content\/uploads\/[^"]+)"([^>]*)>/gi, (_, before, path, after) => {
      const image = responsiveImage(path, 800);
      const adjustedAfter = after.replace(/width\s*:\s*(\d+)px/i, (_: string, width: string) => `width:${Math.min(Number(width), image.width)}px`);
      const attrs = `${before}src="${image.src}" srcset="${image.srcset}" sizes="${image.sizes}"${/\bwidth\s*=/i.test(before + adjustedAfter) ? '' : ` width="${image.width}"`}${/\bheight\s*=/i.test(before + adjustedAfter) ? '' : ` height="${image.height}"`}${adjustedAfter}`;
      return `<img${attrs}${/\bloading\s*=/i.test(attrs) ? '' : ' loading="lazy"'}${/\bdecoding\s*=/i.test(attrs) ? '' : ' decoding="async"'}>`;
    })
    .replace(/(src|href|poster)="\/(?!\/)([^"]*)"/g, (_, attr, path) => `${attr}="${url(path)}"`);
}
export function plainText(html:string) { return html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(); }
