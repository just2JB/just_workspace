import type { Employee } from './model';
import type { Assignment } from './missionContext';
import { defaultAssignment } from './missionContext';
type Props={employees:Employee[];leadId:string;memberIds:string[];assignments:Record<string,Assignment>;onChange:(id:string,value:Assignment)=>void;expectedResult:string;onExpected:(value:string)=>void};
export default function MissionBrief({employees,leadId,memberIds,assignments,onChange,expectedResult,onExpected}:Props){
  const team=[leadId,...memberIds.filter(id=>id!==leadId)].flatMap(id=>{const e=employees.find(e=>e.id===id);return e?[e]:[];});
  return <details className="mission-brief"><summary>담당 업무와 완료 기준 설정 <span>목 분배안</span></summary><div>
    <label className="field-label" htmlFor="mission-expected">공통 완료 기준</label><textarea id="mission-expected" value={expectedResult} maxLength={1500} onChange={e=>onExpected(e.target.value)} placeholder="예: 문제점·이유·수정안 표와 최종 요약 제출"/>
    {team.map(e=>{const a=assignments[e.id]||defaultAssignment(e,e.id===leadId);return <fieldset key={e.id}><legend>{e.name} · {e.id===leadId?'총괄':'팀원'}</legend><label className="field-label" htmlFor={`assignment-summary-${e.id}`}>담당 요약 · 동료에게 공유</label><input id={`assignment-summary-${e.id}`} value={a.summary} maxLength={160} onChange={ev=>onChange(e.id,{...a,summary:ev.target.value})}/><label className="field-label" htmlFor={`assignment-detail-${e.id}`}>상세 지시 · 본인과 총괄에게 전달</label><textarea id={`assignment-detail-${e.id}`} value={a.details} maxLength={3000} onChange={ev=>onChange(e.id,{...a,details:ev.target.value})}/></fieldset>;})}
  </div></details>;
}
