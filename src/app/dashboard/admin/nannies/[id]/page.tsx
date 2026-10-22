import {AdminAccountProfile} from "@/components/AdminAccountProfile";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <AdminAccountProfile id={id} role="nanny"/>;}
