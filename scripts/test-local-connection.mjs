import 'dotenv/config';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import { randomUUID, randomBytes, scryptSync } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import ts from 'typescript';
assert.equal(process.env.EMAIL_MODE,'preview','Local integration tests require preview email mode.');
const base=process.env.EGN_TEST_URL||'http://localhost:3000';
const dashboardTestUrl=new URL(base);assert.ok(['localhost','127.0.0.1'].includes(dashboardTestUrl.hostname)&&['http:','https:'].includes(dashboardTestUrl.protocol),'Dashboard integration tests require a local application URL.');

const databaseUrl = new URL(process.env.DATABASE_URL || 'mysql://invalid');
assert.ok(['127.0.0.1', 'localhost'].includes(databaseUrl.hostname) && databaseUrl.pathname === '/executive_nanny', 'Run these tests only against the local executive_nanny development database.');
const connection=await mysql.createConnection(process.env.DATABASE_URL);
let adminId;
const suffix=randomUUID(), emails=[`family-${suffix}@example.com`,`nanny-${suffix}@example.com`,`other-${suffix}@example.com`], password=randomUUID();
async function request(route,body,cookie) {
 const response=await fetch(base+route,{method:body?'POST':'GET',headers:{...(body && !(body instanceof FormData)?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(120000)});
 return {status:response.status,json:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
try {
 const health=await request('/api/health');assert.equal(health.status,200);console.log('Database health: passed');
 const family={name:'Local Setup Test',email:emails[0],phone:'9085550100',startDate:'2026-12-01',numberOfChildren:'1',nannyTypes:['Live-out'],childrenAges:['2-4 years'],additionalCare:[],password,confirmPassword:password};
 const registered=await request('/api/find-nanny',family);assert.equal(registered.status,200,JSON.stringify(registered.json));
 const me=await request('/api/auth/me',null,registered.cookie);assert.equal(me.json.user.role,'family');
 const [requests]=await connection.execute('SELECT id FROM family_requests WHERE user_id=?',[me.json.user.id]);assert.equal(requests.length,1);console.log('Family account, request and session: passed');
 const profileResponse=await fetch(base+'/api/family/profile',{method:'PATCH',headers:{'Content-Type':'application/json',Cookie:registered.cookie},body:JSON.stringify({name:'Updated Local Family',phone:'9085550199'})});assert.equal(profileResponse.status,200);
 assert.equal((await request('/api/auth/me',null,registered.cookie)).json.user.name,'Updated Local Family');
 const anonymousProfile=await fetch(base+'/api/family/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(anonymousProfile.status,401);
 const crossOrigin=await fetch(base+'/api/family/profile',{method:'PATCH',headers:{'Content-Type':'application/json',Cookie:registered.cookie,Origin:'https://untrusted.example'},body:'{}'});assert.equal(crossOrigin.status,403);console.log('Profile editing and access checks: passed');
 const another={...family,email:emails[2],password:undefined,confirmPassword:undefined};assert.equal((await request('/api/find-nanny',another,registered.cookie)).status,200);
 const [owned]=await connection.execute('SELECT email FROM family_requests WHERE user_id=?',[me.json.user.id]);assert.equal(owned.length,2);assert.ok(owned.every(row=>row.email===emails[0]));console.log('Existing account request and protected ownership: passed');
 const other=await request('/api/auth/signup',{name:'Other Local Family',email:emails[2],password,role:'admin'});assert.equal(other.status,200);assert.equal(other.json.role,'family');
 const otherMe=await request('/api/auth/me',null,other.cookie);
 const privateMarker='OTHER-FAMILY-PRIVATE-'+suffix;
 await connection.execute('INSERT INTO family_requests (id,user_id,name,email,service_type,status,search_fee_status) VALUES (?,?,?,?,?,?,?)',[randomUUID(),otherMe.json.user.id,'Other Local Family',emails[0],privateMarker,'lead','unpaid']);
 await connection.execute('UPDATE family_requests SET status=? WHERE user_id=?',['searching',me.json.user.id]);
 const dashboard=await fetch(base+'/dashboard/family?view=requests',{headers:{Cookie:registered.cookie},signal:AbortSignal.timeout(120000)});assert.equal(dashboard.status,200);const html=await dashboard.text();assert.ok(html.includes('Updated Local Family') && html.includes('Recruiter searching'));assert.ok(!html.includes(privateMarker));
 const otherDashboard=await fetch(base+'/dashboard/family?view=requests',{headers:{Cookie:other.cookie},signal:AbortSignal.timeout(120000)});assert.ok((await otherDashboard.text()).includes(privateMarker));console.log('Dashboard status updates and cross-family isolation: passed');
 assert.equal((await request('/api/find-nanny',family)).status,409);console.log('Duplicate registration: passed');
 assert.equal((await request('/api/auth/login',{email:emails[0],password:'incorrect-password'})).status,401);
 const login=await request('/api/auth/login',{email:emails[0],password});assert.equal(login.status,200);assert.equal(login.json.role,'family');console.log('Login and incorrect password handling: passed');
 assert.equal((await request('/api/auth/logout',{},login.cookie)).status,200);
 const out=await request('/api/auth/me');assert.equal(out.json.user,null);console.log('Logout and anonymous session: passed');
 const exports={};vm.runInNewContext(ts.transpileModule(await fs.readFile('src/data/nanny-application.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
 const values={};for(const field of exports.APPLICATION_STEPS.flatMap(step=>step.fields)) if(field.required) values[field.name]=field.options?.[0]||(field.type==='date'?'2000-01-01':field.type==='number'?'3':field.type==='email'?emails[1]:'Local test');
 values.password=password;values.confirmPassword=password;values.speaksOtherLanguages='No';values.email=emails[1];
 const row=fields=>Object.fromEntries(fields.filter(field=>field.required).map(field=>[field.name,field.options?.[0]||(field.type==='email'?'reference@example.com':'Local test')]));
 const data=new FormData();data.set('application',JSON.stringify({values,references:[row(exports.REFERENCE_FIELDS),row(exports.REFERENCE_FIELDS)],workHistory:[row(exports.WORK_FIELDS)],languages:[]}));
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK1sAAAAASUVORK5CYII=','base64');
 data.set('photo',new File([png],'local-test.png',{type:'image/png'}));data.set('resume',new File(['%PDF-1.4\n%%EOF\n'],'local-test.pdf',{type:'application/pdf'}));
 const nanny=await request('/api/nanny-apply',data);assert.equal(nanny.status,200,JSON.stringify(nanny.json));const nannyMe=await request('/api/auth/me',null,nanny.cookie);assert.equal(nannyMe.json.user.role,'nanny');
 for(const kind of ['cpr','first_aid'])await connection.execute('INSERT INTO caregiver_credentials (id,user_id,kind,file_name,stored_name,status,expires_on) VALUES (?,?,?,?,?,?,?)',[randomUUID(),nannyMe.json.user.id,kind,'fixture.pdf',randomUUID()+'.pdf','verified','2099-12-31']);
 const [applications]=await connection.execute('SELECT bio FROM nanny_applications WHERE user_id=?',[nannyMe.json.user.id]);assert.equal(applications.length,1);const application=JSON.parse(applications[0].bio);assert.equal(application.attachments.length,2);assert.equal(application.values.password,undefined);
 for(const attachment of application.attachments) await fs.access(path.join('.data','nanny-uploads',attachment.storedName));console.log('Nanny account, application, private uploads and password exclusion: passed');
 const applicationIdResult=await connection.execute('SELECT id FROM nanny_applications WHERE user_id=?',[nannyMe.json.user.id]);const applicationId=applicationIdResult[0][0].id;
 const documentPath=`/api/nanny/applications/${applicationId}/documents/photo`;
 const document=await fetch(base+documentPath,{headers:{Cookie:nanny.cookie},signal:AbortSignal.timeout(120000)});assert.equal(document.status,200);assert.equal(document.headers.get('content-type'),'image/png');assert.equal(document.headers.get('cache-control'),'private, no-store');assert.equal(Buffer.from(await document.arrayBuffer()).length,png.length);
 assert.equal((await fetch(base+documentPath)).status,401);
 assert.equal((await fetch(base+documentPath,{headers:{Cookie:registered.cookie}})).status,403);
 assert.equal((await fetch(base+`/api/nanny/applications/${randomUUID()}/documents/photo`,{headers:{Cookie:nanny.cookie}})).status,404);console.log('Private document access and missing-document checks: passed');
 const nannyProfile=await fetch(base+'/api/nanny/profile',{method:'PATCH',headers:{'Content-Type':'application/json',Cookie:nanny.cookie},body:JSON.stringify({name:'Updated Nanny Profile',phone:'9085550198'})});assert.equal(nannyProfile.status,200);
 assert.equal((await request('/api/auth/me',null,nanny.cookie)).json.user.name,'Updated Nanny Profile');
 const updatedValues={...values,whyWorkHere:'Updated childcare motivation',email:emails[2],password:'must-not-be-saved'};
 const updated={values:updatedValues,references:[row(exports.REFERENCE_FIELDS),row(exports.REFERENCE_FIELDS)],workHistory:[row(exports.WORK_FIELDS)],languages:[],status:'active',attachments:[]};
 const edit=await fetch(base+`/api/nanny/applications/${applicationId}`,{method:'PATCH',headers:{'Content-Type':'application/json',Cookie:nanny.cookie},body:JSON.stringify(updated),signal:AbortSignal.timeout(120000)});assert.equal(edit.status,200,await edit.text());
 const [changed]=await connection.execute('SELECT bio,status,email FROM nanny_applications WHERE id=?',[applicationId]);const changedData=JSON.parse(changed[0].bio);assert.equal(changedData.values.whyWorkHere,'Updated childcare motivation');assert.equal(changedData.values.email,emails[1]);assert.equal(changedData.values.password,undefined);assert.equal(changedData.attachments.length,2);assert.equal(changed[0].status,'submitted');console.log('Application corrections, retained documents and protected fields: passed');
 await connection.execute('UPDATE nanny_applications SET status=? WHERE id=?',['screening',applicationId]);
 const locked=await fetch(base+`/api/nanny/applications/${applicationId}`,{method:'PATCH',headers:{'Content-Type':'application/json',Cookie:nanny.cookie},body:JSON.stringify(updated)});assert.equal(locked.status,409);
 assert.equal((await fetch(base+`/api/nanny/applications/${randomUUID()}`,{method:'PATCH',headers:{'Content-Type':'application/json',Cookie:nanny.cookie},body:JSON.stringify(updated)})).status,404);
 const nannyDashboard=await fetch(base+'/dashboard/nanny?view=application',{headers:{Cookie:nanny.cookie},signal:AbortSignal.timeout(120000)});assert.equal(nannyDashboard.status,200);const nannyHtml=await nannyDashboard.text();assert.ok(nannyHtml.includes('Screening in progress')&&nannyHtml.includes('Updated childcare motivation')&&nannyHtml.includes(documentPath));console.log('Nanny dashboard and review-stage edit protection: passed');
 const otherNanny=await request('/api/auth/signup',{name:'Other Nanny',email:`other-nanny-${suffix}@example.com`,password,role:'nanny'});assert.equal(otherNanny.status,200);
 const otherNannyMe=await request('/api/auth/me',null,otherNanny.cookie);
 try {
  assert.equal((await fetch(base+documentPath,{headers:{Cookie:otherNanny.cookie}})).status,404);
  assert.equal((await fetch(base+`/api/nanny/applications/${applicationId}`,{method:'PATCH',headers:{'Content-Type':'application/json',Cookie:otherNanny.cookie},body:JSON.stringify(updated)})).status,404);
  const otherHtml=await (await fetch(base+'/dashboard/nanny?view=application',{headers:{Cookie:otherNanny.cookie},signal:AbortSignal.timeout(120000)})).text();assert.ok(!otherHtml.includes('Updated childcare motivation'));console.log('Cross-nanny dashboard, document and editing isolation: passed');
  const newApplication=new FormData();newApplication.set('application',JSON.stringify({values:{...values,password:undefined,confirmPassword:undefined},references:[row(exports.REFERENCE_FIELDS),row(exports.REFERENCE_FIELDS)],workHistory:[row(exports.WORK_FIELDS)],languages:[]}));newApplication.set('photo',new File([png],'existing-account.png',{type:'image/png'}));newApplication.set('resume',new File(['%PDF-1.4\n%%EOF\n'],'existing-account.pdf',{type:'application/pdf'}));
  const existingAccountSubmission=await request('/api/nanny-apply',newApplication,otherNanny.cookie);assert.equal(existingAccountSubmission.status,200,JSON.stringify(existingAccountSubmission.json));const [newApps]=await connection.execute('SELECT email FROM nanny_applications WHERE user_id=?',[otherNannyMe.json.user.id]);assert.equal(newApps.length,1);assert.equal(newApps[0].email,`other-nanny-${suffix}@example.com`);console.log('Application submission from an existing nanny account: passed');
  adminId=randomUUID();const adminEmail=`admin-test-${suffix}@example.com`,salt=randomBytes(16).toString('hex');await connection.execute('INSERT INTO users (id,role,name,email,password_hash) VALUES (?,?,?,?,?)',[adminId,'admin','Temporary Admin',adminEmail,`${salt}:${scryptSync(password,salt,64).toString('hex')}`]);
  await connection.execute("INSERT INTO admin_access(user_id,super_admin,status,role_label,permissions) VALUES(?,1,'active','Super Admin','[]')",[adminId]);const adminLogin=await request('/api/auth/login',{email:adminEmail,password});assert.equal(adminLogin.status,200);assert.equal(adminLogin.json.role,'admin');
  async function membership(body,cookie=adminLogin.cookie){return request('/api/admin/memberships',body,cookie);}
  const start='2026-12-01';
  assert.equal((await membership({action:'create',userId:me.json.user.id,plan:'Basic',startDate:start},registered.cookie)).status,403);
  assert.equal((await membership({action:'create',userId:me.json.user.id,plan:'Basic',startDate:'2026-02-30'})).status,400);
  const cycle=await membership({action:'create',userId:me.json.user.id,plan:'Basic',startDate:start});assert.equal(cycle.status,200,JSON.stringify(cycle.json));
  const cycleId=cycle.json.id,reference='receipt-'+suffix;
  assert.equal((await membership({action:'create',userId:me.json.user.id,plan:'Premium',startDate:'2026-12-15'})).status,409);
  assert.equal((await membership({action:'payment',cycleId,revision:0,amountCents:6000,reference,method:'cash',paidDate:'2026-10-01'})).status,409);
  assert.equal((await membership({action:'payment',cycleId,revision:0,amountCents:3000,reference,method:'cash',paidDate:'2026-10-01'})).status,200);
  assert.equal((await membership({action:'payment',cycleId,revision:0,amountCents:2900,reference:'balance-'+suffix,method:'cash',paidDate:'2026-10-01'})).status,409);
  assert.equal((await membership({action:'payment',cycleId,revision:1,amountCents:2900,reference,method:'cash',paidDate:'2026-10-01'})).status,409);
  const unpaidHtml=await(await fetch(base+'/dashboard/family?view=membership',{headers:{Cookie:registered.cookie}})).text();assert.ok(unpaidHtml.includes('Payment due')&&unpaidHtml.includes(reference));
  assert.ok(!(await(await fetch(base+'/dashboard/family?view=membership',{headers:{Cookie:other.cookie}})).text()).includes(reference));
  assert.equal((await membership({action:'payment',cycleId,revision:1,amountCents:2900,reference:'balance-'+suffix,method:'bank_transfer',paidDate:'2026-10-01'})).status,200);
  assert.equal((await membership({action:'cancel',cycleId,revision:2})).status,409);
  const [receipts]=await connection.execute('SELECT id FROM membership_payments WHERE cycle_id=?',[cycleId]);
  assert.equal((await membership({action:'void',cycleId,revision:2,paymentId:receipts[0].id,reason:'INTERNAL-CORRECTION-'+suffix})).status,200);
  const correctedHtml=await(await fetch(base+'/dashboard/family?view=membership',{headers:{Cookie:registered.cookie}})).text();assert.ok(correctedHtml.includes('Voided')&&!correctedHtml.includes('INTERNAL-CORRECTION-'+suffix));
  assert.equal((await membership({action:'void',cycleId,revision:3,paymentId:receipts[1].id,reason:'Test correction'})).status,200);
  assert.equal((await membership({action:'cancel',cycleId,revision:4})).status,200);
  assert.equal((await membership({action:'payment',cycleId,revision:5,amountCents:5900,reference:'cancelled-'+suffix,method:'cash',paidDate:'2026-10-01'})).status,409);
  const anonymousMembership=await fetch(base+'/api/admin/memberships',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(anonymousMembership.status,401);
  assert.equal((await fetch(base+'/api/admin/memberships',{method:'POST',headers:{'Content-Type':'application/json',Cookie:adminLogin.cookie,Origin:'https://untrusted.example'},body:'{}'})).status,403);
  const monthEnd=await membership({action:'create',userId:me.json.user.id,plan:'Premium',startDate:'2027-01-31'});assert.equal(monthEnd.status,200);
  const [[clamped]]=await connection.execute('SELECT end_date FROM membership_cycles WHERE id=?',[monthEnd.json.id]);assert.equal(clamped.end_date,'2027-02-28');
  const reminderCycle=await membership({action:'create',userId:me.json.user.id,plan:'Basic',startDate:'2026-01-01'});assert.equal(reminderCycle.status,200);
  const today=new Date().toISOString().slice(0,10),soon=new Date(Date.now()+3*86400000).toISOString().slice(0,10);
  await connection.execute('UPDATE membership_cycles SET start_date=?,end_date=? WHERE id=?',[today,soon,reminderCycle.json.id]);
  assert.equal((await membership({action:'payment',cycleId:reminderCycle.json.id,revision:0,amountCents:5900,reference:'reminder-'+suffix,method:'cash',paidDate:today})).status,200);
  const activeHtml=await(await fetch(base+'/dashboard/family?view=membership',{headers:{Cookie:registered.cookie}})).text();assert.ok(activeHtml.includes('Active'));
  const run=promisify(execFile);await run(process.execPath,['scripts/membership-reminders.mjs']);await run(process.execPath,['scripts/membership-reminders.mjs']);
  const [[reminderCount]]=await connection.execute('SELECT COUNT(*) AS count FROM mail_jobs WHERE user_id=? AND subject=?',[me.json.user.id,'Your family membership renewal']);assert.equal(reminderCount.count,1);
  await run(process.execPath,['scripts/process-mail.mjs']);
  const [paymentMails]=await connection.execute('SELECT id,status FROM mail_jobs WHERE user_id=? AND subject=?',[me.json.user.id,'Membership payment recorded']);assert.ok(paymentMails.length);assert.ok(paymentMails.every(m=>m.status==='preview'));
  const paymentPreview=JSON.parse(await fs.readFile(path.join('.data','mail-preview',paymentMails[0].id+'.json'),'utf8'));assert.ok(paymentPreview.text.includes('Remaining balance')&&!paymentPreview.text.includes('INTERNAL-CORRECTION'));
  console.log('Membership activation, month-end dates, renewal reminder deduplication and queued email delivery: passed');
  console.log('Membership pricing, permissions, date overlap, partial payments, duplicate references, stale saves, ownership, corrections and cancellation: passed');
  const reviewRoute=`/api/admin/reviews/family/${requests[0].id}`,note=`INTERNAL-ADMIN-NOTE-${suffix}`;
  async function review(route,cookie,body){return fetch(base+route,{method:'PATCH',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});}
  assert.equal((await review(reviewRoute,null,{status:'shortlist',note,expectedStatus:'searching'})).status,401);
  assert.equal((await review(reviewRoute,registered.cookie,{status:'shortlist',note,expectedStatus:'searching'})).status,403);
  assert.equal((await review(reviewRoute,nanny.cookie,{status:'shortlist',note,expectedStatus:'searching'})).status,403);
  assert.equal((await review(reviewRoute,adminLogin.cookie,{status:'invalid',note,expectedStatus:'searching'})).status,400);
  assert.equal((await review(reviewRoute,adminLogin.cookie,{status:'shortlist',note,expectedStatus:'searching',searchFeeStatus:'paid'})).status,200);
  assert.equal((await review(reviewRoute,adminLogin.cookie,{status:'placed',note:'stale',expectedStatus:'searching'})).status,409);
  const [reviewed]=await connection.execute('SELECT status,search_fee_status FROM family_requests WHERE id=?',[requests[0].id]);assert.equal(reviewed[0].status,'shortlist');assert.equal(reviewed[0].search_fee_status,'unpaid');
  const [history]=await connection.execute('SELECT reviewer_id,note,from_status,to_status FROM review_events WHERE family_request_id=?',[requests[0].id]);assert.equal(history.length,1);assert.equal(history[0].reviewer_id,adminId);assert.equal(history[0].note,note);assert.equal(history[0].from_status,'searching');assert.equal(history[0].to_status,'shortlist');
  const familyView=await (await fetch(base+'/dashboard/family?view=requests',{headers:{Cookie:registered.cookie}})).text();assert.ok(familyView.includes('Shortlist ready'));assert.ok(!familyView.includes(note));
  const [statusMails]=await connection.execute('SELECT id FROM mail_jobs WHERE user_id=? AND subject=?',[me.json.user.id,'An update on your submission']);assert.ok(statusMails.length);const statusPreview=JSON.parse(await fs.readFile(path.join('.data','mail-preview',statusMails[0].id+'.json'),'utf8'));assert.ok(statusPreview.text.includes('Shortlist ready'));assert.ok(!statusPreview.text.includes(note));console.log('Status-update email excludes internal notes: passed');
  const adminView=await (await fetch(base+`/dashboard/admin/family/${requests[0].id}`,{headers:{Cookie:adminLogin.cookie},signal:AbortSignal.timeout(120000)})).text();assert.ok(adminView.includes(note));
  const filtered=await (await fetch(base+`/dashboard/admin?kind=family&q=${encodeURIComponent(emails[0])}&status=shortlist`,{headers:{Cookie:adminLogin.cookie},signal:AbortSignal.timeout(120000)})).text();assert.ok(filtered.includes(emails[0]));assert.ok(!filtered.includes(privateMarker));
  const nannyReview=await review(`/api/admin/reviews/nanny/${applicationId}`,adminLogin.cookie,{status:'interview',note,expectedStatus:'screening'});assert.equal(nannyReview.status,200);
  const updatedNannyView=await (await fetch(base+'/dashboard/nanny?view=application',{headers:{Cookie:nanny.cookie}})).text();assert.ok(updatedNannyView.includes('Recruiter interview'));assert.ok(!updatedNannyView.includes(note));
  assert.equal((await fetch(base+documentPath,{headers:{Cookie:adminLogin.cookie}})).status,200);
  const anonymousAdmin=await fetch(base+'/dashboard/admin');assert.equal(new URL(anonymousAdmin.url).pathname,'/login');

  async function saveMatch(body,update=false,cookie=adminLogin.cookie){return fetch(base+'/api/admin/matches',{method:update?'PATCH':'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});}
  assert.equal((await review(`/api/admin/reviews/family/${requests[0].id}`,adminLogin.cookie,{status:'placed',note:'Must use matching',expectedStatus:'shortlist'})).status,422);
  const shared='MATCH-SHARED-'+suffix,matchBody={requestId:requests[0].id,applicationId,sharedNote:shared};
  assert.equal((await saveMatch(matchBody,false,registered.cookie)).status,403);assert.equal((await saveMatch(matchBody,false,nanny.cookie)).status,403);assert.equal((await saveMatch(matchBody,false,'')).status,401);assert.equal((await saveMatch(matchBody)).status,409);
  assert.equal((await review(`/api/admin/reviews/nanny/${applicationId}`,adminLogin.cookie,{status:'active',note:'Approved for matching',expectedStatus:'interview'})).status,200);
  const [details]=await connection.execute('SELECT bio FROM nanny_applications WHERE id=?',[applicationId]);const secretData=JSON.parse(details[0].bio);secretData.values.mentalHealthIssues='PRIVATE-HEALTH-'+suffix;await connection.execute('UPDATE nanny_applications SET bio=? WHERE id=?',[JSON.stringify(secretData),applicationId]);
  const firstMatchResponse=await saveMatch(matchBody);assert.equal(firstMatchResponse.status,200,await firstMatchResponse.clone().text());const firstMatch=(await firstMatchResponse.json()).id;assert.ok(firstMatch);assert.equal((await saveMatch(matchBody)).status,409);
  const familyMatches=await (await fetch(base+'/dashboard/family?view=matches',{headers:{Cookie:registered.cookie}})).text();assert.ok(familyMatches.includes(shared));assert.ok(!familyMatches.includes('PRIVATE-HEALTH-'+suffix));assert.ok(!familyMatches.includes(documentPath));
  const outsider=await (await fetch(base+'/dashboard/family?view=matches',{headers:{Cookie:other.cookie}})).text();assert.ok(!outsider.includes(shared));
  const opportunity=await (await fetch(base+'/dashboard/nanny?view=matches',{headers:{Cookie:nanny.cookie}})).text();assert.ok(opportunity.includes(shared));console.log('Approved-only matching, duplicate protection and shortlist privacy: passed');
  const [secondApps]=await connection.execute('SELECT id FROM nanny_applications WHERE user_id=?',[otherNannyMe.json.user.id]);const secondApplication=secondApps[0].id;
  assert.equal((await review(`/api/admin/reviews/nanny/${secondApplication}`,adminLogin.cookie,{status:'active',note:'Approved candidate',expectedStatus:'submitted'})).status,200);
  const alternative=await saveMatch({...matchBody,applicationId:secondApplication});assert.equal(alternative.status,200);const alternativeId=(await alternative.json()).id;
  assert.equal((await saveMatch({id:firstMatch,revision:0,status:'interview',sharedNote:shared},true)).status,400);
  assert.equal((await saveMatch({id:firstMatch,revision:0,status:'interview',interviewAt:'2026-12-01T10:00:00+01:00',sharedNote:shared},true)).status,200);
  assert.equal((await saveMatch({id:firstMatch,revision:0,status:'closed',sharedNote:shared},true)).status,409);
  assert.equal((await saveMatch({id:firstMatch,revision:1,status:'placed',placementStart:'2026-12-15',sharedNote:shared},true)).status,200);
  assert.equal((await review(`/api/admin/reviews/family/${requests[0].id}`,adminLogin.cookie,{status:'searching',note:'Cannot bypass placement closure',expectedStatus:'placed'})).status,422);
  const [placedFamily]=await connection.execute('SELECT status FROM family_requests WHERE id=?',[requests[0].id]);const [placedNanny]=await connection.execute('SELECT status FROM nanny_applications WHERE id=?',[applicationId]);const [closedAlternative]=await connection.execute('SELECT status FROM nanny_matches WHERE id=?',[alternativeId]);assert.equal(placedFamily[0].status,'placed');assert.equal(placedNanny[0].status,'placed');assert.equal(closedAlternative[0].status,'closed');
  const [otherRequests]=await connection.execute('SELECT id FROM family_requests WHERE user_id=? AND id<>?',[me.json.user.id,requests[0].id]);await connection.execute('UPDATE nanny_applications SET status=? WHERE id=?',['active',applicationId]);assert.equal((await saveMatch({...matchBody,requestId:otherRequests[0].id})).status,409);await connection.execute('UPDATE nanny_applications SET status=? WHERE id=?',['placed',applicationId]);
  const placedView=await (await fetch(base+'/dashboard/family?view=matches',{headers:{Cookie:registered.cookie}})).text();assert.ok(placedView.includes('Placement confirmed')&&placedView.includes('2026-12-15'));
  assert.equal((await saveMatch({id:firstMatch,revision:2,status:'closed',sharedNote:'Placement closed'},true)).status,200);const [released]=await connection.execute('SELECT status FROM nanny_applications WHERE id=?',[applicationId]);assert.equal(released[0].status,'active');
  assert.equal((await saveMatch({id:firstMatch,revision:3,status:'shortlisted',sharedNote:shared},true)).status,200);const [reopened]=await connection.execute('SELECT interview_at,placement_start FROM nanny_matches WHERE id=?',[firstMatch]);assert.equal(reopened[0].interview_at,null);assert.equal(reopened[0].placement_start,null);
  const [matchingMails]=await connection.execute('SELECT id FROM mail_jobs WHERE user_id=? AND subject=?',[me.json.user.id,'An update on your nanny match']);assert.ok(matchingMails.length);const matchingPreview=JSON.parse(await fs.readFile(path.join('.data','mail-preview',matchingMails[0].id+'.json'),'utf8'));assert.ok(!matchingPreview.text.includes('PRIVATE-HEALTH-'+suffix));console.log('Interview scheduling, stale updates, placement synchronization, duplicate placement protection, closure, reopening and notifications: passed');
  await connection.execute('UPDATE users SET role=? WHERE id=?',['family',adminId]);assert.equal((await review(reviewRoute,adminLogin.cookie,{status:'placed',note,expectedStatus:'shortlist'})).status,403);console.log('Admin authorization, review audit, filters, stale saves, private notes, documents and role revocation: passed');


 } finally {
  await connection.execute('DELETE FROM nanny_matches WHERE nanny_application_id IN (SELECT id FROM nanny_applications WHERE user_id=?)',[otherNannyMe.json.user.id]);await connection.execute('DELETE FROM review_events WHERE nanny_application_id IN (SELECT id FROM nanny_applications WHERE user_id=?)',[otherNannyMe.json.user.id]);
  const [otherApps]=await connection.execute('SELECT bio FROM nanny_applications WHERE user_id=?',[otherNannyMe.json.user.id]);
  for(const app of otherApps) for(const attachment of JSON.parse(app.bio).attachments||[]) if(/^[a-f0-9-]{36}\.(png|pdf)$/.test(attachment.storedName)) await fs.unlink(path.join('.data','nanny-uploads',attachment.storedName)).catch(()=>{});
  const [otherMails]=await connection.execute('SELECT id FROM mail_jobs WHERE user_id=?',[otherNannyMe.json.user.id]);for(const mail of otherMails)await fs.unlink(path.join('.data','mail-preview',mail.id+'.json')).catch(()=>{});
  await connection.execute('DELETE FROM nanny_applications WHERE user_id=?',[otherNannyMe.json.user.id]);await connection.execute('DELETE FROM admin_access WHERE user_id=?',[otherNannyMe.json.user.id]);await connection.execute('DELETE FROM users WHERE id=?',[otherNannyMe.json.user.id]);
 }

 console.log('All end-to-end local connection checks passed.');
} finally {
 if(adminId){await connection.execute('DELETE r FROM membership_reminders r JOIN membership_cycles c ON c.id=r.cycle_id WHERE c.created_by=?',[adminId]);await connection.execute('DELETE p FROM membership_payments p JOIN membership_cycles c ON c.id=p.cycle_id WHERE c.created_by=?',[adminId]);await connection.execute('DELETE FROM membership_cycles WHERE created_by=?',[adminId]);await connection.execute('DELETE FROM nanny_matches WHERE created_by=?',[adminId]);await connection.execute('DELETE FROM review_events WHERE reviewer_id=?',[adminId]);await connection.execute('DELETE FROM admin_access WHERE user_id=?',[adminId]);await connection.execute('DELETE FROM users WHERE id=?',[adminId]);}
 const [users]=await connection.execute('SELECT id FROM users WHERE email IN (?,?,?)',emails);
 for(const user of users) {
  const [mails]=await connection.execute('SELECT id FROM mail_jobs WHERE user_id=?',[user.id]);for(const mail of mails)await fs.unlink(path.join('.data','mail-preview',mail.id+'.json')).catch(()=>{});
  const [applications]=await connection.execute('SELECT bio FROM nanny_applications WHERE user_id=?',[user.id]);
  for(const application of applications) for(const attachment of JSON.parse(application.bio).attachments||[]) if(/^[a-f0-9-]{36}\.(png|pdf)$/.test(attachment.storedName)) await fs.unlink(path.join('.data','nanny-uploads',attachment.storedName)).catch(()=>{});
  await connection.execute('DELETE FROM family_requests WHERE user_id=?',[user.id]);await connection.execute('DELETE FROM nanny_applications WHERE user_id=?',[user.id]);await connection.execute('DELETE FROM caregiver_credentials WHERE user_id=?',[user.id]);await connection.execute('DELETE FROM admin_access WHERE user_id=?',[user.id]);await connection.execute('DELETE FROM users WHERE id=?',[user.id]);
 }
 await connection.end();console.log('Temporary test accounts and uploads cleaned up.');
}
