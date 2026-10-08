import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
const types=['article','article-english','event','bestuur','member','alumni','yera_author','carousel_item','carousel_item_en'];
const raw=Object.fromEntries(await Promise.all(types.map(async t=>[t,JSON.parse(await readFile(`migration/source/${t}.json`,'utf8'))])));
const frontend=JSON.parse(await readFile('migration/source/frontend.json','utf8'));
const assets=new Map();
function asset(value){
 if(!value || typeof value!=='string')return '';
 try {const u=new URL(value.replace(/^http:/,'https:'));if(!['www.yera.be','yera.be'].includes(u.hostname))return value;
 if(!u.pathname.includes('/uploads/')&&!u.pathname.startsWith('/_nuxt/img/')&&u.pathname!='/favicon.ico')return value;
 const path=decodeURIComponent(u.pathname);const dest=path.startsWith('/wp-content/')?path:'/brand/'+path.split('/').pop();
 assets.set(u.href,dest);return dest;
 }catch{return value;}
}
function image(v){return v&&typeof v==='object'?asset(v.url):'';}
const routes=new Map();
for(const t of ['article','article-english','event'])for(const x of raw[t])routes.set(new URL(x.link).pathname,`/${t}/${x.slug}/`);
for(const x of raw.article)routes.set(`/project/${x.slug}/`,`/article/${x.slug}/`);
routes.set('/sluiting-gascentrales/','/article/sluiting-gascentrales-een-positieve-ontwikkeling/');
routes.set('/smart-cities-energie-in-de-nabije-toekomst/','/article/smart-cities-energie-in-de-nabije-toekomst/');
routes.set('/inschrijving-the-day-after-nuclear-1920/','/event/the-day-after-nuclear/');
routes.set('/inschrijving-politiek-debat/','/event/politiek-debat/');
function html(value=''){
 const $=load(value,null,false);
 $('script,style').remove();
 $('*').each((_,el)=>{for(const key of Object.keys(el.attribs||{}))if(/^on/i.test(key))$(el).removeAttr(key);});
 $('[srcset]').removeAttr('srcset').removeAttr('sizes');
 $('[src],[href],[poster]').each((_,el)=>{for(const key of ['src','href','poster']){
  const v=$(el).attr(key);if(!v)continue;
  if(/^javascript:/i.test(v)){$(el).removeAttr(key);continue;}
  let next=asset(v);
  try{const u=new URL(v);if(['www.yera.be','yera.be'].includes(u.hostname)&&routes.has(u.pathname))next=routes.get(u.pathname)+u.hash;}catch{}
  $(el).attr(key,next);
 }});
 $('img').attr('loading','lazy').attr('decoding','async');
 return $.html();
}
const text=v=>load(v||'',null,false).text();
const articles=['article','article-english'].flatMap(type=>raw[type].map(x=>({id:x.id,slug:x.slug,path:`${type}/${x.slug}/`,title:text(x.title.rendered),author:x.acf.author||'',category:x.acf.category||'',subtitle:x.acf.subtitle||'',description:text(x.content.rendered).trim().replace(/\s+/g,' ').slice(0,220),date:x.date.slice(0,10),collection:type==='article-english'?'English collection':'Main collection',image:image(x.acf.image),imageAlt:x.acf.image?.alt||'',content:html(x.content.rendered),sources:x.acf.sources||'',source:x.link}))).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
const events=raw.event.map(x=>({id:x.id,slug:x.slug,path:`event/${x.slug}/`,title:text(x.title.rendered),content:html(x.content.rendered),extraContent:x.acf.content||'',subtitle:x.acf.subtitle||'',date:x.acf.date||'',start:x.acf.start||'',end:x.acf.end||'',location:x.acf.location||'',image:image(x.acf.image),source:x.link}));
const members=raw.member.map(x=>({id:x.id,name:text(x.title.rendered),firstname:x.acf.firstname,surname:x.acf.surname,role:x.acf.function,email:x.acf.email,linkedin:x.acf.linkedin,image:image(x.acf.image)}));
const boards=raw.bestuur.map(x=>({id:x.id,title:text(x.title.rendered),current:x.acf.huidig_bestuur,memberIds:x.acf.leden||[],image:image(x.acf.groepsfoto)}));
const alumni=raw.alumni.map(x=>({id:x.id,name:text(x.title.rendered),role:x.acf.function,linkedin:x.acf.linkedin}));
const authors=raw.yera_author.map(x=>({id:x.id,name:text(x.title.rendered),linkedin:x.acf.linkedin,image:image(x.acf.image)}));
const carousel=['carousel_item','carousel_item_en'].flatMap(t=>raw[t].map(x=>({id:x.id,title:text(x.title.rendered),content:html(x.content.rendered),image:image(x.acf.image),caption:x.acf.caption,targetId:x.acf.verwijst_naar?.ID,locale:t.endsWith('_en')?'en':'nl'})));
const logo=asset('https://yera.be/_nuxt/img/logo.aebede0.png');const favicon=asset('https://yera.be/favicon.ico');
await mkdir('src/data',{recursive:true});
await writeFile('src/data/site.json',JSON.stringify({articles,events,members,boards,alumni,authors,carousel,messages:frontend.messages,logo,favicon},null,2));
const failures=[],manifest=[];const queue=[...assets.entries()];
await Promise.all(Array.from({length:6},async()=>{while(queue.length){const [url,path]=queue.shift();try{
 const file='public'+path;await mkdir(dirname(file),{recursive:true});let data;
 try{data=await readFile(file);}catch{const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(response.status);data=Buffer.from(await response.arrayBuffer());await writeFile(file,data);}
 manifest.push({url,path,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
 }catch(e){failures.push({url,path,error:String(e)});}}}));
await writeFile('migration/assets.json',JSON.stringify(manifest,null,2));await writeFile('migration/asset-failures.json',JSON.stringify(failures,null,2));
console.log(JSON.stringify({articles:articles.length,events:events.length,members:members.length,boards:boards.length,alumni:alumni.length,authors:authors.length,assets:manifest.length,failures},null,2));
