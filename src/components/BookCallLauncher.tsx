"use client";
import {useEffect,useRef,useState} from "react";
import {CalendarClock,X} from "lucide-react";
import {usePathname} from "next/navigation";
import {BookCallCalendar} from "@/components/BookCallCalendar";

export function BookCallLauncher(){
 const pathname=usePathname(),[open,setOpen]=useState(false),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),closeButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const element=dialog.current;if(!element)return;if(open){if(!element.open)element.showModal();closeButton.current?.focus();}else if(element.open)element.close();},[open]);
 if(pathname==="/book-a-call")return null;
 return <>
  <button ref={trigger} type="button" onClick={()=>setOpen(true)} className="fixed bottom-5 right-5 z-40 inline-flex min-h-14 items-center gap-2.5 rounded-full bg-ember-500 px-5 text-sm font-bold text-white shadow-[0_12px_36px_rgba(7,54,64,.32)] transition hover:-translate-y-0.5 hover:bg-ember-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-500 sm:bottom-7 sm:right-7" aria-haspopup="dialog" aria-expanded={open}>
   <CalendarClock size={19} aria-hidden="true"/><span>Book a Call</span>
  </button>
  {open&&<dialog ref={dialog} aria-labelledby="book-call-modal-title" aria-describedby="book-call-modal-description" onClose={()=>{setOpen(false);trigger.current?.focus();}} onClick={e=>{if(e.target===dialog.current)dialog.current?.close();}} className="fixed inset-0 m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-6xl overflow-y-auto rounded-3xl border-0 bg-cream-50 p-0 shadow-2xl backdrop:bg-ink-950/65 sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)]">
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cream-300 bg-cream-50/95 px-4 py-3 backdrop-blur sm:px-6"><div><h2 id="book-call-modal-title" className="text-xl font-extrabold text-ink-900 sm:text-2xl">Book a Call</h2><p id="book-call-modal-description" className="mt-0.5 text-xs text-slate-500 sm:text-sm">Choose a date and time that works for you.</p></div><button ref={closeButton} type="button" onClick={()=>dialog.current?.close()} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cream-300 bg-white text-ink-900 hover:bg-cream-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-brand" aria-label="Close Book a Call"><X size={19}/></button></div>
    <div className="p-3 sm:p-6"><BookCallCalendar/></div>
  </dialog>}
 </>;
}
