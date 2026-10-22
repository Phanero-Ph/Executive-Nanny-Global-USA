import {hasPaidFamilyMembership} from "@/lib/family-membership";
import {FamilyAccessNotice} from "./FamilyAccessNotice";
export async function FamilySubscriptionNotice({userId,subscribed}:{userId:string;subscribed?:boolean}){if(subscribed??await hasPaidFamilyMembership(userId))return null;return <FamilyAccessNotice/>;}
