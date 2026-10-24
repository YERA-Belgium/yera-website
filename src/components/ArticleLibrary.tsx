import {useEffect,useState} from 'react';
import {Search} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import type {Article} from '@/data/articles';
import {url} from '@/lib/utils';
import {topics,topicFor,topicLabel,formatDate} from '@/lib/topics';

type CardArticle=Omit<Article,'content'|'sources'>;

export default function ArticleLibrary({articles,locale='en'}:{articles:CardArticle[];locale?:'en'|'nl'}){
 const nl=locale==='nl';
 const [query,setQuery]=useState('');
 const [topic,setTopic]=useState('all');
 const [language,setLanguage]=useState<'dutch'|'english'>(locale==='nl'?'dutch':'english');

 useEffect(()=>{
  const t=new URLSearchParams(window.location.search).get('topic');
  if(topics.some(x=>x.id===t))setTopic(t!);
  const l=new URLSearchParams(window.location.search).get('language')||new URLSearchParams(window.location.search).get('lang');
  if(l==='dutch'||l==='nl')setLanguage('dutch');
  else if(l==='english'||l==='en')setLanguage('english');
 },[]);

 function selectTopic(id:string){
  setTopic(id);
  const u=new URL(window.location.href);
  if(id==='all')u.searchParams.delete('topic');else u.searchParams.set('topic',id);
  window.history.replaceState(null,'',u);
 }

 function selectLanguage(lang:'dutch'|'english'){
  setLanguage(lang);
  const u=new URL(window.location.href);
  if((lang==='dutch'&&nl)||(lang==='english'&&!nl)){
   u.searchParams.delete('language');
   u.searchParams.delete('lang');
  }else{
   u.searchParams.set('language',lang);
  }
  window.history.replaceState(null,'',u);
 }

 const isDutch=language==='dutch';
 const filtered=articles.filter(a=>{
  const articleLocale=(a as any).locale||(a.collection==='English collection'?'en':'nl');
  if(isDutch&&articleLocale!=='nl')return false;
  if(!isDutch&&articleLocale!=='en')return false;
  if(topic!=='all'&&topicFor(a.title)!==topic)return false;
  if(query.trim()&&!`${a.title} ${a.author} ${a.subtitle}`.toLowerCase().includes(query.trim().toLowerCase()))return false;
  return true;
 });

 const currentLangLocale=isDutch?'nl':'en';

 return <div className="journal-library">
 <div className="topic-filters" role="group" aria-label={nl?'Onderwerp':'Filter by topic'}>
  <button className={topic==='all'?'active':''} onClick={()=>selectTopic('all')} aria-pressed={topic==='all'}>{nl?'Alle onderwerpen':'All topics'}</button>
  {topics.map(t=><button key={t.id} className={topic===t.id?'active':''} onClick={()=>selectTopic(t.id)} aria-pressed={topic===t.id}>{t[locale]}</button>)}
 </div>
 <div className="archive-toolbar">
  <div className="archive-search">
   <Search size={18} aria-hidden="true"/>
   <label className="sr-only" htmlFor="article-search">{nl?'Zoek artikels':'Search articles'}</label>
   <Input id="article-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={nl?'Zoek een onderwerp, titel of auteur':'Search a topic, title or author'}/>
  </div>
  <div className="archive-selects">
   <label>
    {nl?'Taal':'Language'}
    <select value={language} onChange={e=>selectLanguage(e.target.value as 'dutch'|'english')}>
     <option value="dutch">{nl?'Nederlands':'Dutch'}</option>
     <option value="english">{nl?'Engels':'English'}</option>
    </select>
   </label>
  </div>
 </div>
 <div className="archive-results">
  <p className="result-count" role="status">{filtered.length} {nl?'artikels':'articles'}</p>
  <span>{nl?'Nieuwste eerst':'Latest first'}</span>
 </div>
 <div className="article-grid library-grid">
  {filtered.map(a=><article className="article-card" key={a.id}>
   {a.image&&<a className="cover-link" href={url(a.path)} aria-hidden="true" tabIndex={-1}><img className="article-cover" src={url(a.image)} alt={a.imageAlt} width="600" height="360" loading="lazy"/></a>}
   <div className="article-meta"><span className="category">{topicLabel(a.title,currentLangLocale)}</span><time dateTime={a.date}>{formatDate(a.date,currentLangLocale)}</time></div>
   <h3><a href={url(a.path)}>{a.title}</a></h3>
   {a.subtitle&&<p>{a.subtitle}</p>}
   <div className="byline">{a.author}</div>
  </article>)}
 </div>
 {filtered.length===0&&<div className="empty-results">
  <span className="eyebrow">{nl?'Probeer iets anders':'Try another perspective'}</span>
  <h3>{nl?'Geen artikels gevonden.':'No matching articles.'}</h3>
  <Button variant="outline" onClick={()=>{setQuery('');selectTopic('all');selectLanguage(locale==='nl'?'dutch':'english');}}>{nl?'Wis filters':'Clear filters'}</Button>
 </div>}
 </div>;
}
