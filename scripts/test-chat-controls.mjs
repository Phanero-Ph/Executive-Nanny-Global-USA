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
 vm.runInNewContext(source,{exports,module:runtimeModule,require:localRequire,process,console,Date,URL,Request,Response,Buffer,File,FormData,Uint8Array,TextDecoder,TextEncoder,globalThis:{}},{filename});cache.set(filename,runtimeModule.exports);return runtimeModule.exports;}

const connection=await mysql.createConnection({uri:process.env.DATABASE_URL,timezone:'Z'}),ids=[],threads=[],stored=[];let pool;const original=(await connection.execute('SELECT * FROM agency_chat_settings WHERE id=1'))[0][0];
const request=(body,method='POST',origin)=>new Request('http://localhost:3000/api/messages',{method,headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify(body)});
const params=(id,fileId)=>({params:Promise.resolve({id,fileId})});
async function account(role){const id=randomUUID();ids.push(id);await connection.execute('INSERT INTO users(id,name,email,role,password_hash,email_verified_at) VALUES(?,?,?,?,?,UTC_TIMESTAMP())',[id,'Chat controls fixture','chat-controls-'+id+'@example.com',role,'fixture-no-login']);if(role==='admin')await connection.execute("INSERT INTO admin_access(user_id,super_admin,status,role_label,permissions) VALUES(?,1,'active','Super Admin','[]')",[id]);return{id,role};}
try{
 const admin=await account('admin'),family=await account('family'),nanny=await account('nanny');
 const module=load('src/db/index.ts');pool=module.pool;const settings=load('src/lib/chat-settings.ts'),control=load('src/app/api/admin/chat-settings/route.ts'),inbox=load('src/app/api/messages/route.ts'),messages=load('src/app/api/messages/[id]/route.ts'),files=load('src/app/api/messages/[id]/files/route.ts'),download=load('src/app/api/messages/[id]/files/[fileId]/route.ts'),access=load('src/app/api/chat-access/route.ts');
 actor=null;assert.equal((await control.PATCH(request({}))).status,401);
 for(const member of [family,nanny]){actor=member;assert.equal((await control.PATCH(request({}))).status,403);}
 actor=admin;assert.equal((await control.PATCH(request({familyEnabled:'yes',nannyEnabled:true,revision:0}))).status,400);assert.equal((await control.PATCH(request({},'PATCH','https://other.example'))).status,403);
 async function toggle(f,n){actor=admin;const old=await settings.getChatSettings();const response=await control.PATCH(request({familyEnabled:f,nannyEnabled:n,revision:old.revision},'PATCH'));assert.equal(response.status,200,await response.clone().text());if(old.familyEnabled!==f||old.nannyEnabled!==n)assert.equal((await control.PATCH(request({familyEnabled:f,nannyEnabled:n,revision:old.revision},'PATCH'))).status,409);}
 await toggle(true,true);
 for(const member of [family,nanny]){actor=member;const response=await inbox.POST(request({}));assert.equal(response.status,200);const id=(await response.json()).id;threads.push(id);const form=new FormData();form.set('file',new File(['Private retained file'],'private.txt',{type:'text/plain'}));form.set('uploadKey',randomUUID());const uploaded=await files.POST(new Request('http://localhost:3000/api/messages/'+id+'/files',{method:'POST',body:form}),params(id));assert.equal(uploaded.status,200,await uploaded.clone().text());member.file=(await uploaded.json()).attachment.id;const [meta]=(await connection.execute('SELECT stored_name FROM conversation_attachments WHERE id=?',[member.file]))[0];stored.push(meta.stored_name);const sent=await messages.POST(request({action:'send',body:'Retained conversation',attachmentIds:[member.file],requestKey:randomUUID()}),params(id));assert.equal(sent.status,200);member.thread=id;}
 for(const [f,n] of [[false,true],[true,false],[false,false],[true,true]]){
  await toggle(f,n);
  actor=admin;const adminInbox=await (await inbox.GET(new Request('http://localhost:3000/api/messages'))).json();
  const contacts=await (await inbox.GET(new Request('http://localhost:3000/api/messages?contacts=Chat%20controls'))).json();
  for(const [member,enabled] of [[family,f],[nanny,n]]){
   assert.equal(adminInbox.conversations.some(t=>t.id===member.thread),enabled);assert.equal(contacts.contacts.some(c=>c.id===member.id),enabled);
   actor=member;const flags=await access.GET();assert.equal(flags.headers.get('cache-control'),'private, no-store');const config=await flags.json();assert.equal(config.familyEnabled,f);assert.equal(config.nannyEnabled,n);
   const listing=await inbox.GET(new Request('http://localhost:3000/api/messages'));assert.equal(listing.status,enabled?200:403);
   assert.equal((await inbox.POST(request({}))).status,enabled?200:403);
   assert.equal((await messages.GET(new Request('http://localhost:3000/api/messages/'+member.thread),params(member.thread))).status,enabled?200:403);
   assert.equal((await messages.POST(request({action:'send',body:'Check access',requestKey:randomUUID()}),params(member.thread))).status,enabled?200:403);
   assert.equal((await messages.POST(request({action:'read',sequence:1}),params(member.thread))).status,enabled?200:403);
   const file=await download.GET(new Request('http://localhost:3000/file'),params(member.thread,member.file));assert.equal(file.status,enabled?200:403);if(enabled)assert.equal(await file.text(),'Private retained file');
   if(!enabled){assert.equal((await files.POST(request({}),params(member.thread))).status,403);assert.equal((await download.DELETE(request({},'DELETE'),params(member.thread,member.file))).status,403);actor=admin;assert.equal((await messages.POST(request({action:'send',body:'Must not deliver',requestKey:randomUUID()}),params(member.thread))).status,404);assert.equal((await inbox.POST(request({memberId:member.id}))).status,404);assert.equal((await download.GET(new Request('http://localhost:3000/file'),params(member.thread,member.file))).status,404);}
  }
 }
 const [audit]=await connection.execute("SELECT id FROM review_events WHERE reviewer_id=? AND from_status='chat_settings'",[admin.id]);assert.ok(audit.length>=4);
 for(const member of [family,nanny]){actor=member;const restored=await (await messages.GET(new Request('http://localhost:3000/thread'),params(member.thread))).json();assert.equal(restored.messages[0].body,'Retained conversation');assert.equal(restored.messages[0].attachments[0].id,member.file);}
 console.log('Chat controls passed: admin authorization, validation, origin checks, stale edits, all four role combinations, inbox/contact filtering, send/read/upload/download/delete restrictions, private access settings, audit history and restored messages/files.');
}finally{
 if(original)await connection.execute('UPDATE agency_chat_settings SET family_enabled=?,nanny_enabled=?,revision=?,updated_by=?,updated_at=? WHERE id=1',[original.family_enabled,original.nanny_enabled,original.revision,original.updated_by,original.updated_at]);else await connection.execute('DELETE FROM agency_chat_settings WHERE id=1');
 for(const id of threads){await connection.execute('DELETE FROM mail_jobs WHERE subject=?',['New message '+id]);await connection.execute('DELETE FROM conversation_attachments WHERE conversation_id=?',[id]);await connection.execute('DELETE FROM conversation_reads WHERE conversation_id=?',[id]);await connection.execute('DELETE FROM conversation_messages WHERE conversation_id=?',[id]);await connection.execute('DELETE FROM conversations WHERE id=?',[id]);}
 for(const id of ids){await connection.execute('DELETE FROM review_events WHERE reviewer_id=?',[id]);await connection.execute('DELETE FROM admin_access WHERE user_id=?',[id]);await connection.execute('DELETE FROM users WHERE id=?',[id]);}for(const name of stored)fs.rmSync(path.join('.data','chat-uploads',name),{force:true});await connection.end();await pool?.end();console.log('Chat control fixtures removed; original settings restored.');
}
