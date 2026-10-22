export const PERMISSION_GROUPS=[
 {label:"Families & requests",items:[["families.view","View families and requests"],["families.edit","Edit family contact details"],["families.review","Review requests and update status"]]},
 {label:"Nannies",items:[["nannies.view","View profiles, applications and documents"],["nannies.edit","Edit nanny contact details"],["nannies.approve","Screen and approve applications"]]},
 {label:"Matching & placements",items:[["matching.view","View matching and booking records"],["matching.manage","Manage shortlists, bookings and placements"]]},
 {label:"Credentials",items:[["credentials.view","View credentials and private documents"],["credentials.review","Verify, return or revoke credentials"]]},
 {label:"Payments",items:[["payments.view","View payment and membership records"],["payments.manage","Manage memberships and recorded receipts"]]},
 {label:"Training",items:[["training.view","View courses, trainees and certificates"],["training.manage","Manage courses and review trainees"]]},
 {label:"Messages",items:[["messages.family","Access family conversations and files"],["messages.nanny","Access nanny conversations and files"]]},
 {label:"Reports",items:[["reports.view","View agency reports"],["reports.export","Export reports and payment data"]]},
 {label:"Settings",items:[["settings.fees","Edit nanny fees"],["settings.chat","Control chat availability"]]},
 {label:"Administrator accounts",items:[["admins.manage","Invite admins, assign permissions and suspend access"]]},
] as const;
export const ALL_PERMISSIONS=PERMISSION_GROUPS.flatMap(g=>g.items.map(p=>p[0]));
export type AdminPermission=typeof ALL_PERMISSIONS[number];
const dependencies:Partial<Record<AdminPermission,AdminPermission[]>>={"families.edit":["families.view"],"families.review":["families.view"],"nannies.edit":["nannies.view"],"nannies.approve":["nannies.view"],"matching.view":["families.view","nannies.view"],"matching.manage":["matching.view"],"credentials.view":["nannies.view"],"credentials.review":["credentials.view"],"payments.view":["families.view"],"payments.manage":["payments.view"],"training.manage":["training.view"],"reports.export":["reports.view"]};
export function normalizePermissions(input:readonly string[]):AdminPermission[]{const result=new Set<AdminPermission>();function add(key:AdminPermission){if(result.has(key))return;result.add(key);for(const dep of dependencies[key]??[])add(dep);}for(const p of input)if(ALL_PERMISSIONS.includes(p as AdminPermission))add(p as AdminPermission);return ALL_PERMISSIONS.filter(p=>result.has(p));}
export const ADMIN_PRESETS:Record<string,AdminPermission[]>={
 "Recruitment Manager":normalizePermissions(["families.edit","families.review","nannies.edit","nannies.approve","matching.manage","credentials.review","messages.family","messages.nanny"]),
 "Finance":normalizePermissions(["payments.manage","reports.export","settings.fees"]),
 "Support":normalizePermissions(["families.view","nannies.view","messages.family","messages.nanny"]),
 "Training Manager":normalizePermissions(["training.manage","nannies.view","messages.nanny"]),
 "Custom":[],
};
export type AdminGrant={superAdmin:boolean;permissions:AdminPermission[]};
export function grantAllows(grant:AdminGrant|null|undefined,permission:AdminPermission){return !!grant&&(grant.superAdmin||grant.permissions.includes(permission));}
export function adminNavPermission(href:string):AdminPermission|null{const path=href.split("?")[0];if(path.includes("/settings"))return null;if(path.includes("/nannies")||path.includes("/applications"))return "nannies.view";if(path.includes("/families")||path.includes("/requests"))return "families.view";if(path.includes("/matching")||path.includes("/bookings"))return "matching.view";if(path.includes("/credentials"))return "credentials.view";if(path.includes("/payments"))return "payments.view";if(path.includes("/training"))return "training.view";if(path.includes("/reports"))return "reports.view";return null;}
