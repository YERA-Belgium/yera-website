import {load} from 'cheerio';
export function prepareArticle(content:string){
 const $=load(content,null,false);
 const contents:{id:string;label:string}[]=[];
 $('h1,h2,h3,h4,h5,p > strong:first-child').each((_,node)=>{
  const el=$(node);const label=el.text().trim();
  if(label.length<4||label.length>100||contents.some(item=>item.label===label))return;
  if(node.tagName==='strong'&&el.parent().contents().first()[0]!==node)return;
  const id=el.attr('id')||`section-${contents.length+1}`;el.attr('id',id);contents.push({id,label});
 });
 const words=$.text().split(/\s+/).filter(Boolean).length;
 return {html:$.html(),contents,minutes:Math.max(1,Math.ceil(words/220))};
}
export function sourceMarkup(source:string){
 const $=load(source,null,false);$('script,style').remove();
 function walk(parent:any){for(const node of [...(parent.children||[])]){
  if(node.type==='text'){
   const text=node.data||'';const escape=(v:string)=>v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
   const linked=text.split(/(https?:\/\/[^\s<>"\u201d]+)/g).map((part:string)=>/^https?:\/\//.test(part)?`<a href="${escape(part)}">${escape(part)}</a>`:escape(part)).join('');
   $(node).replaceWith(linked);
  }else if(node.name!=='a')walk(node);
 }}
 walk($.root()[0]);return $.html();
}
