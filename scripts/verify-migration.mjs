import {readFile,readdir,stat} from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {load} from 'cheerio';
const site=JSON.parse(await readFile('src/data/site.json','utf8'));
const normalize=html=>load(html,null,false).text().replace(/\s+/g,' ').trim();
let count=0;
for(const type of ['article','article-english','event']){
 const records=JSON.parse(await readFile(`migration/source/${type}.json`,'utf8'));
 for(const raw of records){
  const record=(type==='event'?site.events:site.articles).find(r=>r.id===raw.id);assert.ok(record,`Missing ${type} ${raw.id}`);
  assert.equal(normalize(record.content),normalize(raw.content.rendered),`Changed content ${type} ${raw.id}`);
  const $=load(await readFile(`dist/${record.path}index.html`,'utf8'));
  assert.equal(normalize($('.original-content>div').first().html()||''),normalize(raw.content.rendered),`Built content ${raw.id}`);
  if(type!=='event'){assert.equal(record.sources,raw.acf.sources||'');assert.equal($('.source-text').text().replace(/\s+/g,' ').trim(),normalize(raw.acf.sources||''));assert.equal(record.author,raw.acf.author||'');}
  assert.equal($('.page-intro h1').text(),normalize(raw.title.rendered));count++;
 }
}
const manifest=JSON.parse(await readFile('migration/assets.json','utf8'));
for(const asset of manifest){const data=await readFile('public'+asset.path);assert.equal(createHash('sha256').update(data).digest('hex'),asset.sha256);}
assert.equal(JSON.parse(await readFile('migration/asset-failures.json','utf8')).length,0);
async function files(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(d=>d.isDirectory()?files(`${dir}/${d.name}`):`${dir}/${d.name}`))).flat();}
const failures=[];const pages=(await files('dist')).filter(p=>p.endsWith('.html'));
for(const page of pages){const $=load(await readFile(page,'utf8'));for(const el of $('[src],[href]').toArray()){for(const attr of ['src','href']){const href=$(el).attr(attr);if(!href?.startsWith('/')||href.startsWith('//'))continue;const path=decodeURIComponent(href.split(/[?#]/)[0]);try{const s=await stat('dist'+path);if(s.isDirectory())await stat('dist'+path.replace(/\/$/,'')+'/index.html');}catch{failures.push({page,href});}}}}
await import('node:fs/promises').then(fs=>fs.writeFile('migration/verification.json',JSON.stringify({verifiedAt:new Date().toISOString(),contentRecords:count,assets:manifest.length,pages:pages.length,missingLocalTargets:failures},null,2)));
assert.equal(failures.length,0,JSON.stringify(failures.slice(0,20)));
console.log(`Verified ${count} complete article/event bodies and article references, ${manifest.length} asset hashes, ${pages.length} pages and all local links.`);
