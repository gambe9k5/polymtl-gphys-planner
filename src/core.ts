import data from './curriculum.json' with {type:'json'};
import type {Catalogue, Plan, Placement, Issue, Validation, Progress} from './types.ts';

export const catalogue: Catalogue = data;
export const courses = Object.fromEntries(catalogue.courses.map(c => [c.code, c]));
const groups: [string, string, number][] = [
  ['required', 'Cours obligatoires', 96], ['technical', 'Options techniques', 6],
  ['math', 'Mathématiques de l’ingénieur', 12], ['project', 'Projet final', 6],
];
export const gradePoints: Record<string, number> = {'A*':4, A:4, 'B+':3.5, B:3, 'C+':2.5, C:2, 'D+':1.5, D:1, F:0};
const owns = (object: object, key: string) => Object.hasOwn(object, key);
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
export const termKey = (term: string) => Number(term.slice(0,4))*3 + ({H:0,E:1,A:2}[term.slice(-1)] ?? 0);
const finalTerm = (code: string, term: string) => courses[code].duration === 2 ? `${Number(term.slice(0,4))+1}-H` : term;
export function defaultPlan(): Plan {
  return {version:1,name:'Mon parcours en génie physique',terms:[...Array.from({length:4},(_,i)=>[`${2025+i}-H`,`${2025+i}-A`]).flat(),'2029-H'],placements:{},aliases:{}};
}
/** Accept the original version-1 export, validating everything before replacing state. */
export function checkPlan(raw: unknown): Plan {
  if (!record(raw) || raw.version !== 1) throw Error('Format de plan non reconnu (version 1 attendue).');
  if (typeof raw.name !== 'string' || !raw.name.trim() || raw.name.trim().length > 120) throw Error('Le nom du plan doit contenir de 1 à 120 caractères.');
  if (!Array.isArray(raw.terms) || raw.terms.length < 1 || raw.terms.length > 90) throw Error('Le plan doit contenir de 1 à 90 trimestres.');
  const terms = raw.terms;
  if (terms.some(t=>typeof t !== 'string' || !/^20\d\d-[HEA]$/.test(t))) throw Error('Trimestre invalide : format 2025-H, 2025-E ou 2025-A attendu.');
  if (new Set(terms).size !== terms.length) throw Error('Un trimestre est présent plusieurs fois.');
  if (!record(raw.placements) || Object.keys(raw.placements).some(c=>!owns(courses,c))) throw Error('Le plan contient un cours inconnu.');
  const placements: Record<string, Placement> = {};
  for (const [code,p] of Object.entries(raw.placements)) {
    if (!record(p) || !['planned','completed','credited','failed'].includes(String(p.status))) throw Error(`Statut invalide : ${code}.`);
    if (p.status === 'credited' ? p.term != null : typeof p.term !== 'string' || !terms.includes(p.term)) throw Error(`Trimestre manquant ou invalide : ${code}.`);
    const notes = p.notes ?? '', grade = p.grade === undefined ? '' : p.grade;
    if (typeof notes !== 'string' || notes.length > 4000 || p.notes === null) throw Error(`Notes invalides : ${code}.`);
    if (typeof grade !== 'string' || !(grade === '' || owns(gradePoints,grade) || ['S','P'].includes(grade))) throw Error(`Note en lettres invalide : ${code}.`);
    if (grade && p.status !== 'credited' && p.status !== (grade === 'F' ? 'failed' : 'completed')) throw Error(`La note et le statut ne concordent pas : ${code}.`);
    if (Object.keys(p).some(k=>!['status','term','notes','grade'].includes(k))) throw Error(`Champs non reconnus : ${code}.`);
    placements[code] = {status:p.status as Placement['status'],term:p.status === 'credited' ? null : p.term as string,...(p.notes !== undefined ? {notes} : {}),...(p.grade !== undefined ? {grade} : {})};
  }
  const inputAliases = raw.aliases === undefined ? {} : raw.aliases;
  if (!record(inputAliases) || Object.keys(inputAliases).length > 100) throw Error('Équivalences invalides.');
  const referenced = new Set(catalogue.courses.flatMap(c=>c.prerequisites.flat()));
  const aliases: Record<string,string> = {};
  for (const [source,target] of Object.entries(inputAliases)) {
    if (!referenced.has(source) || typeof target !== 'string' || !owns(courses,target) || source === target) throw Error(`Équivalence invalide : ${source}.`);
    aliases[source] = target;
  }
  return {version:1,name:raw.name.trim(),terms:[...terms].sort((a,b)=>termKey(a)-termKey(b)),placements,aliases};
}

