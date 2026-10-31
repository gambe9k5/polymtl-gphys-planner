import {checkPlan, defaultPlan} from './core.ts';
import type {Plan} from './types.ts';
// GitHub project sites share an origin: scope the key to the site's directory.
export const storageKey = () => `curriculum-planner:v1:${new URL('.',location.href).pathname}`;
export function loadPlan(): {plan:Plan;error?:string} {
  try {
    const text=localStorage.getItem(storageKey());
    return {plan:text ? checkPlan(JSON.parse(text)) : defaultPlan()};
  } catch {
    return {plan:defaultPlan(),error:'Le plan mémorisé ne peut pas être restauré. Importez une copie JSON ou exportez vos modifications pour les conserver.'};
  }
}
export function savePlan(plan:Plan) {localStorage.setItem(storageKey(),JSON.stringify(plan));}
