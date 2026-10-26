import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, Check, CheckCheck, ChevronRight, CircleHelp, FolderClosed, Orbit, Plus, Settings2, X } from 'lucide-react';
import Universe, { StarIcon } from './Universe';
import { activeFor, average, completeExpired, DURATION, KEY, readWorkspace, recentCount } from './model';
import type { Employee, Mission } from './model';
import Education from './Education';
import NewStarForm from './NewStarForm';
import type { EmployeeTemplate } from './employeeTemplates';
import { buildMissionContexts } from './missionContext';
import type { Assignment } from './missionContext';
import ContextPreview from './ContextPreview';
import MissionBrief from './MissionBrief';
import MissionDashboard from './MissionDashboard';
import { recordInstruction } from './missionMessages';
import { missionIdFromHash } from './missionRoute';
import ProjectManager from './ProjectManager';
import { normalizeProjectData, projectMissions } from './projects';
import type { Project } from './projects';

type Modal = 'mission' | 'employee' | 'education' | 'context' | 'projects' | 'results' | 'settings' | null;
const formatDate = (n: number) => new Intl.DateTimeFormat('ko-KR', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'Asia/Seoul' }).format(n);
function phase(m: Mission, now: number) { const t = now-m.started; return t < 1800 ? '팀을 모으고 있어요' : t < 7500 ? '각자의 업무를 수행하고 있어요' : '총괄이 결과를 검토하고 있어요'; }
function ModalFrame({ title, sub, children, close }: { title: string; sub?: string; children: React.ReactNode; close: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{ const previous=document.activeElement as HTMLElement; ref.current?.focus(); const listener=(e:KeyboardEvent)=>{if(e.key==='Escape')close();if(e.key==='Tab'){const nodes=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea, select, summary, [tabindex="0"]')||[]);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}; document.addEventListener('keydown',listener);return()=>{document.removeEventListener('keydown',listener);previous?.focus();};},[close]);
  return <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)close();}}><div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}><header><div><h2>{title}</h2>{sub?<p>{sub}</p>:null}</div><button className="icon-button" aria-label="닫기" onClick={close}><X size={19}/></button></header>{children}</div></div>;
}
export default function App() {
  const [storedData,setData]=useState(readWorkspace);
  const data=storedData.projects?.length?storedData:{...storedData,...normalizeProjectData(storedData)};
  useEffect(()=>{if(!storedData.projects?.length)setData(prev=>({...prev,...normalizeProjectData(prev)}));},[storedData.projects]);
  const [selected,setSelected]=useState<string|null>(null);
  const [modal,setModal]=useState<Modal>(null);
  const [now,setNow]=useState(Date.now);
  const [toast,setToast]=useState('');
  const [storageError,setStorageError]=useState(false);
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [title,setTitle]=useState('');
  const [lead,setLead]=useState('jiu');
  const [members,setMembers]=useState<string[]>(['seoyeon','doyun']);
  const [resultId,setResultId]=useState<string|null>(null);
  const [formError,setFormError]=useState('');
  const [assignments,setAssignments]=useState<Record<string,Assignment>>({});
  const [expectedResult,setExpectedResult]=useState('');
  const [contextMissionId,setContextMissionId]=useState<string|null>(null);
  const [dashboardId,setDashboardId]=useState(()=>missionIdFromHash(window.location.hash));
  const closeRef=useRef(()=>setModal(null));
  const close=closeRef.current;
  const active=data.missions.filter(m=>!m.ended);
  const completed=data.missions.filter(m=>m.ended&&!m.cancelled);
  const activeProject=data.projects.find(p=>p.id===data.activeProjectId)||data.projects[0];
  const visibleActive=projectMissions(active,activeProject.id);
  const visibleCompleted=projectMissions(completed,activeProject.id);
  const employee=data.employees.find(e=>e.id===selected);
  const dashboardMission=data.missions.find(m=>m.id===dashboardId);
  const contextInput={employees:data.employees,leadId:lead,memberIds:members.filter(id=>id!==lead),task:title,assignments,expectedResult,project:activeProject};
  const previewContexts=modal==='mission'?buildMissionContexts(contextInput):undefined;
  useEffect(()=>{const navigate=()=>setDashboardId(missionIdFromHash(window.location.hash));window.addEventListener('hashchange',navigate);return()=>window.removeEventListener('hashchange',navigate);},[]);
  function openDashboard(id:string){setModal(null);window.location.hash=`/missions/${encodeURIComponent(id)}`;}
  function backToUniverse(){window.location.hash='';}
  function switchProject(id:string){setData(prev=>({...prev,activeProjectId:id}));setSelected(null);backToUniverse();}
  function saveProject(input:Omit<Project,'id'>,existingId?:string){
    const id=existingId||crypto.randomUUID(),project={id,...input};
    setData(prev=>({...prev,projects:existingId?(prev.projects||data.projects).map(p=>p.id===id?project:p):[...(prev.projects||data.projects),project],activeProjectId:id}));
    setSelected(null);setModal(null);backToUniverse();setToast(`${project.name} 프로젝트를 선택했어요.`);
  }
  function stopMission(id:string){setData(prev=>({...prev,missions:prev.missions.map(m=>m.id===id&&!m.ended?{...m,ended:Date.now(),cancelled:true}:m)}));setToast('미션을 중단했어요. 별들이 복귀해요.');}
  function sendInstruction(missionId:string,receiver:string,text:string){const sent=Date.now(),id=crypto.randomUUID();setData(prev=>({...prev,missions:prev.missions.map(m=>m.id===missionId?recordInstruction(m,receiver,text,sent,id,DURATION):m)}));}
  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(data));setStorageError(false);}catch{setStorageError(true);}},[data]);
  useEffect(()=>{if(!active.length)return;const id=setInterval(()=>{const t=Date.now();setNow(t);setData(prev=>{const missions=completeExpired(prev.missions,t);return missions===prev.missions?prev:{...prev,missions};});},100);return()=>clearInterval(id);},[active.length]);
  const lastCompleted=useRef(completed.length);
  useEffect(()=>{if(completed.length>lastCompleted.current)setToast('미션 완료! 별들이 각자의 자리로 돌아왔어요.');lastCompleted.current=completed.length;},[completed.length]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(t);},[toast]);
  function openMission() {
    const available=data.employees.filter(e=>!activeFor(data.missions,e.id));
    if(available.length<2){setToast('대기 중인 별이 2개 이상 필요해요.');return;}
    const defaultLead=data.employees.find(e=>e.role==='총괄')?.id||available[0].id;
    setLead(defaultLead);
    setMembers(available.filter(e=>e.id!==defaultLead).map(e=>e.id));
    setTitle('');
    setAssignments({});setExpectedResult('');
    setFormError(activeFor(data.missions,defaultLead)?'기본 총괄이 작업 중이에요. 이번 미션의 총괄을 다른 별로 선택해주세요.':'');
    setModal('mission');
  }
  function startMission(e:React.FormEvent) { e.preventDefault(); if(!title.trim()){setFormError('맡길 업무를 입력해주세요.');return;}const chosen=members.filter(id=>id!==lead);if(!chosen.length){setFormError('함께할 별을 1개 이상 선택해주세요.');return;}if([lead,...chosen].some(id=>activeFor(data.missions,id))){setFormError('선택한 별이 이미 다른 업무를 수행 중이에요.');return;}const m:Mission={id:crypto.randomUUID(),title:title.trim(),lead,members:chosen,started:Date.now(),ratings:{},messageMode:'mock',messages:[],projectId:activeProject.id,project:{...activeProject},contexts:buildMissionContexts(contextInput)};setData(prev=>({...prev,missions:[m,...prev.missions]}));setNow(Date.now());setSelected(lead);setModal(null);setToast('미션 시작! 총괄의 궤도로 별들이 모여요.'); }
  function createEmployee(name:string,template:EmployeeTemplate) {
    const id=crypto.randomUUID();
    const item:Employee={id,name,role:template.role,specialty:template.specialty,templateId:template.id,instructions:template.instructions,notes:[],model:'Mock · 시뮬레이터',x:.1+Math.random()*.8,y:.3+Math.random()*.38,shape:data.employees.length%4};
    setData(prev=>({...prev,employees:[...prev.employees,item]}));setSelected(id);setModal(null);setToast(`${name}, 새로운 별이 합류했어요.`);
  }
  function saveMemory(employeeId:string,text:string,noteId?:string){
    if(!text.trim())return;
    const timestamp=Date.now();
    setData(prev=>({...prev,employees:prev.employees.map(e=>e.id!==employeeId?e:{...e,notes:noteId?(e.notes||[]).map(n=>n.id===noteId?{...n,text:text.trim(),updated:timestamp}:n):[...(e.notes||[]),{id:crypto.randomUUID(),text:text.trim(),created:timestamp,updated:timestamp}]})}));
  }
  function deleteMemory(employeeId:string,noteId:string){setData(prev=>({...prev,employees:prev.employees.map(e=>e.id===employeeId?{...e,notes:(e.notes||[]).filter(n=>n.id!==noteId)}:e)}));}
  function rate(missionId:string,employeeId:string,field:'user'|'lead',value:string) {setData(prev=>({...prev,missions:prev.missions.map(m=>m.id===missionId?{...m,ratings:{...m.ratings,[employeeId]:{...m.ratings[employeeId],[field]:value?Number(value):undefined}}}:m)}));}
  function download(m:Mission) {const text=`[목 시뮬레이션 결과 · 실제 AI 출력 아님]\n업무: ${m.title}\n총괄: ${data.employees.find(e=>e.id===m.lead)?.name}\n참여: ${m.members.map(id=>data.employees.find(e=>e.id===id)?.name).join(', ')}\n수행 시간: 10초\n완료: ${formatDate(m.ended!)}\n\n업무 분배 → 수행 → 검토 → 복귀 흐름을 시뮬레이션했습니다.\n실제 문서 생성이나 AI 검토는 실행하지 않았습니다.\n`;const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`mission-${m.id.slice(0,8)}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
  const result=data.missions.find(m=>m.id===resultId&&m.ended&&!m.cancelled);
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#" onClick={e=>{e.preventDefault();setSelected(null);backToUniverse();}}><StarIcon small/><span>just workspace<span className="brand-period">.</span></span></a><div className="project-picker"><label className="sr-only" htmlFor="active-project">현재 프로젝트</label><select id="active-project" value={activeProject.id} onChange={e=>switchProject(e.target.value)}>{data.projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="icon-button" aria-label="프로젝트 관리" onClick={()=>setModal('projects')}><Settings2 size={15}/></button></div><div className="topbar-right"><span className="mock-badge">MOCK MODE</span><button className="icon-button" aria-label="설정" onClick={()=>setModal('settings')}><Settings2 size={17}/></button></div></header>
    {dashboardId?(dashboardMission?<MissionDashboard key={dashboardMission.id} mission={dashboardMission} employees={data.employees} now={now} onBack={backToUniverse} onCancel={()=>stopMission(dashboardMission.id)} onResults={()=>{setResultId(dashboardMission.id);setModal('results');}} onInstruction={(receiver,text)=>sendInstruction(dashboardMission.id,receiver,text)}/>:<main className="mission-dashboard"><p>업무를 찾을 수 없어요.</p><button className="outline-button" onClick={backToUniverse}>우주로 돌아가기</button></main>):<main className="main-layout">
      <section className="space-area" aria-label="나의 AI 우주"><Universe employees={data.employees} missions={data.missions} selected={selected} onSelect={setSelected} onMove={(id,x,y)=>setData(prev=>({...prev,employees:prev.employees.map(e=>e.id===id?{...e,x,y}:e)}))} reduced={reduced} onMission={openMission}/><div className="crew-dock"><div className="dock-label"><Orbit size={14}/><span>MY STARS</span><b>{data.employees.length.toString().padStart(2,'0')}</b></div><div className="dock-stars">{data.employees.map(e=><button key={e.id} className={`dock-star ${selected===e.id?'selected':''}`} onClick={()=>setSelected(selected===e.id?null:e.id)} aria-label={`${e.name} 상세 정보`} aria-pressed={selected===e.id}><StarIcon small role={e.role}/><span>{e.name}</span>{activeFor(data.missions,e.id)?<i className="live-dot"/>:null}</button>)}</div><button className="dock-add icon-button" aria-label="새로운 별 만들기" onClick={()=>{setModal('employee');}}><Plus size={17}/></button></div></section>
      <aside className="sidebar">
        <div className="sidebar-scroll">
          <div className="panel-heading"><div><span className="tiny-label">CONTROL ROOM</span><h2>{employee?'별의 프로필':'워크스페이스'}</h2></div>{employee?<button className="icon-button" aria-label="프로필 닫기" onClick={()=>setSelected(null)}><X size={17}/></button>:<Orbit size={20} strokeWidth={1}/>}</div>
          {employee?<><div className="profile"><div className="profile-star"><StarIcon role={employee.role}/></div><h3>{employee.name}</h3><span className="role-tag">{employee.role}</span><p>{employee.specialty}</p></div><dl className="detail-list"><div><dt>사용 모델</dt><dd>{employee.model}</dd></div><div><dt>현재 상태</dt><dd><span className="live-dot"/>{activeFor(data.missions,employee.id)?'궤도에서 작업 중':'자유 궤도 · 대기 중'}</dd></div></dl><div className="performance"><span className="tiny-label">LAST 7 DAYS</span><div><span>최근 완료한 업무</span><strong>{recentCount(data.missions,employee.id)}<small>건</small></strong></div><div className="score-pair"><div><span>내 평가</span><b>{average(data.missions,employee.id,'user')}<small> / 5</small></b></div><div><span>총괄 평가 <small>(목)</small></span><b>{average(data.missions,employee.id,'lead')}<small> / 5</small></b></div></div><p>완료된 업무를 평가하면 평균이 표시돼요.</p></div><button className="outline-button full education-open" onClick={()=>setModal('education')}>교육 · 메모 ({employee.notes?.length||0})</button><button className="outline-button full" onClick={()=>{setModal('results');setResultId(null);}}>작업 기록과 평가 보기 <ArrowRight size={14}/></button><div className="section-divider"/></>:<><button className="white-button full" onClick={()=>{setModal('employee');}}><Plus size={16}/> 새로운 별 만들기</button><div className="section-divider"/></>}
          <div className="section-title"><h3>업무 현황</h3><span className="count">{visibleActive.length}</span></div>
          {visibleActive.length?<div className="active-list">{visibleActive.map(m=>{const progress=Math.min(100,Math.max(0,(now-m.started)/DURATION*100));return <article className="active-mission" key={m.id}><button className="mission-card-open" onClick={()=>openDashboard(m.id)} aria-label={`${m.title} 업무 대시보드 열기`}><div className="mission-state"><span className="live-dot"/> {phase(m,now)}<span>{Math.max(0,Math.ceil((m.started+DURATION-now)/1000))}s</span></div><h4>{m.title}</h4><p>{data.employees.find(e=>e.id===m.lead)?.name} 총괄 · 별 {m.members.length+1}개</p><div className="progress-track"><div style={{width:`${progress}%`}}/></div></button><button className="text-button" onClick={()=>{setContextMissionId(m.id);setModal('context');}}>전달 컨텍스트 (목)</button><button className="text-button" onClick={()=>{setData(prev=>({...prev,missions:prev.missions.map(x=>x.id===m.id?{...x,ended:Date.now(),cancelled:true}:x)}));setToast('미션을 중단했어요. 별들이 복귀해요.');}}>업무 중단</button></article>;})}</div>:<div className="empty-state"><div className="empty-orbit"><Orbit size={33} strokeWidth={.8}/><i/></div><strong>진행 중인 업무 없음</strong><button className="text-button" onClick={openMission}>첫 업무 맡기기 <ArrowRight size={13}/></button></div>}
          {visibleCompleted.length?<div className="recent-result"><div className="section-title"><h3>최근 도착한 결과</h3><CheckCheck size={16}/></div><button onClick={()=>{setResultId(visibleCompleted[0].id);setModal('results');}}><span>{visibleCompleted[0].title}</span><ChevronRight size={16}/></button><small>10초 목 시뮬레이션 완료</small></div>:null}

        </div>
        <footer className="sidebar-footer"><button onClick={()=>{setResultId(null);setModal('results');}}><FolderClosed size={16}/>결과함<span>{visibleCompleted.length}</span></button><button aria-label="연결 설정" onClick={()=>setModal('settings')}><Settings2 size={16}/></button><p><span className="live-dot"/> LOCAL WORKSPACE <span>v0.1</span></p></footer>
      </aside>
    </main>}
    {storageError?<div className="storage-warning" role="status">브라우저 저장이 제한되어 현재 세션에서만 유지돼요.</div>:null}
    {toast?<div className="toast" role="status"><Check size={15}/>{toast}</div>:null}
    {modal==='mission'?<ModalFrame title="새로운 미션" sub="총괄 별과 함께할 팀을 선택하세요." close={close}><form onSubmit={startMission}><div className="mission-project-summary"><strong>{activeProject.name}</strong><p>{activeProject.description||'프로젝트 설명 없음'}</p><small>{activeProject.folder||'작업 폴더 미지정'}</small></div><label className="field-label" htmlFor="mission-title">어떤 일을 맡길까요?</label><textarea id="mission-title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={500} placeholder="예: 새 서비스의 기획서를 검토하고 디자인 방향 정리하기" required/><label className="field-label" htmlFor="lead">총괄 별</label><select id="lead" value={lead} onChange={e=>{setLead(e.target.value);setFormError('');setMembers(prev=>prev.filter(x=>x!==e.target.value));}}>{data.employees.map(e=><option key={e.id} value={e.id} disabled={!!activeFor(data.missions,e.id)}>{e.name} · {e.role}{activeFor(data.missions,e.id)?' (작업 중)':''}</option>)}</select><span className="field-label">함께할 별 <small>1개 이상</small></span><div className="member-grid">{data.employees.filter(e=>e.id!==lead).map(e=><label key={e.id} className={`member-option ${members.includes(e.id)?'checked':''}`}><input type="checkbox" checked={members.includes(e.id)} disabled={!!activeFor(data.missions,e.id)} onChange={ev=>setMembers(prev=>ev.target.checked?[...prev,e.id]:prev.filter(x=>x!==e.id))}/><StarIcon small role={e.role}/><span>{e.name}<small>{e.role}{activeFor(data.missions,e.id)?' · 작업 중':''}</small></span></label>)}</div><MissionBrief employees={data.employees} leadId={lead} memberIds={members} assignments={assignments} onChange={(id,value)=>setAssignments(prev=>({...prev,[id]:value}))} expectedResult={expectedResult} onExpected={setExpectedResult}/><details className="mission-brief"><summary>컨텍스트 미리보기</summary><ContextPreview contexts={previewContexts}/></details><div className="mock-notice"><CircleHelp size={15}/><p>10초 동안 협업 흐름을 체험해요.<br/>실제 AI 호출이나 결과물 생성은 하지 않아요.</p></div>{formError?<p className="form-error" role="alert">{formError}</p>:null}<button className="white-button full" type="submit">미션 시작하기 <ArrowRight size={16}/></button></form></ModalFrame>:null}
    {modal==='context'?<ModalFrame title="전달 컨텍스트 · 목" close={close}><ContextPreview contexts={data.missions.find(m=>m.id===contextMissionId)?.contexts}/></ModalFrame>:null}
    {modal==='projects'?<ModalFrame title="프로젝트 관리" close={close}><ProjectManager projects={data.projects} activeId={activeProject.id} onSave={saveProject}/></ModalFrame>:null}
    {modal==='employee'?<ModalFrame title="새로운 별 만들기" close={close}><NewStarForm onCreate={createEmployee}/></ModalFrame>:null}
    {modal==='education'&&employee?<ModalFrame title={`${employee.name} · 교육과 메모`} close={close}><Education key={employee.id} employee={employee} onSave={(text,id)=>saveMemory(employee.id,text,id)} onDelete={id=>deleteMemory(employee.id,id)}/></ModalFrame>:null}
    {modal==='results'?<ModalFrame title="결과함" sub="별들이 함께한 미션과 평가 기록." close={close}>{result?<><button className="text-button" onClick={()=>setResultId(null)}><ArrowLeft size={14}/> 전체 결과</button><button className="outline-button full" onClick={()=>openDashboard(result.id)}>업무 대시보드 열기 <ArrowRight size={14}/></button><div className="result-detail"><span className="role-tag">MOCK RESULT</span><h3>{result.title}</h3><p>{formatDate(result.ended!)} · 10초 시뮬레이션</p><div className="result-summary"><CheckCheck size={20}/><div><strong>팀 협업 시뮬레이션을 완료했어요.</strong><p>업무 분배 → 수행 → 총괄 검토 → 복귀<br/>실제 AI가 생성한 결과물이 아닌 목 기록이에요.</p></div></div><h4>작업 수행 완성도</h4><p className="rating-help">내 평가를 남기세요. 총괄 평가는 직접 입력하는 목 항목이에요.</p>{[result.lead,...result.members].map(id=>{const e=data.employees.find(e=>e.id===id);return <div className="rating-row" key={id}><div><strong>{e?.name||'알 수 없는 별'}</strong><small>{id===result.lead?'이번 미션 총괄':e?.role}</small></div><label>내 평가<select aria-label={`${e?.name} 내 평가`} value={result.ratings[id]?.user??''} onChange={ev=>rate(result.id,id,'user',ev.target.value)}><option value="">미평가</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></label>{id!==result.lead?<label>총괄 평가 (목)<select aria-label={`${e?.name} 총괄 평가`} value={result.ratings[id]?.lead??''} onChange={ev=>rate(result.id,id,'lead',ev.target.value)}><option value="">미평가</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></label>:<span className="not-rated">자기 평가는 제외</span>}</div>;})}<details className="mission-brief"><summary>업무 시작 시 컨텍스트</summary><ContextPreview contexts={result.contexts}/></details><button className="outline-button full" onClick={()=>download(result)}><ArrowDownToLine size={15}/> 목 결과 기록 내려받기</button></div></>:visibleCompleted.length?<div className="results-list">{visibleCompleted.filter(m=>!selected||m.lead===selected||m.members.includes(selected)).length===0?<p className="muted">이 별이 완료한 업무는 아직 없어요.</p>:null}{visibleCompleted.filter(m=>!selected||m.lead===selected||m.members.includes(selected)).map(m=><button key={m.id} onClick={()=>setResultId(m.id)}><div><span className="tiny-label">MOCK · COMPLETED</span><strong>{m.title}</strong><small>{formatDate(m.ended!)}</small></div><ChevronRight size={18}/></button>)}</div>:<div className="empty-state"><FolderClosed size={30} strokeWidth={1}/><strong>아직 도착한 결과가 없어요.</strong><p>첫 미션을 완료하면 이곳에 기록돼요.</p></div>}</ModalFrame>:null}
    {modal==='settings'?<ModalFrame title="워크스페이스 설정" sub="지금은 API 비용 없이 동작하는 목 버전이에요." close={close}><div className="settings-info"><div><span>실행 모드</span><strong>로컬 목 시뮬레이션</strong></div><div><span>업무 수행 시간</span><strong>10초</strong></div><div><span>AI 연결</span><strong>연결 안 됨</strong></div><div><span>데이터 저장</span><strong>현재 브라우저 · localStorage</strong></div></div><label className="toggle-label"><span><strong>움직임 줄이기</strong><small>궤도와 별의 애니메이션을 줄여요.</small></span><input type="checkbox" checked={reduced} onChange={e=>setReduced(e.target.checked)}/></label><div className="mock-notice"><CircleHelp size={16}/><p>별·업무·평가는 이 브라우저에만 저장돼요.<br/>브라우저 데이터를 지우면 기록도 삭제돼요.</p></div><button className="outline-button full" onClick={close}>확인</button></ModalFrame>:null}
  </div>;
}
