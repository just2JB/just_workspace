import { useState } from 'react';
import { FolderClosed, Plus } from 'lucide-react';
import type { Project } from './projects';
type Props={projects:Project[];activeId:string;onSave:(project:Omit<Project,'id'>,id?:string)=>void};
export default function ProjectManager({projects,activeId,onSave}:Props){
  const initial=projects.find(p=>p.id===activeId)||projects[0];
  const [editing,setEditing]=useState<string|undefined>(initial.id);
  const [draft,setDraft]=useState({...initial});
  function choose(project:Project){setEditing(project.id);setDraft({...project});}
  function create(){setEditing(undefined);setDraft({id:'',name:'',description:'',folder:'',references:''});}
  return <div className="project-manager"><nav aria-label="프로젝트 목록">{projects.map(p=><button key={p.id} className={editing===p.id?'chosen':''} onClick={()=>choose(p)}><FolderClosed size={14}/><span>{p.name}</span></button>)}<button onClick={create} className={!editing?'chosen':''}><Plus size={14}/> 새 프로젝트</button></nav><form onSubmit={e=>{e.preventDefault();if(draft.name.trim())onSave({name:draft.name.trim(),description:draft.description.trim(),folder:draft.folder.trim(),references:draft.references.trim()},editing);}}>
    <label className="field-label" htmlFor="project-name">프로젝트 이름</label><input id="project-name" value={draft.name} onChange={e=>setDraft(prev=>({...prev,name:e.target.value}))} required maxLength={40}/>
    <label className="field-label" htmlFor="project-description">공통 설명 · 목표</label><textarea id="project-description" value={draft.description} maxLength={4000} onChange={e=>setDraft(prev=>({...prev,description:e.target.value}))} placeholder="이 프로젝트의 목적과 알아야 할 배경"/>
    <label className="field-label" htmlFor="project-folder">작업 폴더 경로</label><input id="project-folder" value={draft.folder} maxLength={1000} onChange={e=>setDraft(prev=>({...prev,folder:e.target.value}))} placeholder="C:\Projects\my-project"/>
    <label className="field-label" htmlFor="project-references">참고 자료 · 링크 · 파일 경로</label><textarea id="project-references" value={draft.references} maxLength={12000} onChange={e=>setDraft(prev=>({...prev,references:e.target.value}))} placeholder="참고할 자료의 내용이나 링크·파일 경로"/>
    <p className="education-status">현재는 경로·내용을 저장합니다. 파일을 읽거나 수정하지 않아요.</p>
    <button type="submit" className="white-button full">{editing?'저장하고 선택':'프로젝트 만들기'}</button>
  </form></div>;
}
