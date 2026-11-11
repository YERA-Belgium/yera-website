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
