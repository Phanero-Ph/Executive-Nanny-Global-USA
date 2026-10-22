import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
import mysql from 'mysql2/promise';
import Stripe from 'stripe';
const url=new URL(process.env.DATABASE_URL||'mysql://invalid');assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/executive_nanny');assert.equal(process.env.EMAIL_MODE,'preview');
// SDK and database integration fixtures run only in this process. They never replace app credentials or contact Stripe.
const require=createRequire(import.meta.url),cache=new Map(),suffix=randomUUID(),userId=randomUUID(),otherId=randomUUID(),eventIds=[];
process.env.STRIPE_WEBHOOK_SECRET='whsec_fixture_'+suffix;process.env.STRIPE_SECRET_KEY='sk_test_fixture';process.env.STRIPE_PORTAL_CONFIGURATION='bpc_fixture';
for(const name of ['BASIC','STANDARD','DELUXE','PREMIUM'])process.env['STRIPE_PRICE_'+name]='price_fixture_'+name;
const sdk=new Stripe('sk_test_fixture');let actor=null,failRetrieve=false,createCalls=0,customerCounter=0,portalCustomer;
const customers=new Map(),sessions=new Map(),subscriptions=new Map(),invoices=new Map(),charges=new Map(),intents=new Map();
const now=Math.floor(Date.now()/1000);
const mock={webhooks:sdk.webhooks,
 prices:{retrieve:async id=>({id,active:true,currency:'usd',unit_amount:id.endsWith('PREMIUM')?20000:id.endsWith('STANDARD')?8900:id.endsWith('DELUXE')?12900:5900,recurring:{interval:'month',interval_count:1,usage_type:'licensed'}})},
 customers:{create:async(data,options)=>{if(!customers.has(options.idempotencyKey))customers.set(options.idempotencyKey,{id:'cus_fixture_'+suffix+'_'+(++customerCounter),...data});return customers.get(options.idempotencyKey);}},
 subscriptions:{list:async({customer})=>({data:[...subscriptions.values()].filter(s=>s.customer===customer),has_more:false}),retrieve:async id=>{if(failRetrieve)throw Error('Fixture temporary outage');assert.ok(subscriptions.has(id));return subscriptions.get(id);}},
 checkout:{sessions:{create:async(data,options)=>{createCalls++;let existing=[...sessions.values()].find(s=>s.key===options.idempotencyKey);if(existing)return existing;const session={...data,id:'cs_fixture_'+randomUUID(),customer:data.customer,client_reference_id:data.client_reference_id,metadata:data.metadata,status:'open',url:'https://checkout.stripe.com/fixture',key:options.idempotencyKey,subscription:null};sessions.set(session.id,session);return session;},retrieve:async id=>sessions.get(id),list:async({customer})=>({data:[...sessions.values()].filter(s=>s.customer===customer),has_more:false}),expire:async id=>{sessions.get(id).status='expired';return sessions.get(id);}}},
 paymentIntents:{retrieve:async id=>{assert.ok(intents.has(id));return intents.get(id);}},
 billingPortal:{sessions:{create:async data=>{portalCustomer=data.customer;return{url:'https://billing.stripe.com/fixture'};}}},
 invoices:{retrieve:async id=>invoices.get(id),list:async({subscription})=>({data:[...invoices.values()].filter(i=>i.parent.subscription_details.subscription===subscription),has_more:false})},
 invoicePayments:{list:async args=>({data:[...invoices.values()].filter(i=>args.invoice?i.id===args.invoice:i.intent===args.payment.payment_intent).map(i=>({invoice:i.id,payment:{payment_intent:i.intent}})),has_more:false})},
 charges:{retrieve:async id=>charges.get(id),list:async({payment_intent})=>({data:[...charges.values()].filter(c=>c.payment_intent===payment_intent),has_more:false})}
};
function load(filename){filename=path.resolve(filename);if(cache.has(filename))return cache.get(filename);const exports={};cache.set(filename,exports);const source=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const runtimeModule={exports};function localRequire(name){if(name==='@/lib/mail'||(name==='./mail'))return{appUrl:p=>new URL(p,'http://localhost:3000').toString(),notifySubmission:async()=>{},queueEmail:async()=>{}};if(name==='@/lib/auth')return{getCurrentUser:async()=>actor};if(name==='@/lib/stripe'||(name==='./stripe'&&filename.endsWith('stripe-events.ts')))return{...load('src/lib/stripe.ts'),getStripe:()=>mock};if(name.startsWith('@/')){const base=path.resolve('src',name.slice(2));return load(fs.existsSync(base+'.ts')?base+'.ts':path.join(base,'index.ts'));}if(name.startsWith('.')){const base=path.resolve(path.dirname(filename),name);if(fs.existsSync(base+'.ts'))return load(base+'.ts');}return require(name);}
 vm.runInNewContext(source,{exports,module:runtimeModule,require:localRequire,process,console,Date,URL,Request,Response,Buffer,globalThis:{}},{filename});cache.set(filename,runtimeModule.exports);return runtimeModule.exports;}
