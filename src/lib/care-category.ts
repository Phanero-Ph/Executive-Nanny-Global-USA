/** Persistent legacy identifiers are deliberately preserved for existing requests. */
export const SUBSCRIPTION_CARE="nanny";
export const SALARY_FEE_CARE="caregiver";
export function careCategoryLabel(category:string){return category===SALARY_FEE_CARE?"Request a Nanny":"Request a Babysitter";}
