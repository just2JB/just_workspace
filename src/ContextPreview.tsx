import type { AgentContext } from './missionContext';
export default function ContextPreview({contexts}:{contexts?:Record<string,AgentContext>}){
  if(!contexts||!Object.keys(contexts).length)return <p className="education-status">이전 미션에는 컨텍스트 기록이 없어요.</p>;
  return <div className="context-preview">{Object.values(contexts).map(c=><details key={c.agent.id} className="context-agent"><summary><strong>{c.agent.name}</strong><span>{c.agent.missionRole} · {c.agent.specialty}</span></summary><div className="context-body">
    <h4>전체 업무</h4><p>{c.shared.task||'업무 내용을 입력하세요.'}</p>
    {c.shared.project?<><h4>프로젝트 · 시작 시 정보</h4><strong>{c.shared.project.name}</strong><p>{c.shared.project.description||'설명 없음'}</p><h4>작업 폴더</h4><p>{c.shared.project.folder||'지정 안 됨'}</p></>:null}
    <h4>내 담당 업무</h4><strong>{c.ownAssignment.summary}</strong><p>{c.ownAssignment.details}</p>
    <h4>완료 기준</h4><p>{c.shared.expectedResult}</p>
    <h4>함께하는 팀</h4><ul>{c.team.map(t=><li key={t.id}><b>{t.name} · {t.role}</b><p>{t.summary}</p></li>)}</ul>
    {c.allAssignments?<><h4>전체 상세 분배 내역 · 총괄 전용</h4><ul>{c.allAssignments.map(a=><li key={a.id}><b>{a.name}: {a.assignment.summary}</b><p>{a.assignment.details}</p></li>)}</ul></>:null}
    <h4>{c.agent.missionRole} 가이드</h4><ul>{c.guidelines.map(g=><li key={g}>{g}</li>)}</ul>
    <h4>기본 직무 지침</h4><p>{c.agent.baseInstructions}</p>
    <h4>교육 메모 · 이 별의 메모만 포함</h4>{c.agent.educationNotes.length?<ul>{c.agent.educationNotes.map((n,i)=><li key={i}>{n}</li>)}</ul>:<p>저장된 메모 없음</p>}
    <h4>참고 자료</h4><p>{c.shared.references}</p><h4>제약</h4><p>{c.shared.constraints}</p>
    <h4>보고 대상</h4><p>{c.reportTo?`${c.reportTo.name} · 총괄`:'사용자 · 최종 보고'}</p>
  </div></details>)}</div>;
}
