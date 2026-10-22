import 'dotenv/config';
import mysql from 'mysql2/promise';
import {randomUUID,randomBytes,createHash,scryptSync} from 'node:crypto';
import assert from 'node:assert/strict';
const url=new URL(process.env.DATABASE_URL);assert.ok(['localhost','127.0.0.1'].includes(url.hostname));
const db=await mysql.createConnection({uri:process.env.DATABASE_URL,timezone:'Z'}),base=process.env.APP_URL||'http://localhost:3000',ids=[],password=randomUUID();await db.execute("SET time_zone = '+00:00'");
const applicationUrl=new URL(base);assert.ok(['localhost','127.0.0.1'].includes(applicationUrl.hostname),'Access tests require a local application URL.');
async function api(route,body,cookie,method='POST'){const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined,redirect:'manual',signal:AbortSignal.timeout(120000)});return{status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};}
async function page(route,cookie){const r=await fetch(base+route,{headers:{Cookie:cookie},redirect:'manual',signal:AbortSignal.timeout(120000)});return{status:r.status,location:r.headers.get('location'),html:await r.text()};}
try{
 for(const role of ['family','nanny','admin']){
  const id=randomUUID(),email='verification-access-'+id+'@example.com',salt=randomBytes(16).toString('hex');ids.push(id);await db.execute('INSERT INTO users(id,name,email,role,password_hash) VALUES(?,?,?,?,?)',[id,'Verification fixture',email,role,salt+':'+scryptSync(password,salt,64).toString('hex')]);
  if(role==='admin')await db.execute("INSERT INTO admin_access(user_id,super_admin,status,role_label,permissions) VALUES(?,1,'active','Super Admin','[]')",[id]);
  const login=await api('/api/auth/login',{email,password});assert.equal(login.status,200);assert.equal(login.data.requiresVerification,role!=='admin');const cookie=login.cookie;
  if(role==='admin'){assert.equal((await api('/api/messages',null,cookie,'GET')).status,200);console.log('Administrator access remains available.');continue;}
  const home=await page('/dashboard/'+role,cookie);assert.equal(home.status,307);assert.ok(home.location.endsWith('/verify-email'));
  assert.equal((await page('/dashboard/messages',cookie)).location.endsWith('/verify-email'),true);
  assert.equal((await api('/api/messages',null,cookie,'GET')).status,401);
  assert.equal((await api('/api/'+role+'/profile',{name:'Should not save',phone:'555'},cookie,'PATCH')).status,401);
  const landing=await page('/verify-email',cookie);assert.equal(landing.status,200);assert.ok(landing.html.includes(email)&&landing.html.includes('Resend verification email'));
  const invalid=await api('/api/auth/verification',{token:'invalid'},cookie);assert.equal(invalid.status,400);
  const expired=randomBytes(32).toString('hex');await db.execute('INSERT INTO account_tokens(id,user_id,token_hash,purpose,expires_at) VALUES(?,?,?,?,?)',[randomUUID(),id,createHash('sha256').update(expired).digest('hex'),'verify',new Date(Date.now()-60000)]);assert.equal((await api('/api/auth/verification',{token:expired},cookie)).status,400);
  const token=randomBytes(32).toString('hex');await db.execute('INSERT INTO account_tokens(id,user_id,token_hash,purpose,expires_at) VALUES(?,?,?,?,?)',[randomUUID(),id,createHash('sha256').update(token).digest('hex'),'verify',new Date(Date.now()+86400000)]);
  assert.equal((await api('/api/auth/verification',{token},cookie)).status,200);
  assert.equal((await api('/api/auth/verification',{token},cookie)).status,400,'Verification links are single use');
  assert.equal((await api('/api/messages',null,cookie,'GET')).status,200,'Original session unlocks only after verified DB state');
  const allowed=await page('/dashboard/'+role,cookie);assert.equal(allowed.status,200);
  assert.equal((await api('/api/auth/login',{email,password})).data.requiresVerification,false);
  console.log(role+': unverified dashboard redirects, protected APIs blocked, verification page accessible, invalid/expired/reused links rejected, valid verification unlocks original session.');
 }
 console.log('Email-verification access checks passed. No registration, resend emails or external delivery were performed.');
}finally{for(const id of ids){await db.execute('DELETE FROM account_tokens WHERE user_id=?',[id]);await db.execute('DELETE FROM admin_access WHERE user_id=?',[id]);await db.execute('DELETE FROM users WHERE id=?',[id]);}await db.end();console.log('Temporary verification fixtures cleaned up.');}
