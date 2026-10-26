import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, CheckCheck, MessageSquare, Send, StopCircle } from 'lucide-react';
import type { Employee, Mission } from './model';
import { DURATION } from './model';
import { messagesForStar } from './missionMessages';
import type { MissionMessage } from './missionMessages';
import { roleColor } from './starVisual';
import { StarIcon } from './Universe';
import ContextPreview from './ContextPreview';
const time=(n:number)=>new Intl.DateTimeFormat('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'Asia/Seoul'}).format(n);
const labels:Record<MissionMessage['kind'],string>={assignment:'업무 배정',reply:'응답',report:'결과 보고',review:'검토',instruction:'내 추가 지시',final:'최종 보고'};
type Props={mission:Mission;employees:Employee[];now:number;onBack:()=>void;onCancel:()=>void;onResults:()=>void;onInstruction:(receiver:string,text:string)=>void};
export default function MissionDashboard({mission:m,employees,now,onBack,onCancel,onResults,onInstruction}:Props){
  const [room,setRoom]=useState(m.lead);
  const [tab,setTab]=useState<'chat'|'context'>('chat');
  const [input,setInput]=useState('');
  const scroll=useRef<HTMLDivElement>(null),pinned=useRef(true);
  const ids=[m.lead,...m.members];
  const identity=(id:string)=>{const context=m.contexts?.[id];return {name:id==='user'?'나':context?.agent.name||employees.find(e=>e.id===id)?.name||'알 수 없는 별',role:context?.agent.specialty||employees.find(e=>e.id===id)?.role||'기타'};};
  const current=identity(room),messages=messagesForStar(m.messages||[],room),context=m.contexts?.[room];
  const elapsed=Math.max(0,Math.min(DURATION,(m.ended||now)-m.started)),progress=elapsed/DURATION*100;
  const state=m.cancelled?'중단됨':m.ended?'완료':elapsed<1800?'업무 분배 중':elapsed<7500?'업무 수행 중':'총괄 검토 중';
  useEffect(()=>{pinned.current=true;setInput('');},[room]);
  useEffect(()=>{if(pinned.current&&scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight;},[room,messages.length,tab]);
  function send(event:React.FormEvent){event.preventDefault();if(!input.trim()||m.ended)return;onInstruction(room,input.trim());setInput('');pinned.current=true;}
  return <main className="mission-dashboard">
    <header className="dashboard-heading"><button className="outline-button" onClick={onBack}><ArrowLeft size={14}/> 우주로 돌아가기</button><div><span className="tiny-label">MISSION CONTROL</span><h1>{m.title}</h1></div><span className="dashboard-state"><span className="live-dot"/>{state}</span></header>
    <div className="dashboard-meta">{m.project?<span>프로젝트 <b>{m.project.name}</b></span>:null}<span>총괄 <b>{identity(m.lead).name}</b></span><span>참여 별 <b>{ids.length}</b></span><span>시작 <b>{time(m.started)}</b></span><span>수행 시간 <b>{(elapsed/1000).toFixed(1)}s</b></span><span className="role-tag">목 협업 기록</span><div className="progress-track"><div style={{width:`${progress}%`}}/></div></div>
    <div className="dashboard-layout">
      <nav className="rooms" aria-label="별별 대화방"><div className="section-title"><MessageSquare size={14}/><h2>대화방</h2></div>{ids.map(id=>{const person=identity(id),count=messagesForStar(m.messages||[],id).length;return <button key={id} className={`room ${room===id?'chosen':''}`} aria-pressed={room===id} onClick={()=>setRoom(id)}><StarIcon small role={person.role} lead={id===m.lead}/><span><strong>{person.name}</strong><small>{id===m.lead?'미션 총괄':person.role}</small></span><b>{count}</b></button>;})}</nav>
      <section className="conversation" aria-label={`${current.name} 대화방`}><header><div className="room-title"><StarIcon small role={current.role} lead={room===m.lead}/><div><h2>{current.name}</h2><p>{room===m.lead?'팀원들과의 대화 · 사용자 보고':'총괄 및 동료와 주고받은 대화'}</p></div></div><div className="conversation-tabs"><button aria-pressed={tab==='chat'} className={tab==='chat'?'chosen':''} onClick={()=>setTab('chat')}>대화</button><button aria-pressed={tab==='context'} className={tab==='context'?'chosen':''} onClick={()=>setTab('context')}>전달 컨텍스트</button></div></header>
        {tab==='chat'?<><div className="message-list" ref={scroll} onScroll={()=>{const el=scroll.current;if(el)pinned.current=el.scrollHeight-el.scrollTop-el.clientHeight<60;}}><p className="chat-mode-note">목 시뮬레이션 · 실제 AI 간 통신이 아닙니다.</p>{messages.length?messages.map(message=>{const sender=identity(message.from),receiver=identity(message.to);return <article key={message.id} className={`chat-message ${message.from===room?'outgoing':''}`}><header><span style={{color:roleColor(sender.role)}}>{sender.name}</span><ArrowUpRight size={11}/><span>{receiver.name}</span><time>{time(message.at)}</time></header><div><span className="message-kind">{labels[message.kind]}{message.mock?' · 목':''}</span><p>{message.text}</p></div></article>;}):<div className="chat-empty"><MessageSquare size={24} strokeWidth={1}/><p>{m.messageMode==='mock'?'아직 주고받은 대화가 없어요.':'이전 미션에는 대화 기록이 없어요.'}</p></div>}</div><form className="message-composer" onSubmit={send}><label className="sr-only" htmlFor="room-instruction">{current.name}에게 추가 지시</label><textarea id="room-instruction" value={input} maxLength={2000} disabled={!!m.ended} onChange={e=>setInput(e.target.value)} placeholder={m.ended?'종료된 업무입니다.':`${current.name}에게 추가 지시 기록하기 (목)`}/><button className="white-button" type="submit" disabled={!!m.ended||!input.trim()} aria-label="추가 지시 기록"><Send size={15}/></button><small>이 미션에만 저장 · 실제 AI 전송 없음</small></form></>:<div className="context-room"><ContextPreview contexts={context?{[room]:context}:undefined}/></div>}
      </section>
      <aside className="dashboard-detail"><span className="tiny-label">ASSIGNMENT</span><h3>{current.name}의 담당 업무</h3><strong>{context?.ownAssignment.summary||'이전 미션 · 상세 기록 없음'}</strong><p>{context?.ownAssignment.details}</p><div className="section-divider"/><h3>완료 기준</h3><p>{context?.shared.expectedResult||'별도 기록 없음'}</p><div className="section-divider"/><h3>결과</h3><p>{m.cancelled?'업무가 중단됐습니다.':m.ended?'목 협업이 완료됐습니다. 결과와 평가를 확인할 수 있어요.':'작업이 완료되면 결과가 도착합니다.'}</p>{m.ended&&!m.cancelled?<button className="outline-button full" onClick={onResults}><CheckCheck size={14}/> 결과와 평가 보기</button>:null}{!m.ended?<button className="outline-button full" onClick={onCancel}><StopCircle size={14}/> 업무 중단</button>:null}</aside>
    </div>
  </main>;
}
