import { url } from './utils';
export function localHtml(html:string) {
  return html.replace(/(src|href|poster)="\/(?!\/)([^"]*)"/g,(_,attr,path)=>`${attr}="${url(path)}"`);
}
export function plainText(html:string) { return html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(); }
