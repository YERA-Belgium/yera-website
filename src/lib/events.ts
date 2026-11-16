const eventDateKey=(date:string)=>{
 const [day,month,year]=date.split('/');
 return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
};

export function eventDate(date:string){
 return new Date(`${eventDateKey(date)}T12:00:00Z`);
}

export function isPastEvent(date:string,now=new Date()){
 const today=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
 const eventDay=Date.UTC(Number(date.split('/')[2]),Number(date.split('/')[1])-1,Number(date.split('/')[0]));
 return eventDay<today;
}

// Academic years run from September through August (e.g. 15/10/2025 and 20/03/2026 both belong to "2025–2026").
export const ACADEMIC_YEAR_START_MONTH=9;

export function academicYear(date:string){
 const [,month,year]=date.split('/').map(Number);
 if(!year||!month)return 'Archive';
 const start=month>=ACADEMIC_YEAR_START_MONTH?year:year-1;
 return `${start}–${start+1}`;
}
