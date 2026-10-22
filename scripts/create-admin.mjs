import 'dotenv/config';
import mysql from 'mysql2/promise';
import {randomUUID,randomBytes,scryptSync} from 'node:crypto';
import fs from 'node:fs/promises';
const url=new URL(process.env.DATABASE_URL||'mysql://invalid');
if(!['127.0.0.1','localhost'].includes(url.hostname)) throw Error('This helper provisions a local administrator only.');
const email=process.env.ADMIN_EMAIL||'admin@executiveglobalnanny.local';
const connection=await mysql.createConnection(process.env.DATABASE_URL);
try {
 const [existing]=await connection.execute('SELECT id FROM users WHERE email=?',[email]);
 if(existing.length) throw Error('Account already exists; no account was promoted or overwritten.');
 const password=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex');
 await fs.mkdir('.data',{recursive:true});
 await fs.writeFile('.data/admin-credentials.txt',`Local administrator\nEmail: ${email}\nPassword: ${password}\nLogin: http://localhost:3001/login\nDashboard: http://localhost:3001/dashboard/admin\n`,{flag:'wx'});
 await connection.beginTransaction();const id=randomUUID();
 await connection.execute('INSERT INTO users (id,role,name,email,password_hash) VALUES (?,?,?,?,?)',[id,'admin','Administrator',email,`${salt}:${scryptSync(password,salt,64).toString('hex')}`]);
 await connection.execute("INSERT INTO admin_access(user_id,super_admin,status,role_label,permissions) VALUES(?,1,'active','Super Admin','[]')",[id]);await connection.commit();
 console.log('Local administrator created. Credentials saved privately in .data/admin-credentials.txt.');
}catch(error){await connection.rollback();throw error;}finally{await connection.end();}
