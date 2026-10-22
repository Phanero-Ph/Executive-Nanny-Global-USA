/* eslint-disable @next/next/no-img-element -- Chat images require the viewer's authenticated cookie and must bypass public image optimizers. */
"use client";
import {FileText,Download} from "lucide-react";
import type {ChatAttachment} from "@/lib/chat-file-policy";
import {fileSize} from "@/lib/chat-file-policy";
import styles from "./Messaging.module.css";
export type ReplyTarget={id:string;sequence:number;body:string;senderName:string;senderRole:string;attachmentName?:string|null};
export type ChatMessage={id:string;sequence:number;body:string;createdAt:string;senderId:string;senderName:string;senderRole:string;attachments:ChatAttachment[];replyTo:ReplyTarget|null};
export function MessageText({text}:{text:string}){
 const pattern=/(?:https?:\/\/|www\.)[^\s<>]+/gi;const parts:React.ReactNode[]=[];let end=0;
 for(const match of text.matchAll(pattern)){const start=match.index!;parts.push(text.slice(end,start));const raw=match[0],address=raw.replace(/[.,!?;:]+$/g,"");let href="";try{const url=new URL(/^www\./i.test(address)?`https://${address}`:address);if(["http:","https:"].includes(url.protocol)&&url.hostname&&!url.username&&!url.password)href=url.href;}catch{}
 parts.push(href?<a key={start} href={href} target="_blank" rel="noopener noreferrer nofollow" className={styles.messageLink}>{address}</a>:address);parts.push(raw.slice(address.length));end=start+raw.length;
 }parts.push(text.slice(end));return <>{parts}</>;
}
export const attachmentUrl=(conversationId:string,fileId:string)=>`/api/messages/${conversationId}/files/${fileId}`;
export function MessageAttachments({conversationId,files}:{conversationId:string;files:ChatAttachment[]}){return <div className={styles.attachments}>{files.map(file=><div key={file.id} className={styles.attachment}>{file.mimeType.startsWith("image/")&&<a href={attachmentUrl(conversationId,file.id)} target="_blank" rel="noopener noreferrer" aria-label={`Open image ${file.fileName}`}><img src={attachmentUrl(conversationId,file.id)} alt={file.fileName} loading="lazy" className={styles.attachmentImage}/></a>}<a href={attachmentUrl(conversationId,file.id)+"?download=1"} className={styles.documentLink} download><FileText size={20}/><span><strong>{file.fileName}</strong><small>{fileSize(file.sizeBytes)} · Download</small></span><Download size={16}/></a></div>)}</div>;}
