export type Course={code:string;title:string;credits:number;terms:string[];prerequisites:string[][];corequisites:string[][];minimumCredits:number;group:string;category:string;description:string;notes:string[];duration:number};
export type Placement={term:string|null;status:'planned'|'completed'|'credited'|'failed';notes?:string;grade?:string};
export type Plan={version:number;name:string;terms:string[];placements:Record<string,Placement>;aliases:Record<string,string>};
export type Issue={course:string|null;kind:string;message:string;severity:string};
export type Progress={id:string;label:string;target:number;planned:number;earned:number;selected:number;remaining:number;missing:string[]};
export type Validation={cgpa:number|null;gpaCredits:number;gradedCourses:number;issues:Issue[];errors:number;progress:Progress[];termCredits:Record<string,number>;plannedCredits:number;earnedCredits:number;scheduledCredits:number;requirementsCovered:boolean;degreeCompleted:boolean;conflictFree:boolean};
export type Catalogue={courses:Course[];colours:Record<string,string>;source:string;sourceDate:string};
