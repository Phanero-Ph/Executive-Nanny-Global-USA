"use client";
import {useEffect,useState} from "react";
export type AgencyFees={searchCents:number;searchStatus?:string;placementCents:number|null;placementStatus?:string;placementRateBps:number;annualSalaryCents?:number|null;candidateName?:string|null;matchId?:string|null;quoteRevision?:number;quoteLocked?:boolean;placementReady?:boolean;legacyFixedFee?:boolean};
export function useAgencyFees(requestId?:string){
 const [fees,setFees]=useState<AgencyFees|null>(null),[error,setError]=useState(false);
 useEffect(()=>{let active=true;fetch(`/api/fees${requestId?`?requestId=${encodeURIComponent(requestId)}`:""}`,{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{if(active){setFees(data);setError(false);}}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[requestId]);
 return {fees,error};
}
