import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { contentSizes, responsiveImage } from './images';
import { url } from './utils';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Some migrated articles still point at the old WordPress host, yera.ulyssis.be, which no longer exists.
// Keep scripts/generate-responsive-images.mjs (oldHostUpload) in sync with this rule.
const oldHost = String.raw`https?://yera\.ulyssis\.be/`;
const publicDir = join(process.cwd(), 'public');

/** Local copy of an old-host upload: the same file, or its full-size original (WordPress's "-1024x675" suffix removed). */
function localCopyOf(oldUrl: string) {
  const upload = oldUrl.match(/^https?:\/\/yera\.ulyssis\.be(\/wp-content\/uploads\/[^"?#]+)/i)?.[1];
  if (!upload) return undefined;
  return [upload, upload.replace(/-\d+x\d+(\.[a-z]+)$/i, '$1')].find(candidate => existsSync(join(publicDir, candidate)));
}

/** Repoint old-host images and links to local copies where they exist; otherwise drop them (a link keeps its text). */
function dropDeadHost(html: string) {
  return html
    .replace(new RegExp(`<img\\b[^>]*\\bsrc="(${oldHost}[^"]*)"[^>]*>`, 'gi'), (tag, src: string) => {
      const local = localCopyOf(src);
      return local ? tag.replace(src, local) : '';
    })
    .replace(new RegExp(`<a\\b([^>]*?)\\bhref="(${oldHost}[^"]*)"([^>]*)>([\\s\\S]*?)</a>`, 'gi'), (_, before: string, href: string, after: string, inner: string) => {
      const local = localCopyOf(href);
      return local ? `<a${before}href="${local}"${after}>${inner}</a>` : inner;
    })
    // A figure whose only content was a removed image would leave an empty gap.
    .replace(/<figure\b[^>]*>\s*<\/figure>/gi, '');
}

/**
 * WordPress dropped the <img> from some figures but kept the empty link to the full-size file, with the
 * caption paragraph right after it. Where that file is in public/, show it again inside its link, using the
 * caption as alt text. Empty links to files that don't exist are left as they are (they render nothing).
 */
function restoreLostFigures(html: string) {
  // The caption is read with a look-ahead, not consumed: a caption can itself end with the next figure's empty link.
  return html.replace(
    /<a\b([^>]*?)\bhref="(\/wp-content\/uploads\/[^"]+\.(?:jpe?g|png|gif|webp))"([^>]*)>\s*<\/a>(?=(?:\s*<\/p>\s*<p\b[^>]*\bid="caption-attachment-\d+"[^>]*>([\s\S]*?)<\/p>)?)/gi,
    (tag, before: string, href: string, after: string, caption = '') => {
      if (!existsSync(join(publicDir, href))) return tag;
      // Some captions run straight into the next paragraph ("…(bron: BDEW)Duitsland heeft…"): keep only the caption.
      const captionText = plainText(caption).replace(/([)\]])(?=[A-Z])[\s\S]*$/, '$1');
      const alt = (captionText.length > 200 ? `${captionText.slice(0, 200).replace(/\s+\S*$/, '')}…` : captionText).replace(/"/g, '&quot;');
      return `<a${before}href="${href}"${after}><img class="restored-figure" src="${href}" alt="${alt}"></a>`;
    },
  );
}

export function localHtml(html:string) {
  // 1. Fix references to the dead old host and restore lost figures, then prefix root-relative URLs with the base path.
  const based = restoreLostFigures(dropDeadHost(html)).replace(/(src|href|poster)="\/(?!\/)([^"]*)"/g, (_, attr, path) => `${attr}="${url(path)}"`);
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
