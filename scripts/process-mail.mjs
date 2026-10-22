import 'dotenv/config';
import mysql from 'mysql2/promise';
import {deliverMail,smtpTransport} from '../src/lib/mail-delivery.mjs';
if(process.argv.includes('--check')) {
 try {const transport=smtpTransport();await transport.verify();transport.close();console.log('SMTP authentication and TLS connection successful. No email was sent.');}
 catch {console.error('SMTP verification failed. Check SMTP_USER and the Gmail App Password in SMTP_PASS.');process.exitCode=1;}
} else {
 const connection=await mysql.createConnection({uri:process.env.DATABASE_URL,timezone:"Z"});
 try {
  await connection.query("SET time_zone = '+00:00'");
  await connection.execute("UPDATE mail_jobs SET status='pending' WHERE status='sending' AND attempted_at < DATE_SUB(NOW(),INTERVAL 5 MINUTE)");
  const [jobs]=await connection.query("SELECT id,recipient,subject,body FROM mail_jobs WHERE status='pending' AND attempts<5 ORDER BY created_at LIMIT 50");
  let delivered=0;
  for(const job of jobs) {
   const [claimed]=await connection.execute("UPDATE mail_jobs SET status='sending',attempts=attempts+1,attempted_at=NOW() WHERE id=? AND status='pending'",[job.id]);if(!claimed.affectedRows)continue;
   try {const status=await deliverMail(job);await connection.execute("UPDATE mail_jobs SET status=?,sent_at=NOW(),body='' WHERE id=?",[status,job.id]);delivered++;}
   catch {await connection.execute("UPDATE mail_jobs SET status='pending' WHERE id=?",[job.id]);}
  }
  await connection.execute("DELETE FROM recovery_limits WHERE created_at < DATE_SUB(NOW(),INTERVAL 2 DAY)");
  await connection.execute("DELETE FROM account_tokens WHERE expires_at < DATE_SUB(NOW(),INTERVAL 7 DAY)");
  console.log(`Processed ${jobs.length} queued emails; delivered or previewed ${delivered}.`);
 } finally {await connection.end();}
}
