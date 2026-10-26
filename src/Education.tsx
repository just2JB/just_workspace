import { useState } from 'react';
import { BookOpen, Check, Pencil, Trash2 } from 'lucide-react';
import type { Employee } from './model';
export default function Education({employee,onSave,onDelete}:{employee:Employee;onSave:(text:string,id?:string)=>void;onDelete:(id:string)=>void}){
  const [input,setInput]=useState('');
  const [draft,setDraft]=useState<string|null>(null);
  const [editing,setEditing]=useState<string|undefined>();
  const [notice,setNotice]=useState('');
  const notes=employee.notes||[];
  function cancel(){setDraft(null);setEditing(undefined);setNotice('');}
  function save(){if(!draft?.trim())return;onSave(draft.trim(),editing);setDraft(null);setInput('');setEditing(undefined);setNotice('메모에 저장했어요.');}
  return <div className="education">
    <div className="section-title"><BookOpen size={16}/><h3>교육</h3><span className="role-tag">MOCK</span></div>
    {draft===null?<form onSubmit={e=>{e.preventDefault();if(!input.trim())return;setDraft(input.trim());setEditing(undefined);setNotice('');}}>
      <label className="field-label" htmlFor="education-input">가르칠 내용</label><textarea id="education-input" value={input} onChange={e=>setInput(e.target.value)} maxLength={4000} required placeholder="예: 문서를 검토할 때 출처 없는 수치를 표시하고, 문제점과 수정안을 함께 제출해줘."/>
      <p className="education-status">AI 연결 전에는 입력한 문장을 초안으로 가져옵니다.</p>
      <button type="submit" className="outline-button full">메모 초안 만들기</button>
    </form>:<div className="draft-review"><label className="field-label" htmlFor="memory-draft">{editing?'메모 수정':'저장할 메모 확인'}</label><textarea id="memory-draft" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={4000}/><p className="education-status">저장 전까지 메모에 반영되지 않습니다.</p><div className="draft-actions"><button className="outline-button" onClick={cancel}>취소</button><button className="white-button" disabled={!draft.trim()} onClick={save}><Check size={14}/> 이 메모로 저장</button></div></div>}
    {notice?<p className="education-status" role="status">{notice}</p>:null}
    <div className="section-divider"/><div className="section-title"><h3>저장된 메모</h3><span className="count">{notes.length}</span></div>
    {notes.length?<div className="memory-list">{notes.map(note=><article className="memory-note" key={note.id}><p>{note.text}</p><footer><time>{new Intl.DateTimeFormat('ko-KR',{month:'short',day:'numeric',timeZone:'Asia/Seoul'}).format(note.updated)}</time><button className="icon-button" aria-label="메모 수정" disabled={draft!==null} onClick={()=>{setEditing(note.id);setDraft(note.text);setNotice('');}}><Pencil size={13}/></button><button className="icon-button" aria-label="메모 삭제" disabled={draft!==null} onClick={()=>{onDelete(note.id);setNotice('메모를 삭제했어요.');}}><Trash2 size={13}/></button></footer></article>)}</div>:<p className="education-status">저장된 메모가 없어요.</p>}
  </div>;
}
