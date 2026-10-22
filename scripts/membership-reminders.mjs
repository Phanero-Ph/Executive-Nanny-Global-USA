import 'dotenv/config';
import mysql from 'mysql2/promise';
import {randomUUID} from 'node:crypto';
const base=new URL(process.env.APP_URL||'http://localhost:3001');
if(process.env.NODE_ENV==='production'&&base.protocol!=='https:')throw new Error('Production APP_URL must use HTTPS.');
const connection=await mysql.createConnection({uri:process.env.DATABASE_URL,timezone:'Z'});
try {
 await connection.query("SET time_zone = '+00:00'");
 const [cycles]=await connection.query("SELECT id,user_id FROM membership_cycles WHERE source='manual' AND cancelled_at IS NULL AND start_date<=DATE_FORMAT(UTC_DATE(),'%Y-%m-%d') AND end_date>DATE_FORMAT(UTC_DATE(),'%Y-%m-%d') AND end_date<=DATE_FORMAT(DATE_ADD(UTC_DATE(),INTERVAL 7 DAY),'%Y-%m-%d')");
 let queued=0;
 for(const candidate of cycles){
  await connection.beginTransaction();
  try {
   const [[family]]=await connection.execute('SELECT id,email,role FROM users WHERE id=? FOR UPDATE',[candidate.user_id]);
   const [[cycle]]=await connection.execute('SELECT * FROM membership_cycles WHERE id=? FOR UPDATE',[candidate.id]);
   const today=new Date().toISOString().slice(0,10);
   if(!family||family.role!=='family'||!cycle||cycle.cancelled_at||cycle.end_date<=today){await connection.rollback();continue;}
   const [[total]]=await connection.execute('SELECT COALESCE(SUM(amount_cents),0) AS paid FROM membership_payments WHERE cycle_id=? AND voided_at IS NULL',[cycle.id]);
   const [renewals]=await connection.execute('SELECT id FROM membership_cycles WHERE user_id=? AND cancelled_at IS NULL AND start_date=?',[family.id,cycle.end_date]);
   if(Number(total.paid)<cycle.amount_cents||renewals.length){await connection.rollback();continue;}
   const [claim]=await connection.execute('INSERT IGNORE INTO membership_reminders (cycle_id) VALUES (?)',[cycle.id]);
   if(!claim.affectedRows){await connection.rollback();continue;}
   await connection.execute('INSERT INTO mail_jobs (id,user_id,recipient,subject,body) VALUES (?,?,?,?,?)',[randomUUID(),family.id,family.email,'Your family membership renewal',`Your ${cycle.plan} membership ends on ${cycle.end_date}. Contact our team to arrange renewal. There are no automatic charges.\n\nView your membership: ${new URL('/dashboard/family',base)}\n\nExecutive Global Nanny`]);
   await connection.commit();queued++;
  }catch(error){await connection.rollback();throw error;}
 }
 console.log(`Queued ${queued} membership renewal reminders.`);
}finally{await connection.end();}
