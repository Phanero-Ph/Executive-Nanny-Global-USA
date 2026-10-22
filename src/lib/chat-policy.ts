export type ChatAccess={familyEnabled:boolean;nannyEnabled:boolean};
export function roleChatEnabled(role:string,settings:ChatAccess){return role==="admin"||role==="family"&&settings.familyEnabled||role==="nanny"&&settings.nannyEnabled;}
