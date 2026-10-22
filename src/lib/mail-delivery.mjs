import nodemailer from 'nodemailer';
import fs from 'node:fs/promises';
import path from 'node:path';
export function smtpTransport() {
 if(!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.MAIL_FROM) throw Error('SMTP settings are incomplete.');
 const port=Number(process.env.SMTP_PORT||587);
 return nodemailer.createTransport({host:process.env.SMTP_HOST||'smtp.gmail.com',port,secure:port===465,requireTLS:port!==465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},connectionTimeout:15000,greetingTimeout:15000,socketTimeout:20000});
}
/** @param {{id:string,recipient:string,subject:string,body:string}} job */
export async function deliverMail(job) {
 if(process.env.EMAIL_MODE==='preview' && process.env.NODE_ENV!=='production') {
  const folder=path.join(process.cwd(),'.data','mail-preview');await fs.mkdir(folder,{recursive:true});
  await fs.writeFile(path.join(folder,job.id+'.json'),JSON.stringify({to:job.recipient,subject:job.subject,text:job.body},null,2));return 'preview';
 }
 const transport=smtpTransport();
 try {await transport.sendMail({from:{name:'Executive Global Nanny',address:process.env.MAIL_FROM||''},to:job.recipient,subject:job.subject,text:job.body});return 'sent';}finally{transport.close();}
}
