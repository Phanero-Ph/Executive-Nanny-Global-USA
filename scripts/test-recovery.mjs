import 'dotenv/config';
import mysql from 'mysql2/promise';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
assert.equal(process.env.EMAIL_MODE,'preview','Recovery tests require local email-preview mode.');
const url=new URL(process.env.DATABASE_URL);assert.ok(['localhost','127.0.0.1'].includes(url.hostname));
const db=await mysql.createConnection({uri:process.env.DATABASE_URL,timezone:"Z"}),base=process.env.APP_URL;
const email=`recovery-${randomUUID()}@example.com`,oldPassword=randomUUID(),newPassword=randomUUID();let userId;
async function post(route,body,cookie){const response=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});return{status:response.status,json:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};}
async function preview(subject){const [jobs]=await db.execute('SELECT id,status FROM mail_jobs WHERE user_id=? AND subject=? ORDER BY created_at DESC',[userId,subject]);assert.ok(jobs.length);assert.equal(jobs[0].status,'preview');return JSON.parse(await fs.readFile(path.join('.data','mail-preview',jobs[0].id+'.json'),'utf8'));}
try {
 const registration=await post('/api/auth/signup',{name:'Recovery Test',email,password:oldPassword,role:'family'});assert.equal(registration.status,200,JSON.stringify(registration.json));const [users]=await db.execute('SELECT id FROM users WHERE email=?',[email]);userId=users[0].id;
 const verification=await preview('Verify your email address'),verifyToken=verification.text.match(/token=([a-f0-9]{64})/)[1];
 assert.equal((await post('/api/auth/reset-password',{token:verifyToken,password:newPassword,confirmPassword:newPassword})).status,400);
 assert.equal((await post('/api/auth/verification',{token:verifyToken})).status,200);assert.equal((await post('/api/auth/verification',{token:verifyToken})).status,400);const [verified]=await db.execute('SELECT email_verified_at FROM users WHERE id=?',[userId]);assert.ok(verified[0].email_verified_at);console.log('Email verification, purpose separation and one-time token: passed');
 const unknown=await post('/api/auth/forgot-password',{email:`unknown-${randomUUID()}@example.com`}),known=await post('/api/auth/forgot-password',{email});assert.equal(unknown.status,known.status);assert.deepEqual(unknown.json,known.json);
 const reset=await preview('Reset your password'),token=reset.text.match(/token=([a-f0-9]{64})/)[1];const [stored]=await db.execute('SELECT token_hash FROM account_tokens WHERE user_id=? AND purpose=?',[userId,'reset']);assert.notEqual(stored[0].token_hash,token);assert.equal(stored[0].token_hash,createHash('sha256').update(token).digest('hex'));
 const stale= randomBytes(32).toString('hex');await db.execute('INSERT INTO account_tokens (id,user_id,token_hash,purpose,expires_at) VALUES (?,?,?,?,?)',[randomUUID(),userId,createHash('sha256').update(stale).digest('hex'),'reset',new Date(Date.now()-60000)]);assert.equal((await post('/api/auth/reset-password',{token:stale,password:newPassword,confirmPassword:newPassword})).status,400);
 assert.equal((await post('/api/auth/reset-password',{token,password:newPassword,confirmPassword:'mismatch'})).status,400);assert.equal((await post('/api/auth/reset-password',{token,password:newPassword,confirmPassword:newPassword})).status,200);assert.equal((await post('/api/auth/reset-password',{token,password:newPassword,confirmPassword:newPassword})).status,400);
 const oldSession=await (await fetch(base+'/api/auth/me',{headers:{Cookie:registration.cookie}})).json();assert.equal(oldSession.user,null);assert.equal((await post('/api/auth/login',{email,password:oldPassword})).status,401);const newLogin=await post('/api/auth/login',{email,password:newPassword});assert.equal(newLogin.status,200);const freshSession=await (await fetch(base+'/api/auth/me',{headers:{Cookie:newLogin.cookie}})).json();assert.equal(freshSession.user.id,userId);console.log('Reset expiry, hashed tokens, password validation, replay prevention and session revocation: passed');
 const [before]=await db.execute('SELECT COUNT(*) AS count FROM account_tokens WHERE user_id=?',[userId]);for(let i=0;i<5;i++)await post('/api/auth/forgot-password',{email});const [after]=await db.execute('SELECT COUNT(*) AS count FROM account_tokens WHERE user_id=?',[userId]);assert.equal(before[0].count,after[0].count);console.log('Recovery request throttling: passed');
 const request=await post('/api/find-nanny',{name:'Recovery Test',email,phone:'9085550100',startDate:'2026-12-01',numberOfChildren:'1',nannyTypes:['Live-out'],childrenAges:[],additionalCare:[]},newLogin.cookie);assert.equal(request.status,200);const confirmation=await preview('We received your care request');assert.ok(confirmation.text.includes('/dashboard/family'));console.log('Submission confirmation preview: passed');
 const [payloads]=await db.execute('SELECT body FROM mail_jobs WHERE user_id=?',[userId]);assert.ok(payloads.every(row=>row.body===''));console.log('Delivered/previewed email bodies cleared from queue: passed');
 const retryId=randomUUID();await db.execute('INSERT INTO mail_jobs (id,user_id,recipient,subject,body) VALUES (?,?,?,?,?)',[retryId,userId,email,'Retry test','Local delivery retry test']);
 execFileSync(process.execPath,['scripts/process-mail.mjs'],{env:{...process.env,EMAIL_MODE:'smtp',SMTP_PASS:''},stdio:'pipe'});const [failed]=await db.execute('SELECT status,attempts,body FROM mail_jobs WHERE id=?',[retryId]);assert.equal(failed[0].status,'pending');assert.ok(failed[0].body);
 execFileSync(process.execPath,['scripts/process-mail.mjs'],{env:{...process.env,EMAIL_MODE:'preview'},stdio:'pipe'});const [retried]=await db.execute('SELECT status,attempts,body FROM mail_jobs WHERE id=?',[retryId]);assert.equal(retried[0].status,'preview');assert.equal(retried[0].attempts,2);assert.equal(retried[0].body,'');console.log('Failed SMTP delivery retained and retried successfully in preview mode: passed');

 console.log('All recovery and local email tests passed. No real email sent.');
} finally {
 if(userId){const [jobs]=await db.execute('SELECT id FROM mail_jobs WHERE user_id=?',[userId]);for(const job of jobs)await fs.unlink(path.join('.data','mail-preview',job.id+'.json')).catch(()=>{});await db.execute('DELETE FROM family_requests WHERE user_id=?',[userId]);await db.execute('DELETE FROM users WHERE id=?',[userId]);}
 await db.end();console.log('Temporary recovery test data removed.');
}
