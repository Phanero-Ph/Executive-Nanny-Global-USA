import 'dotenv/config';
import mysql from 'mysql2/promise';
import {randomUUID} from 'node:crypto';
const connection=await mysql.createConnection({uri:process.env.DATABASE_URL,timezone:'Z'});
try {
 await connection.query("SET time_zone = '+00:00'");
 const [candidates]=await connection.query("SELECT id,user_id FROM caregiver_credentials WHERE status='verified' AND expires_on<=DATE_FORMAT(DATE_ADD(UTC_DATE(),INTERVAL 30 DAY),'%Y-%m-%d')");
 let queued=0;
 for(const candidate of candidates){await connection.beginTransaction();try{
 const [[owner]]=await connection.execute("SELECT id,email FROM users WHERE id=? AND role='nanny' FOR UPDATE",[candidate.user_id]);
 const [[record]]=await connection.execute("SELECT * FROM caregiver_credentials WHERE id=? AND status='verified' AND expires_on<=DATE_FORMAT(DATE_ADD(UTC_DATE(),INTERVAL 30 DAY),'%Y-%m-%d') FOR UPDATE",[candidate.id]);
 if(!owner||!record){await connection.rollback();continue;}
 const [claim]=await connection.execute('INSERT IGNORE INTO credential_reminders (credential_id,revision) VALUES (?,?)',[record.id,record.revision]);
 if(!claim.affectedRows){await connection.rollback();continue;}
 const [admins]=await connection.query("SELECT id,email FROM users WHERE role='admin'");
 for(const recipient of [owner,...admins])await connection.execute('INSERT INTO mail_jobs (id,user_id,recipient,subject,body) VALUES (?,?,?,?,?)',[randomUUID(),recipient.id,recipient.email,'Caregiver credential expiry',`A caregiver credential expires on ${record.expires_on}. Review documents and upcoming assignments: ${new URL(recipient.id===owner.id?'/dashboard/nanny/credentials':'/dashboard/admin/credentials?userId='+owner.id,process.env.APP_URL)}`]);
 await connection.commit();queued++;
 }catch(error){await connection.rollback();throw error;}}
 console.log(`Queued ${queued} credential expiry reminders.`);
}finally{await connection.end();}
