import type { Mission } from './model';
export type Project = { id:string;name:string;description:string;folder:string;references:string };
export const DEFAULT_PROJECT:Project={id:'project-default',name:'나의 프로젝트',description:'',folder:'',references:''};
export function normalizeProjectData(input:{projects?:unknown;activeProjectId?:unknown;missions:Mission[]}){
  const seen=new Set<string>();
  const projects:Project[]=Array.isArray(input.projects)?input.projects.filter((p):p is Project=>{
    if(!p||typeof p.id!=='string'||!p.id||seen.has(p.id)||typeof p.name!=='string'||!p.name.trim()||typeof p.description!=='string'||typeof p.folder!=='string'||typeof p.references!=='string')return false;
    seen.add(p.id);return true;
  }):[];
  if(!projects.length)projects.push({...DEFAULT_PROJECT});
  const fallback=projects[0].id;
  return {projects,activeProjectId:projects.some(p=>p.id===input.activeProjectId)?input.activeProjectId as string:fallback,missions:input.missions.map(m=>projects.some(p=>p.id===m.projectId)?m:{...m,projectId:fallback})};
}
export function projectMissions(missions:Mission[],projectId:string){return missions.filter(m=>m.projectId===projectId);}
