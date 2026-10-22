import 'dotenv/config';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import {randomUUID,createHmac} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const base='http://localhost:3000';assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));
const db=await mysql.createConnection(process.env.DATABASE_URL),id=randomUUID();let browser;
try{
 await db.execute('INSERT INTO users(id,name,email,role,password_hash,email_verified_at) VALUES(?,?,?,?,?,UTC_TIMESTAMP())',[id,'Fee settings UI fixture','fee-ui-'+id+'@example.com','admin','fixture-no-login']);
 await db.execute("INSERT INTO admin_access(user_id,super_admin,status,role_label,permissions) VALUES(?,1,'active','Super Admin','[]')",[id]);
 const payload=Buffer.from(JSON.stringify({uid:id,role:'admin',version:0,exp:Date.now()+3600000})).toString('base64url'),value=payload+'.'+createHmac('sha256',process.env.SESSION_SECRET||'dev-secret-change-in-production').update(payload).digest('hex');
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});await fs.mkdir('.data/fee-qa',{recursive:true});
 for(const [label,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:width<700,hasTouch:width<700});await context.addCookies([{name:'egn_session',value,url:base}]);const page=await context.newPage();
  const response=await page.goto(base+'/dashboard/admin/settings',{waitUntil:'domcontentloaded',timeout:240000});assert.equal(response.status(),200);
  const card=page.locator('section.dashboard-card').filter({has:page.getByRole('heading',{name:'Search & placement fees',exact:true})});await card.getByLabel('Search fee (USD)').waitFor({timeout:120000});
  assert.equal(await card.getByLabel('Placement fee (USD)').count(),1);await card.scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Horizontal overflow on '+label);
  await card.screenshot({path:'.data/fee-qa/'+label+'.png',timeout:60000});console.log(label+' fee controls rendered without horizontal overflow');await context.close();
 }
}finally{await browser?.close();await db.execute('DELETE FROM admin_access WHERE user_id=?',[id]);await db.execute('DELETE FROM users WHERE id=?',[id]);await db.end();console.log('Fee UI fixture removed.');}
