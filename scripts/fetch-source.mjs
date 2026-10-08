import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('migration/source',{recursive:true});
for(const type of ['article','article-english','event','bestuur','member','alumni','yera_author','carousel_item','carousel_item_en']) {
 let all=[],pages=1;
 for(let page=1;page<=pages;page++) {
  const u=`https://www.yera.be/wp-json/wp/v2/${type}?per_page=100&page=${page}`;
  const r=await fetch(u); if(!r.ok)throw Error(`${r.status}: ${u}`);
  pages=Number(r.headers.get('x-wp-totalpages')||1);all.push(...await r.json());
 }
 await writeFile(`migration/source/${type}.json`,JSON.stringify(all,null,2));
 console.log(type,all.length);
}
