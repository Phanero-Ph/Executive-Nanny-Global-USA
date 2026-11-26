import {and,eq,gt,inArray,lt} from "drizzle-orm";
import {db} from "@/db";
import {callBookingSettings,callBookings} from "@/db/schema";

export const DEFAULT_WEEKLY_HOURS:Record<string,{start:string;end:string}|null>={"0":null,"1":{start:"09:00",end:"17:00"},"2":{start:"09:00",end:"17:00"},"3":{start:"09:00",end:"17:00"},"4":{start:"09:00",end:"17:00"},"5":{start:"09:00",end:"17:00"},"6":null};
export async function getCallSettings(connection:typeof db|any=db){
 const [existing]=await connection.select().from(callBookingSettings).where(eq(callBookingSettings.id,1)).limit(1);
 if(existing)return existing;
 await connection.insert(callBookingSettings).values({id:1,timezone:"America/New_York",durationMinutes:30,bufferMinutes:0,leadHours:1,maxDaysAhead:60,weeklyHours:JSON.stringify(DEFAULT_WEEKLY_HOURS),blockedDates:"[]"}).onDuplicateKeyUpdate({set:{id:1}});
 const [row]=await connection.select().from(callBookingSettings).where(eq(callBookingSettings.id,1)).limit(1);return row;
}
export function parseSettings(row:any){let hours=DEFAULT_WEEKLY_HOURS,blocked:string[]=[];try{hours=JSON.parse(row.weeklyHours);}catch{}try{blocked=JSON.parse(row.blockedDates);}catch{}return {...row,hours,blocked};}
function localParts(date:Date,tz:string){const parts=new Intl.DateTimeFormat("en-US",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date);return Object.fromEntries(parts.map(p=>[p.type,p.value]));}
export function zonedTimeToUtc(local:string,tz:string){const [day,time]=local.split("T"),[y,m,d]=day.split("-").map(Number),[h,mi]=time.split(":").map(Number);const target=Date.UTC(y,m-1,d,h,mi);let value=target;for(let i=0;i<3;i++){const p=localParts(new Date(value),tz),seen=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);value+=target-seen;}return new Date(value);}
export function formatCallTime(date:Date,tz:string){return new Intl.DateTimeFormat("en-US",{timeZone:tz,weekday:"long",month:"long",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(date);}
export async function slotsForDate(day:string,connection:typeof db|any=db){
 if(!/^\d{4}-\d\d-\d\d$/.test(day))return {timezone:"America/New_York",durationMinutes:30,slots:[]};
 const row=await getCallSettings(connection),settings=parseSettings(row),weekday=String(new Date(`${day}T12:00:00Z`).getUTCDay()),hours=settings.hours[weekday];
 if(!hours||settings.blocked.includes(day))return {timezone:row.timezone,durationMinutes:row.durationMinutes,slots:[]};
 const startMinute=Number(hours.start.slice(0,2))*60+Number(hours.start.slice(3,5)),endMinute=Number(hours.end.slice(0,2))*60+Number(hours.end.slice(3,5)),step=row.durationMinutes+row.bufferMinutes,now=Date.now()+row.leadHours*3600000,max=Date.now()+row.maxDaysAhead*86400000;
 const [year,month,date]=day.split("-").map(Number),nextDay=new Date(Date.UTC(year,month-1,date+1)).toISOString().slice(0,10),from=zonedTimeToUtc(`${day}T00:00`,row.timezone),to=zonedTimeToUtc(`${nextDay}T00:00`,row.timezone);
 const bufferMs=row.bufferMinutes*60000,bookings=await connection.select({startsAt:callBookings.startsAt,endsAt:callBookings.endsAt}).from(callBookings).where(and(inOpen(),lt(callBookings.startsAt,new Date(to.getTime()+bufferMs)),gt(callBookings.endsAt,new Date(from.getTime()-bufferMs))));
 const slots=[];for(let minute=startMinute;minute+row.durationMinutes<=endMinute;minute+=step){const local=`${day}T${String(Math.floor(minute/60)).padStart(2,"0")}:${String(minute%60).padStart(2,"0")}`,start=zonedTimeToUtc(local,row.timezone),end=new Date(start.getTime()+row.durationMinutes*60000);if(start.getTime()<now||start.getTime()>max||bookings.some((b:any)=>start.getTime()<b.endsAt.getTime()+bufferMs&&end.getTime()>b.startsAt.getTime()-bufferMs))continue;slots.push({startsAt:start.toISOString(),label:new Intl.DateTimeFormat("en-US",{timeZone:row.timezone,hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(start)});}
 return {timezone:row.timezone,durationMinutes:row.durationMinutes,slots};
}
function inOpen(){return inArray(callBookings.status,["pending","confirmed"]);}
