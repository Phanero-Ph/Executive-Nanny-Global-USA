import 'dotenv/config';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import {randomUUID,createHmac} from 'node:crypto';
const database=new URL(process.env.DATABASE_URL),base=process.env.APP_URL||'http://localhost:3000';
assert.ok(['localhost','127.0.0.1'].includes(database.hostname));assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const db=await mysql.createConnection({uri:process.env.DATABASE_URL,timezone:'Z'}),members=[],threads=[];
async function account(role){const id=randomUUID();await db.execute('INSERT INTO users(id,name,email,role,password_hash,email_verified_at) VALUES(?,?,?,?,?,UTC_TIMESTAMP())',[id,'Chat fixture '+role,'chat-'+id+'@example.com',role,'fixture-no-login']);members.push(id);if(role==='admin')await db.execute("INSERT INTO admin_access(user_id,super_admin,status,role_label,permissions) VALUES(?,1,'active','Super Admin','[]')",[id]);const payload=Buffer.from(JSON.stringify({uid:id,role,version:0,exp:Date.now()+3600000})).toString('base64url');return{id,cookie:'egn_session='+payload+'.'+createHmac('sha256',process.env.SESSION_SECRET||'dev-secret-change-in-production').update(payload).digest('hex')};}
async function api(route,user,body,origin){const r=await fetch(base+route,{method:body?'POST':'GET',headers:{...(user?{Cookie:user.cookie}:{}),'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(120000)});return{status:r.status,data:await r.json()};}
const send=(id,user,body,key=randomUUID())=>api('/api/messages/'+id,user,{action:'send',body,requestKey:key});
try{
 const family=await account('family'),nanny=await account('nanny'),other=await account('family'),admin=await account('admin');
 assert.equal((await api('/api/messages')).status,401);
 assert.equal((await api('/api/messages',family,{},'https://other.example')).status,403);
 assert.equal((await api('/api/messages',family,{memberId:nanny.id})).status,400);
 const starts=await Promise.all([api('/api/messages',family,{}),api('/api/messages',admin,{memberId:family.id})]);assert.ok(starts.every(r=>r.status===200),JSON.stringify(starts));assert.equal(starts[0].data.id,starts[1].data.id);const f=starts[0].data.id;threads.push(f);
 const n=(await api('/api/messages',nanny,{})).data.id;threads.push(n);assert.notEqual(f,n);
 for(const [id,unauthorized] of [[f,nanny],[n,family],[f,other]]){assert.equal((await api('/api/messages/'+id,unauthorized)).status,404);assert.equal((await send(id,unauthorized,'Blocked')).status,404);}
 assert.equal((await api('/api/messages?contacts=Chat',family)).status,403);assert.ok((await api('/api/messages?contacts=Chat',admin)).data.contacts.some(c=>c.id===family.id));
 assert.equal((await send(f,family,' ')).status,400);assert.equal((await send(f,family,'x'.repeat(2001))).status,400);
 const key=randomUUID(),sent=await Promise.all([send(f,family,'PRIVATE-FAMILY',key),send(f,family,'PRIVATE-FAMILY',key)]);assert.ok(sent.every(r=>r.status===200));assert.equal(sent[0].data.id,sent[1].data.id);assert.equal((await send(f,family,'Changed body',key)).status,409);
 const [jobs]=await db.execute('SELECT user_id,body FROM mail_jobs WHERE subject=?',['New message '+f]);assert.ok(jobs.some(j=>j.user_id===admin.id));assert.ok(jobs.every(j=>j.user_id!==nanny.id&&!j.body.includes('PRIVATE-FAMILY')));
 assert.equal((await api('/api/messages',nanny)).data.conversations.length,1);assert.ok(!(await api('/api/messages',nanny)).data.conversations.some(c=>c.id===f));
 assert.equal((await api('/api/messages',admin)).data.conversations.find(c=>c.id===f).unread,1);
 assert.equal((await api('/api/messages/'+f,admin,{action:'read',sequence:1})).status,200);assert.equal((await api('/api/messages/'+f,admin,{action:'read',sequence:0})).status,200);assert.equal((await api('/api/messages',admin)).data.conversations.find(c=>c.id===f).unread,0);
 assert.equal((await send(f,admin,'Agency reply to family')).status,200);assert.equal((await send(n,admin,'Agency reply to caregiver')).status,200);assert.equal((await api('/api/messages/'+n,nanny)).data.messages[0].body,'Agency reply to caregiver');
 for(let i=3;i<=62;i++)await db.execute('INSERT INTO conversation_messages(id,conversation_id,sender_id,request_key,sequence,body) VALUES(?,?,?,?,?,?)',[randomUUID(),f,admin.id,randomUUID(),i,'History '+i]);await db.execute('UPDATE conversations SET last_sequence=62 WHERE id=?',[f]);
 const latest=(await api('/api/messages/'+f,family)).data;assert.equal(latest.messages.length,50);const older=(await api('/api/messages/'+f+'?before='+latest.olderCursor,family)).data;assert.equal(older.messages[0].sequence,1);assert.equal(older.messages.length,12);
 const legacy=randomUUID();threads.push(legacy);await db.execute('INSERT INTO conversations(id,kind,source_id,family_id,nanny_id,updated_at) VALUES(?,?,?,?,?,UTC_TIMESTAMP())',[legacy,'match',randomUUID(),family.id,nanny.id]);for(const user of [family,nanny,admin]){assert.equal((await api('/api/messages/'+legacy,user)).status,404);assert.equal((await send(legacy,user,'Legacy blocked')).status,404);}
 for(const user of [family,nanny,admin]){const r=await fetch(base+'/dashboard/messages',{headers:{Cookie:user.cookie},signal:AbortSignal.timeout(120000)});assert.equal(r.status,200);assert.ok((await r.text()).includes('PRIVATE AGENCY MESSAGING'));}
 const r=await fetch(base+'/dashboard/messages/'+f,{headers:{Cookie:nanny.cookie},signal:AbortSignal.timeout(120000)});assert.equal(r.status,404);
 console.log('Passed: isolated family/admin and caregiver/admin chats, legacy thread blocking, admin contact search, concurrent starts, retry safety, unread cursors, history pagination, notification privacy and page access.');
}finally{
 for(const id of threads){await db.execute('DELETE FROM mail_jobs WHERE subject=?',['New message '+id]);await db.execute('DELETE FROM conversation_reads WHERE conversation_id=?',[id]);await db.execute('DELETE FROM conversation_messages WHERE conversation_id=?',[id]);await db.execute('DELETE FROM conversations WHERE id=?',[id]);}
 for(const id of members)await db.execute('DELETE FROM admin_access WHERE user_id=?',[id]);await db.execute('DELETE FROM users WHERE id=?',[id]);await db.end();console.log('Temporary chat fixtures cleaned up.');
}
