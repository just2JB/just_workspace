import type { Employee } from './model';
import { EMPLOYEE_TEMPLATES } from './employeeTemplates.ts';
import type { Project } from './projects';

export type Assignment = { summary:string; details:string };
type TeamMate = { id:string; name:string; specialty:string; role:'총괄'|'팀원'; summary:string };
export type AgentContext = {
  version:1;
  agent:{id:string;name:string;specialty:string;missionRole:'총괄'|'팀원';baseInstructions:string;educationNotes:string[]};
  shared:{task:string;expectedResult:string;references:string;constraints:string;project?:Project};
  ownAssignment:Assignment;
  team:TeamMate[];
  guidelines:string[];
  reportTo:{id:string;name:string}|null;
  allAssignments?:Array<{id:string;name:string;assignment:Assignment}>;
};
export const LEAD_GUIDELINES = [
  '목표를 나누고 담당·완료 기준을 명확히 한다.',
  '독립적인 업무와 선행 결과가 필요한 업무를 구분한다.',
  '팀원의 결과에서 누락·충돌·근거·검증 내용을 확인한다.',
  '부족한 결과는 담당자에게 수정을 요청한다.',
  '최종 결과와 검증한 내용·남은 문제를 사용자에게 종합 보고한다.',
];
export const MEMBER_GUIDELINES = [
  '자신에게 배정된 범위를 수행하고 동료의 담당 영역을 임의로 바꾸지 않는다.',
  '다른 담당자의 결과가 필요하거나 업무가 막히면 총괄에게 알린다.',
  '결과와 함께 근거·검증 내용·미해결점을 제출한다.',
  '범위 변경이 필요하면 총괄에게 요청한다.',
  '완료 여부를 과장하지 않고 총괄에게 보고한다.',
];
export function defaultAssignment(e:Employee,isLead:boolean):Assignment {
  return isLead?{summary:'업무 분배 · 검토 · 최종 종합',details:'전체 요청을 구체적인 업무로 나누고, 팀원의 결과를 검토해 최종 결과와 남은 문제를 종합한다.'}:{summary:e.specialty,details:e.instructions||EMPLOYEE_TEMPLATES.find(t=>t.role===e.role)?.instructions||'전문 분야에 맞춰 담당 업무를 수행하고 결과와 근거를 총괄에게 제출한다.'};
}
export function buildMissionContexts(input:{employees:Employee[];leadId:string;memberIds:string[];task:string;assignments:Record<string,Assignment>;expectedResult?:string;references?:string;constraints?:string;project?:Project}):Record<string,AgentContext>{
  const ids=[input.leadId,...input.memberIds.filter(id=>id!==input.leadId)];
  if(new Set(ids).size!==ids.length)throw new Error('참여 별이 중복됩니다.');
  const team=ids.map(id=>{const e=input.employees.find(e=>e.id===id);if(!e)throw new Error('참여 별을 찾을 수 없습니다.');return e;});
  const lead=team[0];
  const assignments=Object.fromEntries(team.map(e=>{const fallback=defaultAssignment(e,e.id===lead.id),chosen=input.assignments[e.id];return[e.id,{summary:chosen?.summary.trim()||fallback.summary,details:chosen?.details.trim()||fallback.details}];}));
  return Object.fromEntries(team.map(e=>{
    const isLead=e.id===lead.id;
    const context:AgentContext={
      version:1,
      agent:{id:e.id,name:e.name,specialty:e.role,missionRole:isLead?'총괄':'팀원',baseInstructions:e.instructions||EMPLOYEE_TEMPLATES.find(t=>t.role===e.role)?.instructions||e.specialty,educationNotes:(e.notes||[]).map(n=>n.text)},
      shared:{task:input.task.trim(),expectedResult:input.expectedResult?.trim()||'담당 결과·근거·검증 내용·미해결점을 제출하고 총괄이 최종 보고한다.',references:input.references?.trim()||input.project?.references.trim()||'별도 자료 없음',constraints:input.constraints?.trim()||'목 시뮬레이션. 실제 AI 호출·파일 수정·외부 작업은 실행하지 않는다.',...(input.project?{project:{...input.project}}:{})},
      ownAssignment:{...assignments[e.id]},
      team:team.filter(other=>other.id!==e.id).map(other=>({id:other.id,name:other.name,specialty:other.role,role:other.id===lead.id?'총괄':'팀원',summary:assignments[other.id].summary})),
      guidelines:[...(isLead?LEAD_GUIDELINES:MEMBER_GUIDELINES)],
      reportTo:isLead?null:{id:lead.id,name:lead.name},
    };
    // Detailed assignments exist only in the lead's packet; teammates receive summaries.
    if(isLead)context.allAssignments=team.map(other=>({id:other.id,name:other.name,assignment:{...assignments[other.id]}}));
    return[e.id,context];
  }));
}
