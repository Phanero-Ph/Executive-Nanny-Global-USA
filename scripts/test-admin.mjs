import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID,createHmac} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
import mysql from 'mysql2/promise';
const url=new URL(process.env.DATABASE_URL);assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/executive_nanny');
const require=createRequire(import.meta.url),cache=new Map();let actor=null;const mock={};
function load(filename){filename=path.resolve(filename);if(cache.has(filename))return cache.get(filename);const exports={};cache.set(filename,exports);const source=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const runtimeModule={exports};function localRequire(name){if(name==='@/lib/mail'||(name==='./mail'))return{appUrl:p=>new URL(p,'http://localhost:3000').toString(),notifySubmission:async()=>{},queueEmail:async()=>{}};if(name==='@/lib/auth')return{getCurrentUser:async()=>actor};if(name==='@/lib/stripe'||(name==='./stripe'&&filename.endsWith('stripe-events.ts')))return{...load('src/lib/stripe.ts'),getStripe:()=>mock};if(name.startsWith('@/')){const base=path.resolve('src',name.slice(2));return load(fs.existsSync(base+'.ts')?base+'.ts':path.join(base,'index.ts'));}if(name.startsWith('.')){const base=path.resolve(path.dirname(filename),name);if(fs.existsSync(base+'.ts'))return load(base+'.ts');}return require(name);}
 vm.runInNewContext(source,{exports,module:runtimeModule,require:localRequire,process,console,Date,URL,Request,Response,Buffer,globalThis:{}},{filename});cache.set(filename,runtimeModule.exports);return runtimeModule.exports;}

