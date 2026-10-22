"use client";
import {useAdminPermissions} from "./AdminPermissions";
import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from "react";
import {usePathname,useRouter} from "next/navigation";
import {roleChatEnabled,type ChatAccess} from "@/lib/chat-policy";
const Context=createContext<{settings:ChatAccess;role:string}>({settings:{familyEnabled:true,nannyEnabled:true},role:"admin"});
export function ChatAccessProvider({initial,role,children}:{initial:ChatAccess;role:string;children:ReactNode}){
 const [settings,setSettings]=useState(initial),last=useRef(initial),router=useRouter(),pathname=usePathname();
 useEffect(()=>{let active=true;async function update(){if(document.visibilityState!=="visible")return;try{const r=await fetch("/api/chat-access",{cache:"no-store"});if(!r.ok)return;const data=await r.json();if(active&&(last.current.familyEnabled!==data.familyEnabled||last.current.nannyEnabled!==data.nannyEnabled)){last.current=data;setSettings(data);router.refresh();}}catch{}}
 const timer=setInterval(update,15000);window.addEventListener("focus",update);window.addEventListener("egn-chat-settings",update);void update();return()=>{active=false;clearInterval(timer);window.removeEventListener("focus",update);window.removeEventListener("egn-chat-settings",update);};},[router]);
 useEffect(()=>{if(pathname.startsWith("/dashboard/messages")&&!roleChatEnabled(role,settings))router.replace(`/dashboard/${role}`);},[pathname,role,settings,router]);
 return <Context.Provider value={{settings,role}}>{children}</Context.Provider>;
}
export function useChatEnabled(targetRole?:string){const {settings,role}=useContext(Context);const {can}=useAdminPermissions();return roleChatEnabled(targetRole??role,settings)&&(role!=="admin"||(targetRole==="family"?can("messages.family"):targetRole==="nanny"?can("messages.nanny"):can("messages.family")||can("messages.nanny")));}
export function ChatOnly({children,role}:{children:ReactNode;role?:string}){return useChatEnabled(role)?<>{children}</>:null;}