const connection=await mysql.createConnection({uri:process.env.DATABASE_URL,timezone:'Z'});let pool;const originalFees=(await connection.execute("SELECT * FROM agency_fee_settings WHERE id=1"))[0][0];
async function rows(query,args=[]){return (await connection.execute(query,args))[0];}
const req=(body,headers={})=>new Request('http://localhost:3000/api/billing/checkout',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
try{
 await connection.execute('INSERT INTO users (id,name,email,role,password_hash) VALUES (?,?,?,?,?),(?,?,?,?,?)',[userId,'Stripe fixture','stripe-'+suffix+'@example.com','family','fixture-no-login',otherId,'Other fixture','stripe-other-'+suffix+'@example.com','family','fixture-no-login']);
 await connection.execute("INSERT INTO admin_access(user_id,super_admin,status,role_label,permissions) VALUES(?,1,'active','Super Admin','[]')",[userId]);
 const dbModule=load('src/db/index.ts');pool=dbModule.pool;
 const feeMath=load('src/lib/fee-format.ts');assert.equal(feeMath.annualPlacementFee(6000000,1500),900000);assert.equal(feeMath.annualPlacementFee(101,1500),15);assert.equal(feeMath.annualPlacementFee(110,1500),17);assert.equal(feeMath.parseAnnualSalary('60000.01'),6000001);assert.equal(feeMath.feePercent(1500),'15%');
 const familyMembership=load('src/lib/family-membership.ts');assert.equal(await familyMembership.hasPaidFamilyMembership(userId),false,'Show notice for families without a paid plan');
 const checkout=load('src/app/api/billing/checkout/route.ts'),portal=load('src/app/api/billing/portal/route.ts'),cancel=load('src/app/api/billing/checkout/cancel/route.ts'),webhook=load('src/app/api/billing/webhook/route.ts'),admin=load('src/app/api/admin/memberships/route.ts');
 assert.equal((await checkout.POST(req({plan:'Basic'}))).status,401);actor={id:userId,name:'Stripe fixture',email:'stripe-'+suffix+'@example.com',role:'nanny',emailVerifiedAt:new Date()};assert.equal((await checkout.POST(req({plan:'Basic'}))).status,403);actor.role='family';assert.equal((await checkout.POST(req({plan:'Basic'},{Origin:'https://evil.example'}))).status,403);
 const first=await checkout.POST(req({plan:'Basic'}));assert.equal(first.status,200,await first.clone().text());assert.equal((await checkout.POST(req({plan:'Basic'}))).status,200);assert.equal(sessions.size,1);assert.equal(createCalls,1);assert.equal((await checkout.POST(req({plan:'Premium'}))).status,409);
 let [initialBilling]=await rows('SELECT * FROM stripe_billing WHERE user_id=?',[userId]);const abandonedSession=sessions.get(initialBilling.checkout_session_id);assert.ok(abandonedSession.expires_at<=Math.floor(Date.now()/1000)+30*60&&abandonedSession.expires_at>Math.floor(Date.now()/1000)+29*60,'Checkout sessions expire after 30 minutes');
 assert.equal((await cancel.POST(req({}))).status,200);assert.equal(abandonedSession.status,'expired','Cancel endpoint closes the Stripe session');assert.equal((await rows('SELECT checkout_key FROM stripe_billing WHERE user_id=?',[userId]))[0].checkout_key,null,'Cancel endpoint clears pending state');assert.equal((await checkout.POST(req({plan:'Basic'}))).status,200);assert.equal(sessions.size,2);
 let [billing]=await rows('SELECT * FROM stripe_billing WHERE user_id=?',[userId]);let session=sessions.get(billing.checkout_session_id);const customer=billing.customer_id,subId='sub_fixture_'+suffix,price=await mock.prices.retrieve('price_fixture_BASIC');
 const sub={id:subId,customer,status:'active',metadata:{egnUserId:userId},cancel_at_period_end:false,items:{data:[{price,quantity:1,current_period_start:now,current_period_end:now+30*86400}]}};
 const invoiceId='in_fixture_'+suffix,intent='pi_fixture_'+suffix,chargeId='ch_fixture_'+suffix;
 const invoice={id:invoiceId,customer,currency:'usd',status:'paid',amount_paid:5900,total:5900,billing_reason:'subscription_create',parent:{subscription_details:{subscription:subId}},status_transitions:{paid_at:now},lines:{has_more:false,data:[{quantity:1,pricing:{price_details:{price:price.id}},parent:{subscription_item_details:{proration:false}},period:{start:now,end:now+30*86400}}]},intent};invoices.set(invoiceId,invoice);charges.set(chargeId,{id:chargeId,customer,payment_intent:intent,amount_refunded:0});
 async function send(type,object,{id='evt_fixture_'+randomUUID(),signature=true,mode=false}={}){eventIds.push(id);const event={id,object:'event',type,livemode:mode,created:now,data:{object}};const payload=JSON.stringify(event),header=sdk.webhooks.generateTestHeaderString({payload,secret:process.env.STRIPE_WEBHOOK_SECRET});return webhook.POST(new Request('http://localhost:3000/api/billing/webhook',{method:'POST',headers:signature?{'stripe-signature':header}:{'stripe-signature':'invalid'},body:payload}));}
 session.status='expired';assert.equal((await send('checkout.session.expired',session)).status,200,'Stripe expiry webhook is accepted');assert.equal((await rows('SELECT checkout_key,checkout_session_id FROM stripe_billing WHERE user_id=?',[userId]))[0].checkout_key,null,'Expiry webhook clears pending checkout');
 assert.equal((await checkout.POST(req({plan:'Basic'}))).status,200,'Family can immediately retry after checkout expires');[billing]=await rows('SELECT * FROM stripe_billing WHERE user_id=?',[userId]);session=sessions.get(billing.checkout_session_id);assert.ok(session.expires_at>Math.floor(Date.now()/1000),'Retry creates a fresh expiring session');subscriptions.set(subId,sub);session.status='complete';session.subscription=subId;
 assert.equal((await send('invoice.paid',invoice,{signature:false})).status,400);assert.equal((await send('invoice.paid',invoice,{mode:true})).status,500);assert.equal((await rows('SELECT id FROM membership_cycles WHERE user_id=?',[userId])).length,0);
 assert.equal((await send('checkout.session.completed',session)).status,200);assert.equal((await rows('SELECT id FROM membership_cycles WHERE user_id=?',[userId])).length,0,'Checkout must not grant access without paid invoice');
 const recovery=load('src/lib/stripe-recovery.ts');
 const missedId='evt_fixture_'+randomUUID();eventIds.push(missedId);
 const missedEvent={id:missedId,object:'event',type:'invoice.paid',livemode:false,created:now,data:{object:invoice}};
 let recoveryRequests=0;
 mock.events={list:args=>{assert.ok(args.types.includes('invoice.paid'));assert.equal(args.limit,100);assert.equal(args.created.gte,now-30*86400);recoveryRequests++;return (async function*(){yield {...missedEvent,id:'evt_unrelated_'+suffix,data:{object:{customer:'cus_unrelated_'+suffix}}};yield missedEvent;})();}};
 failRetrieve=true;const failedRecovery=await recovery.recoverStripeEvents(mock,new Date(now*1000));assert.equal(failedRecovery.failed,1);assert.equal((await rows('SELECT id FROM stripe_events WHERE id=?',[missedId])).length,0);assert.equal((await rows('SELECT id FROM membership_cycles WHERE user_id=?',[userId])).length,0);
 failRetrieve=false;const recovered=await recovery.recoverStripeEvents(mock,new Date(now*1000));assert.equal(recovered.recovered,1);assert.equal(recovered.skipped,1);assert.equal(recovered.failed,0);
 const rerun=await recovery.recoverStripeEvents(mock,new Date(now*1000));assert.equal(rerun.recovered,0);assert.equal(rerun.skipped,2);assert.equal(recoveryRequests,3);
 assert.equal(await familyMembership.hasPaidFamilyMembership(userId),true,'Hide notice once a paid membership is active');
 const eventId='evt_fixture_'+randomUUID();const duplicateResults=await Promise.all([send('invoice.paid',invoice,{id:eventId}),send('invoice.paid',invoice,{id:eventId})]);assert.ok(duplicateResults.every(r=>r.status===200));assert.equal((await send('invoice.paid',invoice)).status,200);
 const [cycle]=await rows('SELECT * FROM membership_cycles WHERE user_id=?',[userId]);assert.equal(cycle.source,'stripe');assert.equal(cycle.amount_cents,5900);assert.equal((await rows('SELECT id FROM membership_payments WHERE cycle_id=?',[cycle.id])).length,1);assert.equal((await rows('SELECT id FROM mail_jobs WHERE user_id=?',[userId])).length,1);
 assert.equal((await checkout.POST(req({plan:'Basic'}))).status,409);assert.equal((await portal.POST(req({}))).status,200);assert.equal(portalCustomer,customer);actor.id=otherId;assert.equal((await portal.POST(req({}))).status,404);actor.id=userId;
 actor.role='admin';assert.equal((await admin.POST(req({action:'payment',cycleId:cycle.id,revision:0,amountCents:1,reference:'manual-'+suffix,method:'cash',paidDate:new Date().toISOString().slice(0,10)}))).status,409);assert.equal((await admin.POST(req({action:'create',userId,plan:'Basic',startDate:'2027-01-01'}))).status,409);actor.role='family';
 sub.status='past_due';const failed={...invoice,id:'in_failed_'+suffix,status:'open',amount_paid:0};invoices.set(failed.id,failed);assert.equal((await send('invoice.payment_failed',failed)).status,200);assert.equal((await rows('SELECT status FROM stripe_billing WHERE user_id=?',[userId]))[0].status,'past_due');assert.equal((await rows('SELECT id FROM membership_cycles WHERE user_id=?',[userId])).length,1);
 sub.status='active';sub.cancel_at_period_end=true;assert.equal((await send('customer.subscription.updated',sub)).status,200);assert.equal((await rows('SELECT cancel_at_period_end FROM stripe_billing WHERE user_id=?',[userId]))[0].cancel_at_period_end,1);
 const retryId='evt_fixture_'+randomUUID();failRetrieve=true;assert.equal((await send('customer.subscription.updated',sub,{id:retryId})).status,500);assert.equal((await rows('SELECT id FROM stripe_events WHERE id=?',[retryId])).length,0);failRetrieve=false;assert.equal((await send('customer.subscription.updated',sub,{id:retryId})).status,200);
 charges.get(chargeId).amount_refunded=1000;assert.equal((await send('charge.refunded',charges.get(chargeId))).status,200);assert.equal((await rows('SELECT refunded_cents FROM membership_payments WHERE cycle_id=?',[cycle.id]))[0].refunded_cents,1000);
 assert.equal(await familyMembership.hasPaidFamilyMembership(userId),false,'Refunded or underpaid memberships do not hide the notice');
 const lateInvoice={...invoice,id:'in_refund_first_'+suffix,intent:'pi_refund_first_'+suffix};invoices.set(lateInvoice.id,lateInvoice);const lateCharge={id:'ch_refund_first_'+suffix,customer,payment_intent:lateInvoice.intent,amount_refunded:5900};charges.set(lateCharge.id,lateCharge);assert.equal((await send('charge.refunded',lateCharge)).status,200);assert.equal((await send('invoice.paid',lateInvoice)).status,200);assert.equal((await rows('SELECT p.refunded_cents FROM membership_payments p JOIN membership_cycles c ON c.id=p.cycle_id WHERE c.stripe_invoice_id=?',[lateInvoice.id]))[0].refunded_cents,5900);
 sub.status='canceled';assert.equal((await send('customer.subscription.deleted',sub)).status,200);assert.ok((await rows('SELECT cancelled_at FROM membership_cycles WHERE id=?',[cycle.id]))[0].cancelled_at);
 assert.equal((await send('customer.subscription.updated',{...sub,status:'active'})).status,200);assert.equal((await rows('SELECT status FROM stripe_billing WHERE user_id=?',[userId]))[0].status,'canceled','Stale payload must not restore active state');
 const bad={...invoice,id:'in_bad_'+suffix,amount_paid:100};invoices.set(bad.id,bad);assert.equal((await send('invoice.paid',bad)).status,500);assert.equal((await rows('SELECT id FROM membership_cycles WHERE stripe_invoice_id=?',[bad.id])).length,0);
 const placementSubmit=load('src/app/api/find-nanny/route.ts'),feeCheckout=load('src/app/api/billing/caregiver-fee/route.ts'),matchApi=load('src/app/api/admin/matches/route.ts'),reviewApi=load('src/app/api/admin/reviews/[kind]/[id]/route.ts');
 actor={id:otherId,name:'Placement fixture',email:'stripe-other-'+suffix+'@example.com',role:'family',emailVerifiedAt:new Date()};
 const submission=(careCategory='nanny',submissionKey=randomUUID())=>({careCategory,submissionKey,name:actor.name,email:actor.email,phone:'5550100',startDate:new Date(now*1000).toISOString().slice(0,10),numberOfChildren:'1',nannyTypes:['Full-time'],childrenAges:['2-4 years'],additionalCare:[],town:'Fixture town',address:'Fixture address',hiringCriteria:'Fixture care requirements'});
 assert.equal((await placementSubmit.POST(req(submission()))).status,409,'Unpaid families cannot submit nanny requests');
 for(const [plan,amount,limit] of [['Basic',5900,3],['Standard',8900,5],['Deluxe',12900,8],['Premium',20000,10]]){
  await connection.execute('UPDATE membership_cycles SET cancelled_at=UTC_TIMESTAMP() WHERE user_id=?',[otherId]);
  const cycle=randomUUID();await connection.execute('INSERT INTO membership_cycles (id,user_id,plan,amount_cents,start_date,end_date,period_start,period_end,created_by) VALUES (?,?,?,?,?,?,?,?,?)',[cycle,otherId,plan,amount,new Date(now*1000).toISOString().slice(0,10),new Date((now+30*86400)*1000).toISOString().slice(0,10),new Date((now-3600)*1000),new Date((now+30*86400)*1000),userId]);
  await connection.execute('INSERT INTO membership_payments (id,cycle_id,amount_cents,reference,method,paid_date,recorded_by) VALUES (?,?,?,?,?,?,?)',[randomUUID(),cycle,amount,'placement-'+cycle,'cash',new Date(now*1000).toISOString().slice(0,10),userId]);
  const payload=submission();const firstRequest=await placementSubmit.POST(req(payload));assert.equal(firstRequest.status,200,await firstRequest.clone().text());assert.equal((await placementSubmit.POST(req(payload))).status,200,'Request retries do not consume another submission');
  const attempts=await Promise.all(Array.from({length:limit},()=>placementSubmit.POST(req(submission()))));
  assert.equal(attempts.filter(r=>r.status===200).length,plan==='Premium'?limit:limit-1,plan+' monthly cap');
  assert.equal(attempts.filter(r=>r.status===409).length,plan==='Premium'?0:1);
  if(plan==='Basic'){
   const bookingApi=load('src/app/api/bookings/route.ts');
   for(let i=0;i<4;i++){
    const booked=await bookingApi.POST(req({requestKey:randomUUID(),startsAt:new Date((now+(i*2+1)*3600)*1000).toISOString(),endsAt:new Date((now+(i*2+2)*3600)*1000).toISOString(),town:'Fixture town',address:'Fixture address',careNeeds:'Fixture care'}));
    assert.equal(booked.status,200,await booked.clone().text());
   }
   assert.equal((await rows('SELECT id FROM family_requests WHERE membership_cycle_id=?',[cycle])).length,3,'Care bookings do not use nanny submissions');
  }

 }
 await connection.execute('UPDATE membership_cycles SET cancelled_at=UTC_TIMESTAMP() WHERE user_id=?',[otherId]);
 const feeSettingsApi=load('src/app/api/admin/fees/route.ts'),feeReadApi=load('src/app/api/fees/route.ts');
 const feeActor=actor;actor=null;assert.equal((await feeSettingsApi.PATCH(req({}))).status,401);
 actor=feeActor;assert.equal((await feeSettingsApi.PATCH(req({}))).status,403);
 actor={id:userId,role:'admin'};
 const currentFeeConfig=await load('src/lib/agency-fees.ts').getAgencyFees();
 const feeEdit={search:'67.25',placementRate:'15',revision:currentFeeConfig.revision};
 for(const invalid of ['0','-1','0.49','10000.01','1.001','NaN','1e2'])assert.equal((await feeSettingsApi.PATCH(req({...feeEdit,search:invalid}))).status,400,invalid);
 assert.equal((await feeSettingsApi.PATCH(req(feeEdit,{origin:'https://foreign.example'}))).status,403);
 assert.equal((await feeSettingsApi.PATCH(req(feeEdit))).status,200);
 assert.equal((await feeSettingsApi.PATCH(req(feeEdit))).status,409,'Concurrent administrator changes are rejected');
 const publicFees=await feeReadApi.GET(new Request('http://localhost:3000/api/fees'));assert.equal((await publicFees.json()).searchCents,6725);
 actor=feeActor;
 const newCaregiverFields={...submission('caregiver'),numberOfChildren:'',careRecipient:'Two children, ages 3 and 6',careNeeds:'Childcare, daily routines and school pickups',duration:'Long-term',schedule:'Weekdays, including overnight support'};
 const caregiver=await placementSubmit.POST(req(newCaregiverFields));assert.equal(caregiver.status,200);const caregiverId=(await caregiver.json()).requestId;
 const quoted=(await rows('SELECT * FROM caregiver_fees WHERE request_id=?',[caregiverId]));assert.equal(quoted.find(f=>f.kind==='search').amount_cents,6725);assert.equal(quoted.some(f=>f.kind==='placement'),false,'Placement invoice requires an admin salary quote');assert.equal((await rows('SELECT placement_rate_bps FROM family_requests WHERE id=?',[caregiverId]))[0].placement_rate_bps,1500);
 const ownerActor=actor;actor={id:userId,role:'admin'};
 const revisedConfig=await load('src/lib/agency-fees.ts').getAgencyFees();
 assert.equal((await feeSettingsApi.PATCH(req({search:'80',placementRate:'20',revision:revisedConfig.revision}))).status,200);
 const savedQuote=await feeReadApi.GET(new Request('http://localhost:3000/api/fees?requestId='+caregiverId));assert.equal((await savedQuote.json()).searchCents,6725,'Existing quotes survive price edits');
 actor={...ownerActor,id:userId};assert.equal((await feeReadApi.GET(new Request('http://localhost:3000/api/fees?requestId='+caregiverId))).status,404,'Other families cannot see request pricing');actor=ownerActor;
 const nextCaregiver=await placementSubmit.POST(req({...newCaregiverFields,submissionKey:randomUUID()}));assert.equal(nextCaregiver.status,200);const nextCaregiverId=(await nextCaregiver.json()).requestId;const nextQuote=await rows('SELECT * FROM caregiver_fees WHERE request_id=?',[nextCaregiverId]);assert.equal(nextQuote.find(f=>f.kind==='search').amount_cents,8000);assert.equal(nextQuote.some(f=>f.kind==='placement'),false);assert.equal((await rows('SELECT placement_rate_bps FROM family_requests WHERE id=?',[nextCaregiverId]))[0].placement_rate_bps,2000,'New requests use revised percentage');
 const visibility=load('src/lib/admin-request-visibility.ts'),schema=load('src/db/schema.ts'),{and,eq}=require('drizzle-orm');
 const visibleToAdmin=async()=> (await dbModule.db.select({id:schema.familyRequests.id}).from(schema.familyRequests).where(and(eq(schema.familyRequests.id,caregiverId),visibility.adminRequestVisibility()))).length===1;
 assert.equal(await visibleToAdmin(),false,'Unpaid caregiver requests must not reach the admin queue or counts');
 await connection.execute("UPDATE family_requests SET search_fee_status='paid' WHERE id=?",[caregiverId]);
 assert.equal(await visibleToAdmin(),false,'Editing a fee status does not publish an unverified payment');
 await connection.execute("UPDATE family_requests SET search_fee_status='unpaid' WHERE id=?",[caregiverId]);
 const caregiverBefore=(await rows('SELECT * FROM family_requests WHERE id=?',[caregiverId]))[0];assert.equal(caregiverBefore.membership_cycle_id,null);assert.equal(caregiverBefore.search_fee_status,'unpaid');assert.equal(caregiverBefore.town,'Fixture town');assert.ok(caregiverBefore.children_info.includes('Childcare, daily routines and school pickups'));assert.ok(caregiverBefore.schedule.includes('Long-term')&&caregiverBefore.schedule.includes('overnight'));
 const adminActor={id:userId,role:'admin',name:'Fixture admin',email:'stripe-'+suffix+'@example.com'};
 const originalFamilyActor=actor;
 const nannyId=randomUUID(),applicationId=randomUUID();await connection.execute('INSERT INTO users (id,name,email,role,password_hash) VALUES (?,?,?,?,?)',[nannyId,'Placement nanny','placement-nanny-'+suffix+'@example.com','nanny','fixture-no-login']);
 try{
  await connection.execute('INSERT INTO nanny_applications (id,user_id,name,email,status) VALUES (?,?,?,?,?)',[applicationId,nannyId,'Placement nanny','placement-nanny-'+suffix+'@example.com','active']);
  const screeningBio=JSON.stringify({version:1,values:{},references:[{name:'Reference A'},{name:'Reference B'}],workHistory:[],languages:[],attachments:[]});
  await connection.execute('UPDATE nanny_applications SET bio=?,status=? WHERE id=?',[screeningBio,'screening',applicationId]);
  const screeningApi=load('src/app/api/admin/screening/[id]/route.ts'),reviewApi=load('src/app/api/admin/reviews/[kind]/[id]/route.ts'),screeningPolicy=load('src/lib/screening-policy.ts');
  const screeningParams={params:Promise.resolve({id:applicationId})},reviewParams={params:Promise.resolve({kind:'nanny',id:applicationId})};
  const reviewCandidate=(status,expectedStatus,feedback='')=>reviewApi.PATCH(req({status,expectedStatus,feedback,note:''}),reviewParams);
  actor=null;assert.equal((await screeningApi.PUT(req({}),screeningParams)).status,401);
  actor={id:nannyId,role:'nanny',emailVerifiedAt:new Date()};assert.equal((await screeningApi.PUT(req({}),screeningParams)).status,403);
  actor=adminActor;assert.equal((await reviewCandidate('active','screening')).status,412,'Unscreened applications cannot be approved');
  const screeningBody={digest:screeningPolicy.applicationDigest(screeningBio),revision:-1,checks:{identity:true,experience:true,suitability:true},backgroundCheck:{status:'clear',completedOn:new Date().toISOString().slice(0,10),expiresOn:'2099-12-31',evidence:'Test agency screening reference'},references:[{status:'verified',note:'Called first referee; employment confirmed.'},{status:'pending',note:''}]};
  const saveScreening=body=>screeningApi.PUT(req(body),screeningParams);
  assert.equal((await saveScreening({...screeningBody,digest:'stale'})).status,409);
  assert.equal((await saveScreening(screeningBody)).status,200);
  assert.equal((await saveScreening(screeningBody)).status,409,'Stale screening edits cannot overwrite another review');
  assert.equal((await reviewCandidate('active','screening')).status,412,'Pending references prevent approval');
  assert.equal((await reviewCandidate('changes_requested','screening')).status,400,'Applicant feedback required');
  assert.equal((await reviewCandidate('changes_requested','screening','Please clarify employment dates.')).status,200);
  assert.equal((await rows('SELECT feedback FROM application_screenings WHERE application_id=?',[applicationId]))[0].feedback,'Please clarify employment dates.');
  assert.equal((await reviewCandidate('rejected','changes_requested','References could not be confirmed.')).status,200);
  assert.equal((await reviewCandidate('screening','rejected')).status,200);
  screeningBody.references[1]={status:'verified',note:'Called second referee; suitability confirmed.'};screeningBody.revision=2;
  assert.equal((await saveScreening(screeningBody)).status,200);
  assert.equal((await reviewCandidate('active','screening')).status,412,'Credentials are required as well as screening');
  for(const kind of ['cpr','first_aid'])await connection.execute('INSERT INTO caregiver_credentials (id,user_id,kind,file_name,stored_name,status,expires_on) VALUES (?,?,?,?,?,?,?)',[randomUUID(),nannyId,kind,'fixture.pdf',randomUUID()+'.pdf','verified','2099-12-31']);
  assert.equal((await reviewCandidate('active','screening')).status,200);
  assert.equal((await saveScreening({...screeningBody,revision:3,checks:{...screeningBody.checks,identity:false}})).status,423,'Approved screening decisions are locked');
  const eligible=load('src/lib/screening.ts');
  await connection.execute('UPDATE nanny_applications SET bio=? WHERE id=?',[screeningBio+' ',applicationId]);
  const schema=load('src/db/schema.ts');const orm=require('drizzle-orm');
  const [changedApp]=await dbModule.db.select().from(schema.nannyApplications).where(orm.eq(schema.nannyApplications.id,applicationId));
  assert.equal(await dbModule.db.transaction(tx=>eligible.screeningEligible(tx,changedApp)),false,'Application changes invalidate previous screening');
  await connection.execute('UPDATE nanny_applications SET bio=? WHERE id=?',[screeningBio,applicationId]);
  console.log('Screening authorization, reference evidence, stale edits, approval gates, correction/rejection feedback and changed-application invalidation passed.');

  const familyActor=originalFamilyActor;actor=adminActor;
  assert.equal((await matchApi.POST(req({requestId:caregiverId,applicationId,sharedNote:''}))).status,404,'Unpaid requests are unavailable to admin shortlisting');
  const review=(status,expectedStatus)=>reviewApi.PATCH(req({status,expectedStatus,note:'Fixture review'}),{params:Promise.resolve({kind:'family',id:caregiverId})});
  assert.equal((await review('searching','search_fee_invoiced')).status,404,'Admin cannot review an unpublished request');
  actor=familyActor;assert.equal((await feeCheckout.POST(req({requestId:caregiverId,kind:'placement'}))).status,409);
  actor={...familyActor,id:userId};assert.equal((await feeCheckout.POST(req({requestId:caregiverId,kind:'search'}))).status,404,'Other families cannot pay or inspect this request');actor=familyActor;
  const pay=async kind=>{
   const opened=await feeCheckout.POST(req({requestId:caregiverId,kind,amountCents:1,annualSalary:'1',placementRateBps:1}));assert.equal(opened.status,200,await opened.clone().text());
   const [fee]=await rows('SELECT * FROM caregiver_fees WHERE request_id=? AND kind=?',[caregiverId,kind]);if(kind==='placement'){const familyActor=actor;actor=adminActor;assert.equal((await load('src/app/api/admin/placement-fees/route.ts').POST(req({requestId:caregiverId,matchId:fee.match_id,annualSalary:'70000',revision:fee.quote_revision}))).status,409,'Invoices lock when checkout begins');actor=familyActor;}const checkout=sessions.get(fee.checkout_session_id);
   const retry=await feeCheckout.POST(req({requestId:caregiverId,kind}));assert.equal(retry.status,200,'Open fee checkout is reused');
   const intent='pi_fee_'+randomUUID(),chargeId='ch_fee_'+randomUUID();checkout.status='complete';checkout.mode='payment';checkout.payment_status='paid';checkout.currency='usd';checkout.amount_total=fee.amount_cents;checkout.payment_intent=intent;assert.equal(checkout.line_items[0].price_data.unit_amount,fee.amount_cents,'Checkout uses the saved fee, not the current price');
   intents.set(intent,{id:intent,status:'succeeded',amount_received:fee.amount_cents,currency:'usd',metadata:{egnFeeId:fee.id}});charges.set(chargeId,{id:chargeId,customer:checkout.customer,payment_intent:intent,amount_refunded:0});
   assert.equal((await rows('SELECT status FROM caregiver_fees WHERE id=?',[fee.id]))[0].status,'checkout_pending','Checkout opening or return does not mark fees paid');
   if(kind==='search')assert.equal(await visibleToAdmin(),false,'Opening checkout does not release the request');
   checkout.amount_total=fee.amount_cents-100;assert.equal((await send('checkout.session.completed',checkout)).status,500,'Incorrect fee amounts must be rejected');checkout.amount_total=fee.amount_cents;
   assert.equal((await send('checkout.session.completed',checkout)).status,200);assert.equal((await send('checkout.session.completed',checkout)).status,200);
   assert.equal(await visibleToAdmin(),true,'A verified search payment releases the request for review');
   assert.equal((await rows('SELECT * FROM caregiver_fees WHERE id=?',[fee.id]))[0].status,'paid');assert.equal((await feeCheckout.POST(req({requestId:caregiverId,kind}))).status,409,'Paid fees cannot be charged again');return{checkout,chargeId};
  };
  const searchPayment=await pay('search');actor=adminActor;
  const match=await matchApi.POST(req({requestId:caregiverId,applicationId,sharedNote:''}));assert.equal(match.status,200,await match.clone().text());const matchId=(await match.json()).id;
  assert.equal((await matchApi.PATCH(req({id:matchId,revision:0,status:'interview',interviewAt:new Date((now+3600)*1000).toISOString(),sharedNote:''}))).status,400,'Interview transitions are no longer supported');
  const place=()=>matchApi.PATCH(req({id:matchId,revision:0,status:'placed',placementStart:new Date(now*1000).toISOString().slice(0,10),sharedNote:''}));
  assert.equal((await place()).status,409,'Unpaid placement fee blocks start of work');
  assert.equal((await review('placement_fee_due','shortlist')).status,423,'A shortlist alone cannot create a payable fee');
  const quoteApi=load('src/app/api/admin/placement-fees/route.ts'),quoteBody={requestId:caregiverId,matchId,annualSalary:'60000',revision:-1};
  actor=familyActor;assert.equal((await quoteApi.POST(req(quoteBody))).status,403,'Families cannot set their salary or fee');actor={...familyActor,role:'nanny'};assert.equal((await quoteApi.POST(req(quoteBody))).status,403);actor=adminActor;
  for(const annualSalary of ['0','-1','1e5','60000.001','1000000','NaN'])assert.equal((await quoteApi.POST(req({...quoteBody,annualSalary}))).status,400);
  assert.equal((await quoteApi.POST(req({...quoteBody,matchId:randomUUID()}))).status,409,'Quote must use this request’s shortlist');
  const salaryQuote=await quoteApi.POST(req({...quoteBody,placementRateBps:1,amountCents:1}));assert.equal(salaryQuote.status,200,await salaryQuote.clone().text());const quotedSalary=await salaryQuote.json();assert.equal(quotedSalary.amountCents,900000,'60000 annual salary at the request’s original 15% is $9000');assert.equal(quotedSalary.placementRateBps,1500);assert.equal(quotedSalary.annualSalaryCents,6000000);assert.equal(quotedSalary.matchId,matchId);
  assert.equal((await quoteApi.POST(req(quoteBody))).status,409,'Stale quotes are rejected');
  actor=familyActor;const familyQuote=await (await feeReadApi.GET(new Request('http://localhost:3000/api/fees?requestId='+caregiverId))).json();assert.equal(familyQuote.placementCents,900000);assert.equal(familyQuote.annualSalaryCents,6000000);assert.equal(familyQuote.candidateName,'Placement nanny');

  await pay('placement');actor=adminActor;const placed=await place();assert.equal(placed.status,200,await placed.clone().text());
  charges.get(searchPayment.chargeId).amount_refunded=1000;assert.equal((await send('charge.refunded',charges.get(searchPayment.chargeId))).status,200);assert.equal((await rows('SELECT search_fee_status FROM family_requests WHERE id=?',[caregiverId]))[0].search_fee_status,'refunded');assert.equal(await visibleToAdmin(),true,'Previously confirmed requests remain visible for refund review');
  assert.equal((await rows('SELECT id FROM membership_cycles WHERE user_id=? AND source=?',[otherId,'stripe'])).length,0,'Caregiver fee payment never activates a membership');
 }finally{
  await connection.execute('DELETE FROM caregiver_fees WHERE match_id IN (SELECT id FROM nanny_matches WHERE nanny_application_id=?)',[applicationId]);
  const matches=await rows('SELECT id FROM nanny_matches WHERE nanny_application_id=?',[applicationId]);for(const m of matches)await connection.execute('DELETE FROM nanny_matches WHERE id=?',[m.id]);
  await connection.execute('DELETE FROM review_events WHERE nanny_application_id=?',[applicationId]);await connection.execute('DELETE FROM caregiver_credentials WHERE user_id=?',[nannyId]);await connection.execute('DELETE FROM nanny_applications WHERE id=?',[applicationId]);await connection.execute('DELETE FROM admin_access WHERE user_id=?',[nannyId]);await connection.execute('DELETE FROM users WHERE id=?',[nannyId]);
 }
 console.log('Fee settings passed: admin authorization, USD validation, stale edits, audit trail, current public pricing, private request quotes, price snapshots, exact checkout amounts and non-default webhook confirmation.');
 console.log('Placement flows passed: admin queue release after verified search payment only, hidden unpaid review/shortlist APIs, paid-only babysitter submissions, plan caps and concurrent limits, idempotent requests, salary-based nanny fees and readonly family quotes, admin payment gates, checkout reuse, paid-only activation, refund handling and placement after payment.');
 console.log('Stripe fixture integration passed: missed-event recovery, recovery retries and deduplication, unrelated customer isolation, checkout reuse/cancellation, authorization, ownership, signature and mode checks, paid-only activation, duplicate events/invoices, portal, manual edit protection, failed payments, retries, refunds, cancellation and stale event order. No Stripe network requests or payments were made.');
}finally{
 if(originalFees)await connection.execute('UPDATE agency_fee_settings SET search_cents=?,placement_cents=?,placement_rate_bps=?,revision=?,updated_by=?,updated_at=? WHERE id=1',[originalFees.search_cents,originalFees.placement_cents,originalFees.placement_rate_bps,originalFees.revision,originalFees.updated_by,originalFees.updated_at]);else await connection.execute('DELETE FROM agency_fee_settings WHERE id=1');
 const bookings=await rows('SELECT id FROM care_bookings WHERE family_id IN (?,?)',[userId,otherId]);for(const b of bookings){await connection.execute('DELETE FROM mail_jobs WHERE body LIKE ?',['Booking '+b.id+':%']);await connection.execute('DELETE FROM booking_events WHERE booking_id=?',[b.id]);await connection.execute('DELETE FROM booking_assignments WHERE booking_id=?',[b.id]);await connection.execute('DELETE FROM care_bookings WHERE id=?',[b.id]);}
 const requests=await rows('SELECT id FROM family_requests WHERE user_id IN (?,?)',[userId,otherId]);for(const r of requests){await connection.execute('DELETE FROM caregiver_fees WHERE request_id=?',[r.id]);await connection.execute('DELETE FROM review_events WHERE family_request_id=?',[r.id]);await connection.execute('DELETE FROM family_requests WHERE id=?',[r.id]);}
 const cycles=await rows('SELECT id FROM membership_cycles WHERE user_id IN (?,?)',[userId,otherId]);for(const c of cycles){await connection.execute('DELETE FROM membership_reminders WHERE cycle_id=?',[c.id]);await connection.execute('DELETE FROM membership_payments WHERE cycle_id=?',[c.id]);}await connection.execute('DELETE FROM membership_cycles WHERE user_id IN (?,?)',[userId,otherId]);await connection.execute('DELETE FROM stripe_billing WHERE user_id IN (?,?)',[userId,otherId]);await connection.execute('DELETE FROM review_events WHERE reviewer_id IN (?,?)',[userId,otherId]);await connection.execute('DELETE FROM admin_access WHERE user_id IN (?,?)',[userId,otherId]);await connection.execute('DELETE FROM users WHERE id IN (?,?)',[userId,otherId]);for(const id of eventIds)await connection.execute('DELETE FROM stripe_events WHERE id=?',[id]);await connection.end();await pool?.end();console.log('Stripe temporary fixtures cleaned up.');
}
