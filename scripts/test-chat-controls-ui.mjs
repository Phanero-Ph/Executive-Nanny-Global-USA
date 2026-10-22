import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {createRequire} from 'node:module';import ts from 'typescript';
const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),cache=new Map();let role='family';
function resolve(base){for(const ext of ['.ts','.tsx','/index.ts'])if(fs.existsSync(base+ext))return base+ext;throw Error('Module not found: '+base);}
function load(filename){filename=path.resolve(filename);if(cache.has(filename))return cache.get(filename);const module={exports:{}};cache.set(filename,module.exports);function localRequire(name){if(name==='next/navigation')return {useRouter:()=>({refresh(){},replace(){},push(){}}),usePathname:()=>'/dashboard/'+role,useSearchParams:()=>new URLSearchParams()};if(name==='next/link')return function Link({href,children,...props}){return React.createElement('a',{href,...props},children);};if(name.endsWith('.css'))return {};if(name.startsWith('@/'))return load(resolve(path.resolve('src',name.slice(2))));if(name.startsWith('.'))return load(resolve(path.resolve(path.dirname(filename),name)));return require(name);}const source=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;vm.runInNewContext(source,{exports:module.exports,module,require:localRequire,console,URL,URLSearchParams,Date,process,Buffer},{filename});cache.set(filename,module.exports);return module.exports;}
const {AdminPermissionsProvider}=load('src/components/AdminPermissions.tsx');
const {ChatAccessProvider,ChatOnly}=load('src/components/ChatAccess.tsx'),{DashboardShell}=load('src/components/DashboardShell.tsx'),{OpenConversation}=load('src/components/Messaging.tsx');
for(const familyEnabled of [false,true])for(const nannyEnabled of [false,true])for(role of ['family','nanny','admin']){
 const enabled=role==='admin'||(role==='family'?familyEnabled:nannyEnabled),initial={familyEnabled,nannyEnabled};
 const html=renderToStaticMarkup(React.createElement(AdminPermissionsProvider,{role,initial:role==='admin'?{superAdmin:true,permissions:[]}:null},React.createElement(ChatAccessProvider,{initial,role},React.createElement(DashboardShell,{user:{name:'Member fixture',email:'fixture@example.com',role}},React.createElement(OpenConversation),React.createElement(ChatOnly,null,React.createElement('a',{href:'/dashboard/messages'},'Ask the agency'))))));
 assert.equal(html.includes('href="/dashboard/messages"'),enabled,role+' links');assert.equal(html.includes('Message agency'),enabled,role+' message buttons');
 if(role==='admin')for(const memberRole of ['family','nanny']){const target=renderToStaticMarkup(React.createElement(AdminPermissionsProvider,{role,initial:{superAdmin:true,permissions:[]}},React.createElement(ChatAccessProvider,{initial,role},React.createElement(OpenConversation,{memberId:'fixture',memberRole}))));assert.equal(target.includes('<button'),memberRole==='family'?familyEnabled:nannyEnabled,'Admin contact action respects group');}
}
console.log('Rendered dashboard controls passed: sidebar, header, agency buttons and contextual links hidden for disabled roles in every toggle combination.');

for(const permissions of [[],['payments.view'],['messages.family'],['families.view','families.review']]){
 role='admin';const grant={superAdmin:false,permissions};const html=renderToStaticMarkup(React.createElement(AdminPermissionsProvider,{role,initial:grant},React.createElement(ChatAccessProvider,{role,initial:{familyEnabled:true,nannyEnabled:true}},React.createElement(DashboardShell,{user:{name:'Limited admin',email:'limited@example.com',role}},React.createElement(OpenConversation,{memberId:'fixture',memberRole:'nanny'})))));
 assert.equal(html.includes('href="/dashboard/admin/payments"'),permissions.includes('payments.view'));
 assert.equal(html.includes('href="/dashboard/admin/requests"'),permissions.includes('families.view'));
 assert.equal(html.includes('href="/dashboard/messages"'),permissions.includes('messages.family'));
 assert.ok(!html.includes('href="/dashboard/admin/nannies"'));assert.ok(!html.includes('href="/dashboard/admin/training"'));
 assert.ok(!html.includes('>Message</button>'),'Nanny messaging action hidden without nanny-chat permission');
}
console.log('Restricted administrator UI passed: sidebar and message controls follow assigned permissions.');
