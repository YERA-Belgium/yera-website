export const topics = [
  {id:'grids',en:'Electricity & grids',nl:'Elektriciteit & netten'},
  {id:'renewables',en:'Renewable energy',nl:'Hernieuwbare energie'},
  {id:'nuclear',en:'Nuclear energy',nl:'Kernenergie'},
  {id:'storage',en:'Storage & mobility',nl:'Opslag & mobiliteit'},
  {id:'markets',en:'Markets & policy',nl:'Markten & beleid'},
  {id:'climate',en:'Climate & society',nl:'Klimaat & samenleving'},
] as const;
export type TopicId=typeof topics[number]['id'];
// Browsing metadata only. Original titles, categories and publication text remain intact.
export function topicFor(title:string):TopicId {
 const t=title.toLowerCase();
 if(/nucle|kern|fusi|reactor|tsjernobyl|myrrha|kernafval/.test(t))return 'nuclear';
 if(/waterstof|hydrogen|batter|opslag|storage|mobil|transport|vessel|voertuig|vehicle|vlieg|vliegt|buss|bussen|ammoniak|tankers|lithium|elektrisch rijden|elektrische auto|diesel/.test(t))return 'storage';
 if(/grid|netten|netwerk|hoogspann|voltage|blackout|elektriciteitstekort|bevoorrad|balanc|ventilus|windmolenparken met de kust|elektriciteitsmeters|stroom|cyber|security of supply/.test(t))return 'grids';
 if(/wind|north sea|offshore|noordzee|zon|solar|hernieuw|renewable|waterkracht|bio|houtpellet|afval tot energie|fossil|aardgas|schalie|gascentrale|olie|oil|nord stream/.test(t))return 'renewables';
 if(/markt|market|prijs|prijz|factuur|handel|trading|polit|beleid|policy|minister|regeer|crisis|green deal|subsid|tax|netvergoeding|econ|financ/.test(t))return 'markets';
 return 'climate';
}
export function topicLabel(title:string,locale:'en'|'nl'='en'){return topics.find(t=>t.id===topicFor(title))![locale];}
export function formatDate(date:string,locale:'en'|'nl'='en'){return new Intl.DateTimeFormat(locale==='nl'?'nl-BE':'en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date));}
