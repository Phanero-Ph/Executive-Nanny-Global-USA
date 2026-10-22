export const CHAT_STAGING_MS=24*60*60*1000;
export const CHAT_FILE_LIMIT=10*1024*1024;
export const CHAT_MESSAGE_FILE_LIMIT=25*1024*1024;
export const CHAT_MAX_FILES=5;
export const CHAT_ACCEPT=".jpg,.jpeg,.png,.webp,.pdf,.docx,.txt";
export const CHAT_UPLOAD_HELP="JPG, PNG, WebP, PDF, Word (.docx) or TXT · 10 MB each · 5 files / 25 MB per message";
export type ChatAttachment={id:string;fileName:string;mimeType:string;sizeBytes:number};
export function fileSize(bytes:number){return bytes>=1024*1024?`${(bytes/(1024*1024)).toFixed(1)} MB`:`${Math.max(1,Math.ceil(bytes/1024))} KB`;}
