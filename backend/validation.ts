import type { ReportInput } from '../src/types.ts';
export class HttpError extends Error { constructor(public status:number,message:string){super(message);} }
export function validateInput(b:any):ReportInput {
  if(!b||typeof b!=='object'||Array.isArray(b))throw new HttpError(400,'Report body must be a JSON object');
  for(const key of ['severity','priority','result','reviewed','issue_type','immediate_hazard'])if(key in b)throw new HttpError(400,`${key} is assigned by the system, not the citizen`);
  const text=(key:string,max:number,required=false)=>{
    if(b[key]!==undefined&&typeof b[key]!=='string')throw new HttpError(400,`${key} must be text`);
    const value=(b[key]||'').trim();if((required&&!value)||value.length>max)throw new HttpError(400,`${key} is required or exceeds ${max} characters`);return value;
  };
  const input:ReportInput={description:text('description',3000,true),location:text('location',300,true),citizen_name:text('citizen_name',100)||'Anonymous citizen',
    duration:text('duration',100),impact:text('impact',1000),ward:text('ward',100)||'Unspecified',reporter_id:text('reporter_id',100)};
  if(input.description.length<10)throw new HttpError(400,'Please describe the problem in at least 10 characters');
  if(!/^[\w-]{8,100}$/.test(input.reporter_id||''))throw new HttpError(400,'A stable reporter_id (8–100 letters, numbers, hyphens) is required');
  if(b.lat!==undefined||b.lng!==undefined){
    if(typeof b.lat!=='number'||typeof b.lng!=='number'||!Number.isFinite(b.lat)||!Number.isFinite(b.lng)||Math.abs(b.lat)>90||Math.abs(b.lng)>180)throw new HttpError(400,'Provide both valid numeric latitude and longitude');
    input.lat=b.lat;input.lng=b.lng;
  }
  if(b.occurred_at!==undefined){
    if(typeof b.occurred_at!=='string'||!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(b.occurred_at)||!Number.isFinite(Date.parse(b.occurred_at)))throw new HttpError(400,'occurred_at must be an ISO timestamp with timezone');
    if(Date.parse(b.occurred_at)>Date.now()+300000||Date.parse(b.occurred_at)<Date.now()-180*86400000)throw new HttpError(400,'Occurrence time must be within the last 180 days');
    input.occurred_at=new Date(b.occurred_at).toISOString();
  }
  if(b.photoBase64){
    if(typeof b.photoBase64!=='string')throw new HttpError(400,'Photo must be a data URL');
    const match=b.photoBase64.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
    if(!match)throw new HttpError(400,'Use a JPEG, PNG or WebP image');
    const buf=Buffer.from(match[2],'base64');
    if(buf.length>5*1024*1024)throw new HttpError(413,'Photo exceeds 5 MB');
    if(buf.toString('base64')!==match[2])throw new HttpError(400,'Invalid base64 encoding');
    const valid=match[1]==='image/jpeg'?buf[0]===255&&buf[1]===216&&buf[2]===255:
      match[1]==='image/png'?buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):
      buf.subarray(0,4).toString()==='RIFF'&&buf.subarray(8,12).toString()==='WEBP';
    if(!valid)throw new HttpError(400,'Photo contents do not match its declared image format');
    input.photoBase64=b.photoBase64;
  }
  return input;
}
