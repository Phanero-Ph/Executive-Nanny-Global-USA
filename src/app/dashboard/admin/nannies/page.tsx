import {AdminDirectory} from "@/components/AdminDirectory";
export const dynamic="force-dynamic";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <AdminDirectory role="nanny" params={await searchParams}/>;}
