import nodemailer from 'nodemailer';
import fs from 'node:fs/promises';
import path from 'node:path';
const HTML_EMAIL_PREFIX='__egn_html_email_v1__';
export function packHtmlEmail(text,html){return `${HTML_EMAIL_PREFIX}${JSON.stringify({text,html})}`;}
function unpackEmailBody(body){
 if(!body.startsWith(HTML_EMAIL_PREFIX))return{text:body};
 try{const content=JSON.parse(body.slice(HTML_EMAIL_PREFIX.length));if(typeof content.text==='string'&&typeof content.html==='string')return content;}catch{}
 return{text:body};
}
export function smtpTransport() {
 if(!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.MAIL_FROM) throw Error('SMTP settings are incomplete.');
 const port=Number(process.env.SMTP_PORT||587);
 return nodemailer.createTransport({host:process.env.SMTP_HOST||'smtp.gmail.com',port,secure:port===465,requireTLS:port!==465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},connectionTimeout:15000,greetingTimeout:15000,socketTimeout:20000});
}
export function mailDeliveryIssue(error) {
 const code=error?.code, responseCode=Number(error?.responseCode||0);
 if(code==='EAUTH'||responseCode===535)return 'SMTP authentication failed. Update SMTP_PASS with a current Gmail App Password and verify SMTP_USER.';
 if(['ETIMEDOUT','ECONNECTION','ECONNREFUSED','ESOCKET','ENOTFOUND'].includes(code))return 'The app could not connect to the SMTP server. Check SMTP_HOST, SMTP_PORT, and the server network access.';
 if(responseCode>=500)return `The SMTP server rejected the message (response ${responseCode}). Check the recipient and authorized sender address.`;
 if(error?.message==='SMTP settings are incomplete.')return 'SMTP settings are incomplete. Configure SMTP_USER, SMTP_PASS, and MAIL_FROM.';
 return 'Email delivery failed. The message remains queued for retry; check the server logs for the SMTP error code.';
}
/** @param {{id:string,recipient:string,subject:string,body:string}} job */
export async function deliverMail(job) {
 const content=unpackEmailBody(job.body);
 if(process.env.EMAIL_MODE==='preview' && process.env.NODE_ENV!=='production') {
  const folder=path.join(process.cwd(),'.data','mail-preview');await fs.mkdir(folder,{recursive:true});
  await fs.writeFile(path.join(folder,job.id+'.json'),JSON.stringify({to:job.recipient,subject:job.subject,...content},null,2));return 'preview';
 }
 const transport=smtpTransport();
 try {await transport.sendMail({from:{name:'Executive Global Nanny',address:process.env.MAIL_FROM||''},to:job.recipient,subject:job.subject,...content});return 'sent';}finally{transport.close();}
}