const connection=await mysql.createConnection({uri:process.env.DATABASE_URL,timezone:'Z'}),adminId=randomUUID(),familyId=randomUUID(),nannyId=randomUUID(),requestId=randomUUID(),cycleId=randomUUID(),paymentId=randomUUID(),suffix=randomUUID();let pool;
const request=body=>new Request('http://localhost:3000/api/admin/accounts/'+nannyId,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const params=id=>({params:Promise.resolve({id})});
async function rows(sql,args=[]){return(await connection.execute(sql,args))[0];}
try{
 await connection.execute("SET time_zone = '+00:00'");
 for(const [id,role,name] of [[adminId,'admin','Admin fixture'],[familyId,'family','=SUM(1,1)'],[nannyId,'nanny','Nanny directory '+suffix]])await connection.execute('INSERT INTO users (id,name,email,role,password_hash) VALUES (?,?,?,?,?)',[id,name,'directory-'+id+'@example.com',role,'fixture-no-login']);
 await connection.execute("INSERT INTO admin_access(user_id,super_admin,status,role_label,permissions) VALUES(?,1,'active','Super Admin','[]')",[adminId]);
 const dbModule=load('src/db/index.ts');pool=dbModule.pool;
 const api=load('src/app/api/admin/accounts/[id]/route.ts'),reports=load('src/app/api/admin/reports/route.ts');
 assert.equal((await api.PATCH(request({}),params(nannyId))).status,401);
 assert.equal((await reports.GET(new Request('http://localhost/api/admin/reports'))).status,401);
 actor={id:familyId,role:'family'};assert.equal((await api.PATCH(request({}),params(nannyId))).status,403);assert.equal((await reports.GET(new Request('http://localhost/api/admin/reports'))).status,403);
 actor={id:adminId,role:'admin'};const [before]=await rows('SELECT updated_at FROM users WHERE id=?',[nannyId]);
 const body={name:'Updated nanny '+suffix,phone:'555-0101',version:before.updated_at.toISOString()};
 assert.equal((await api.PATCH(request({...body,name:''}),params(nannyId))).status,400);
 assert.equal((await api.PATCH(request(body),params(nannyId))).status,200);
 assert.equal((await api.PATCH(request(body),params(nannyId))).status,409);
 const [updated]=await rows('SELECT name,phone,role FROM users WHERE id=?',[nannyId]);assert.equal(updated.name,body.name);assert.equal(updated.phone,body.phone);assert.equal(updated.role,'nanny');
 assert.equal((await rows('SELECT id FROM review_events WHERE reviewer_id=?',[adminId])).length,1);
 await connection.execute('INSERT INTO family_requests (id,user_id,name,email,service_type,care_category,status) VALUES (?,?,?,?,?,?,?)',[requestId,familyId,'UNPAID-HIDDEN-'+suffix,'directory-'+familyId+'@example.com','Caregiver support','caregiver','hidden-'+suffix.slice(0,10)]);
 await connection.execute('INSERT INTO membership_cycles (id,user_id,plan,amount_cents,start_date,end_date,created_by) VALUES (?,?,?,?,?,?,?)',[cycleId,familyId,'Basic',5900,'2099-01-01','2099-02-01',adminId]);
 await connection.execute('INSERT INTO membership_payments (id,cycle_id,amount_cents,reference,method,paid_date,recorded_by) VALUES (?,?,?,?,?,?,?)',[paymentId,cycleId,5900,'fixture-'+suffix,'cash','2099-01-01',adminId]);
 const summary=await reports.GET(new Request('http://localhost/api/admin/reports?type=summary'));assert.equal(summary.status,200);assert.ok(!(await summary.text()).includes('hidden-'+suffix.slice(0,10)));
 const payments=await reports.GET(new Request('http://localhost/api/admin/reports?type=payments'));assert.equal(payments.status,200);assert.equal(payments.headers.get('cache-control'),'private, no-store');assert.ok((await payments.text()).includes("'=SUM(1,1)"),'Formula-like names are neutralized in CSV exports');
 const csv=load('src/lib/admin-reporting.ts').csv;assert.equal(csv([['a'],['b']]).split('\r\n').length,2);assert.ok(csv([['  =1+1']]).includes("'  =1+1"));assert.ok(csv([['@SUM(A1)','Line "quoted"',100]]).includes("'@SUM(A1)"));
 const payload=Buffer.from(JSON.stringify({uid:adminId,role:'admin',version:0,exp:Date.now()+3600000})).toString('base64url'),signature=createHmac('sha256',process.env.SESSION_SECRET||'dev-secret-change-in-production').update(payload).digest('hex');
 for(const route of ['/dashboard/admin/nannies','/dashboard/admin/nannies/'+nannyId,'/dashboard/admin/families','/dashboard/admin/families/'+familyId,'/dashboard/admin/requests?category=caregiver','/dashboard/admin/applications','/dashboard/admin/payments','/dashboard/admin/reports','/dashboard/admin/settings']){
  const response=await fetch('http://localhost:3000'+route,{headers:{Cookie:'egn_session='+payload+'.'+signature},redirect:'manual',signal:AbortSignal.timeout(120000)});assert.equal(response.status,200,route);const html=await response.text();assert.ok(!html.includes('UNPAID-HIDDEN-'+suffix),'Unpaid request remains hidden: '+route);console.log('Page passed: '+route.replace(nannyId,'[nanny]').replace(familyId,'[family]'));
 }
 console.log('Admin account authorization, validation, stale edits, audit history, report privacy, safe CSV exports and all new pages passed.');
}finally{
 await connection.execute('DELETE FROM review_events WHERE reviewer_id=?',[adminId]);await connection.execute('DELETE FROM membership_payments WHERE id=?',[paymentId]);await connection.execute('DELETE FROM membership_cycles WHERE id=?',[cycleId]);await connection.execute('DELETE FROM family_requests WHERE id=?',[requestId]);for(const id of [nannyId,familyId,adminId])await connection.execute('DELETE FROM admin_access WHERE user_id=?',[id]);await connection.execute('DELETE FROM users WHERE id=?',[id]);await connection.end();await pool?.end();console.log('Temporary admin fixtures cleaned up.');
}
