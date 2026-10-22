import path from "node:path";
import {randomUUID} from "node:crypto";
import {mkdir,writeFile,unlink} from "node:fs/promises";
import sharp from "sharp";
import {and,eq,isNull,lt} from "drizzle-orm";
import {db} from "@/db";
import {conversationAttachments,conversations} from "@/db/schema";
import {CHAT_FILE_LIMIT,CHAT_STAGING_MS} from "./chat-file-policy";
export {CHAT_STAGING_MS} from "./chat-file-policy";
export const chatFilePath=(name:string)=>{if(!/^[a-f0-9-]{36}\.(jpg|png|webp|pdf|docx|txt)$/.test(name))throw Error("Invalid stored file");return path.join(process.cwd(),".data","chat-uploads",name);};
export async function boundedForm(req:Request){
 const limit=CHAT_FILE_LIMIT+65536;if(Number(req.headers.get("content-length"))>limit)throw Error("Upload a file of up to 10 MB.");
 const reader=req.body?.getReader();if(!reader)throw Error("Choose a file.");const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>limit){await reader.cancel();throw Error("Upload a file of up to 10 MB.");}chunks.push(next.value);}}finally{reader.releaseLock();}
 return new Response(Buffer.concat(chunks),{headers:{"Content-Type":req.headers.get("content-type")||""}}).formData();
}
function validDocx(data:Buffer){
 // Inspect the ZIP directory without extracting or executing uploaded content.
 let end=-1;for(let i=data.length-22;i>=Math.max(0,data.length-65557);i--){if(data.readUInt32LE(i)===0x06054b50){end=i;break;}}
 if(end<0||data.readUInt16LE(end+4)||data.readUInt16LE(end+6))return false;
 const count=data.readUInt16LE(end+10),offset=data.readUInt32LE(end+16),directorySize=data.readUInt32LE(end+12);if(!count||count>1000||offset+directorySize>end)return false;
 let at=offset,total=0;const names=new Set<string>();
 for(let i=0;i<count;i++){if(at+46>data.length||data.readUInt32LE(at)!==0x02014b50||data.readUInt16LE(at+8)&1)return false;
 const length=data.readUInt16LE(at+28),extra=data.readUInt16LE(at+30),comment=data.readUInt16LE(at+32),size=data.readUInt32LE(at+24);if(at+46+length+extra+comment>data.length)return false;
 const name=data.subarray(at+46,at+46+length).toString("utf8");if(name.includes("..")||name.startsWith("/")||name.includes("\\")||/vbaProject|macros|activeX/i.test(name)||names.has(name))return false;
 total+=size;if(total>50*1024*1024)return false;names.add(name);at+=46+length+extra+comment;
 }
 return at===offset+directorySize&&names.has("[Content_Types].xml")&&names.has("word/document.xml");
}
export async function validateChatFile(file:File){
 if(!file.size||file.size>CHAT_FILE_LIMIT)throw Error("Choose a non-empty file of up to 10 MB.");
 const extension=path.extname(file.name).toLowerCase();let data:Buffer=Buffer.from(await file.arrayBuffer());let mime="",ext=extension.slice(1);
 if([".jpg",".jpeg",".png",".webp"].includes(extension)){
  try{const image=sharp(data,{limitInputPixels:20000000,animated:false,failOn:"warning"}),meta=await image.metadata();const format=extension===".jpg"||extension===".jpeg"?"jpeg":ext;
   if(meta.format!==format||(meta.pages??1)>1)throw Error();data=await image.rotate().toFormat(format as "jpeg"|"png"|"webp").toBuffer();mime=`image/${format}`;ext=format==="jpeg"?"jpg":format;
  }catch{throw Error("Choose a valid JPG, PNG or WebP image under 20 megapixels.");}
 }else if(extension===".pdf"&&data.subarray(0,5).toString()==="%PDF-"&&data.subarray(-2048).includes(Buffer.from("%%EOF"))){mime="application/pdf";
 }else if(extension===".docx"&&validDocx(data)){mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document";
 }else if(extension===".txt"){
  try{const text=new TextDecoder("utf-8",{fatal:true}).decode(data);if(/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text))throw Error();mime="text/plain";}catch{throw Error("Text documents must contain valid UTF-8 text.");}
 }else throw Error("Use JPG, PNG, WebP, PDF, Word (.docx) or TXT. The file contents must match its type.");
 if(data.length>CHAT_FILE_LIMIT)throw Error("The processed file exceeds 10 MB.");
 const base=file.name.slice(0,-extension.length).replace(/[\x00-\x1f\x7f/\\]/g,"_");
 const name=(Array.from(base).slice(0,140).join("")||"attachment")+"."+ext;
 return{data,mime,ext,fileName:name};
}
export async function saveChatFile(data:Buffer,extension:string){const storedName=randomUUID()+"."+extension,target=chatFilePath(storedName);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,data,{flag:"wx",mode:0o600});return storedName;}
export const removeChatFile=(name:string)=>unlink(chatFilePath(name)).catch(()=>{});
export async function cleanupChatUploads(limit=50,uploaderId?:string){
 const expired=await db.select().from(conversationAttachments).where(and(isNull(conversationAttachments.messageId),lt(conversationAttachments.createdAt,new Date(Date.now()-CHAT_STAGING_MS)),uploaderId?eq(conversationAttachments.uploaderId,uploaderId):undefined)).limit(limit);
 let removed=0;for(const item of expired){const deleted=await db.transaction(async tx=>{await tx.select({id:conversations.id}).from(conversations).where(eq(conversations.id,item.conversationId)).for("update");const [current]=await tx.select().from(conversationAttachments).where(eq(conversationAttachments.id,item.id));if(!current||current.messageId)return false;await tx.delete(conversationAttachments).where(eq(conversationAttachments.id,item.id));return true;});if(deleted){await removeChatFile(item.storedName);removed++;}}
 return removed;
}
