import {createHash} from "node:crypto";
import {SCREENING_CHECKS,type ReferenceReview} from "./screening-labels";
export {SCREENING_CHECKS,type ReferenceReview} from "./screening-labels";
export function applicationDigest(bio:string|null){return createHash("sha256").update(bio||"").digest("hex");}
export type AgencyBackgroundCheck={status:"pending"|"clear"|"needs_follow_up";completedOn:string;expiresOn:string;evidence:string};
function validDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function backgroundCheckEligible(checks:Record<string,unknown>,through=new Date()){
 const status=checks.backgroundCheckStatus,completedOn=checks.backgroundCheckCompletedOn,expiresOn=checks.backgroundCheckExpiresOn,evidence=checks.backgroundCheckEvidence;
 const today=new Date().toISOString().slice(0,10),throughDate=through.toISOString().slice(0,10);
 return status==="clear"&&typeof completedOn==="string"&&validDate(completedOn)&&completedOn<=today&&typeof expiresOn==="string"&&validDate(expiresOn)&&expiresOn>=throughDate&&typeof evidence==="string"&&!!evidence.trim();
}
export function screeningComplete(checks:Record<string,unknown>,references:ReferenceReview[]){return Object.keys(SCREENING_CHECKS).every(key=>checks[key]===true)&&backgroundCheckEligible(checks)&&references.length>=2&&references.every(row=>row.status==="verified"&&row.note.trim().length>0);}
