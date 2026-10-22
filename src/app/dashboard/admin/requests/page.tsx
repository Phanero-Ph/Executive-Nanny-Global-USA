import Dashboard from "../page";
export const dynamic="force-dynamic";
export default async function Requests({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const params=await searchParams;return <Dashboard searchParams={Promise.resolve({...params,kind:"family",section:"requests"})}/>;}