export function validate(plan: Plan): Validation {
  const {placements, aliases} = plan;
  const issues: Issue[] = [];
  const termCredits: Record<string,number> = Object.fromEntries(plan.terms.map(t=>[t,0]));
  const issue = (course: string|null, kind: string, message: string, severity='error') => issues.push({course,kind,message,severity});
  function available(code:string, when:number, sameTerm=false, useAlias=true): boolean {
    return [code,...(useAlias && aliases[code] ? [aliases[code]] : [])].some(candidate=>{
      const p = placements[candidate];
      if (!p || p.status === 'failed') return false;
      if (p.status === 'credited') return true;
      const end = termKey(finalTerm(candidate,p.term!));
      return end < when || (sameTerm && end === when);
    });
  }
  for (const [code,p] of Object.entries(placements)) {
    const c = courses[code];
    if (p.status === 'credited') continue;
    const term=p.term!, when=termKey(term);
    if (c.duration === 2) {
      const end=finalTerm(code,term);
      termCredits[term] += 3;
      if (owns(termCredits,end)) termCredits[end] += 3;
      else issue(code,'duration',`Ajouter le trimestre ${end} pour la seconde partie du projet.`);
    } else termCredits[term] += c.credits;
    if (p.status === 'failed') {issue(code,'failed','Échec enregistré : ce cours ne satisfait pas les exigences ni les préalables.');continue;}
    // Recorded historical successes are accepted, without auditing enrolment again.
    if (p.status === 'completed') continue;
    if (c.terms.length && !c.terms.includes(term.slice(-1))) issue(code,'offering','Offert en '+c.terms.map(s=>({A:'automne',H:'hiver',E:'été'}[s])).join(', ')+'.');
    for (const group of c.prerequisites) if (!group.some(x=>available(x,when))) issue(code,'prerequisite',`Préalable requis avant ce trimestre : ${group.join(' ou ')}.`);
    for (const group of c.corequisites) {
      const listed=group.filter(x=>owns(courses,x));
      if (listed.length && !listed.some(x=>available(x,when,true,false))) issue(code,'corequisite',`Corequis à suivre avant ou pendant ce trimestre : ${listed.join(' ou ')}.`);
    }
    if (c.minimumCredits) {
      const prior=Object.keys(placements).filter(x=>available(x,when,false,false)).reduce((n,x)=>n+courses[x].credits,0);
      if (prior < c.minimumCredits) issue(code,'credits',`${c.minimumCredits} crédits préalables requis; ${prior} placés avant ce trimestre.`);
    }
  }
  const progress: Progress[] = groups.map(([id,label,target])=>{
    const members=catalogue.courses.filter(c=>c.group === id);
    const assigned=members.filter(c=>placements[c.code] && placements[c.code].status !== 'failed');
    const planned=assigned.reduce((n,c)=>n+c.credits,0);
    const earned=assigned.filter(c=>['completed','credited'].includes(placements[c.code].status)).reduce((n,c)=>n+c.credits,0);
    if (planned>target) issue(null,'excess',`${label} : ${planned} crédits sélectionnés pour ${target} requis. Les crédits excédentaires ne remplacent pas les autres blocs.`,'warning');
    return {id,label,target,planned:Math.min(target,planned),earned:Math.min(target,earned),selected:planned,remaining:Math.max(0,target-planned),missing:['required','project'].includes(id)?members.filter(c=>!assigned.includes(c)).map(c=>c.code):[]};
  });
  const graded=Object.entries(placements).filter(([,p])=>['completed','failed'].includes(p.status) && owns(gradePoints,p.grade || ''));
  const gpaCredits=graded.reduce((n,[code])=>n+courses[code].credits,0);
  const points=graded.reduce((n,[code,p])=>n+courses[code].credits*gradePoints[p.grade!],0);
  const errors=issues.filter(i=>i.severity === 'error').length;
  return {issues,errors,progress,termCredits,cgpa:gpaCredits?points/gpaCredits:null,gpaCredits,gradedCourses:graded.length,
    plannedCredits:progress.reduce((n,g)=>n+g.planned,0),earnedCredits:progress.reduce((n,g)=>n+g.earned,0),
    scheduledCredits:Object.keys(placements).reduce((n,c)=>n+courses[c].credits,0),
    requirementsCovered:progress.every(g=>g.planned === g.target),degreeCompleted:progress.every(g=>g.earned === g.target),conflictFree:errors === 0};
}
