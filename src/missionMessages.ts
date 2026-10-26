import type { Mission } from './model';
export type MissionMessage = { id:string; from:string; to:string; text:string; at:number; kind:'assignment'|'reply'|'report'|'review'|'instruction'|'final'; mock:boolean };
export function messagesForStar(messages:MissionMessage[],id:string):MissionMessage[]{
  return messages.filter(m=>m.from===id||m.to===id).sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
}
// Only missions explicitly created in mock mode produce simulated conversations.
export function advanceMockMessages(m:Mission,now:number,duration:number):Mission{
  if(m.messageMode!=='mock')return m;
  const cutoff=Math.min(now,m.ended??m.started+duration);
  const existing=m.messages||[],seen=new Set(existing.map(x=>x.id)),next:MissionMessage[]=[];
  function add(key:string,offset:number,from:string,to:string,text:string,kind:MissionMessage['kind']){
    const at=m.started+offset,id=`${m.id}:${key}`;
    if(at<=cutoff&&!seen.has(id)){next.push({id,from,to,text,at,kind,mock:true});seen.add(id);}
  }
  m.members.forEach((id,index)=>{
    const assignment=m.contexts?.[id]?.ownAssignment;
    const stagger=Math.min(index,10)*50;
    add(`assign:${id}`,350+stagger,m.lead,id,assignment?`${assignment.summary}\n\n${assignment.details}`:'배정된 담당 업무를 수행하고 결과를 보고해주세요.','assignment');
    add(`reply:${id}`,1800+stagger,id,m.lead,'담당 지시와 컨텍스트를 확인했습니다. 목 작업을 시작합니다.','reply');
    add(`report:${id}`,6400+stagger,id,m.lead,'담당 업무의 목 실행을 마쳤습니다. 실제 분석·파일 생성은 수행하지 않았습니다.','report');
    add(`review:${id}`,8000+stagger,m.lead,id,'목 결과를 접수했습니다. 최종 종합 단계로 넘어갑니다. 실제 AI 검토는 실행하지 않았습니다.','review');
  });
  if(!m.cancelled)add('final',duration,m.lead,'user','팀 협업 시뮬레이션을 완료했습니다. 실제 AI 결과물은 생성하지 않았습니다.','final');
  return next.length?{...m,messages:[...existing,...next].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id))}:m;
}
export function recordInstruction(m:Mission,receiver:string,text:string,now:number,id:string,duration:number):Mission{
  if(m.ended||now<m.started||now>=m.started+duration||!text.trim()||![m.lead,...m.members].includes(receiver))return m;
  const message:MissionMessage={id,from:'user',to:receiver,text:text.trim(),at:now,kind:'instruction',mock:false};
  return {...m,messages:[...(m.messages||[]),message]};
}
