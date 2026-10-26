import { useState } from 'react';
import { Plus } from 'lucide-react';
import { EMPLOYEE_TEMPLATES } from './employeeTemplates';
import type { EmployeeTemplate } from './employeeTemplates';
import { StarIcon } from './Universe';
export default function NewStarForm({onCreate}:{onCreate:(name:string,template:EmployeeTemplate)=>void}){
  const [id,setId]=useState<string>(EMPLOYEE_TEMPLATES[0].id);
  const [name,setName]=useState('');
  const template=EMPLOYEE_TEMPLATES.find(t=>t.id===id)!;
  return <form onSubmit={event=>{event.preventDefault();if(name.trim())onCreate(name.trim(),template);}}>
    <span className="field-label">직무 템플릿</span><div className="template-grid">{EMPLOYEE_TEMPLATES.map(t=><button type="button" key={t.id} aria-pressed={id===t.id} className={id===t.id?'template-option chosen':'template-option'} onClick={()=>setId(t.id)}><StarIcon small role={t.role}/><span>{t.role}</span></button>)}</div>
    <div className="template-summary"><strong>{template.specialty}</strong><p>{template.instructions}</p></div>
    <label className="field-label" htmlFor="star-name">별의 이름</label><input id="star-name" value={name} onChange={e=>setName(e.target.value)} maxLength={12} required pattern=".*\S.*" placeholder={`예: ${template.name}`}/>
    <button className="white-button full" type="submit" style={{marginTop:23}}>나의 우주에 추가하기 <Plus size={16}/></button>
  </form>;
}
