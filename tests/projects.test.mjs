import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PROJECT, normalizeProjectData, projectMissions } from '../src/projects.ts';
import { completeExpired, DURATION, readWorkspace } from '../src/model.ts';
import { buildMissionContexts } from '../src/missionContext.ts';
const mission=(extra={})=>({id:'m',title:'검토',lead:'jiu',members:['seoyeon'],started:Date.now(),ratings:{},...extra});
test('기존 저장 데이터를 기본 프로젝트로 옮기고 평가·대화·메모를 보존한다',()=>{
  globalThis.localStorage={getItem:()=>null};const seed=readWorkspace();
  const old={version:1,employees:seed.employees,missions:[mission({ended:Date.now(),ratings:{seoyeon:{user:5}},messages:[{id:'u',from:'user',to:'seoyeon',text:'근거 포함',at:Date.now(),kind:'instruction',mock:false}]})]};
  old.employees[0].notes=[{id:'n',text:'기억할 내용',created:1,updated:1}];
  globalThis.localStorage={getItem:()=>JSON.stringify(old)};
  const migrated=readWorkspace();
  assert.equal(migrated.projects[0].id,DEFAULT_PROJECT.id);
  assert.equal(migrated.missions[0].projectId,DEFAULT_PROJECT.id);
  assert.equal(migrated.missions[0].ratings.seoyeon.user,5);
  assert.equal(migrated.missions[0].messages[0].text,'근거 포함');
  assert.equal(migrated.employees[0].notes[0].text,'기억할 내용');
});
test('프로젝트 선택을 복구하고 잘못된 선택은 기존 프로젝트로 되돌린다',()=>{
  const a={...DEFAULT_PROJECT,id:'a',name:'A'},b={...DEFAULT_PROJECT,id:'b',name:'B'};
  assert.equal(normalizeProjectData({projects:[a,b],activeProjectId:'b',missions:[]}).activeProjectId,'b');
  assert.equal(normalizeProjectData({projects:[a,b],activeProjectId:'missing',missions:[]}).activeProjectId,'a');
  assert.equal(normalizeProjectData({projects:[a,a],missions:[]}).projects.length,1);
});
test('프로젝트 목록은 분리하지만 전체 실행 목록의 미션은 계속 종료 처리된다',()=>{
  const start=Date.now(),a=mission({id:'a1',projectId:'a',started:start}),b=mission({id:'b1',projectId:'b',started:start});
  assert.deepEqual(projectMissions([a,b],'a').map(m=>m.id),['a1']);
  const completed=completeExpired([a,b],start+DURATION);
  assert.ok(completed.every(m=>m.ended===start+DURATION));
});
test('프로젝트 설명·폴더·자료가 패킷에 들어가고 이후 편집과 분리된다',()=>{
  globalThis.localStorage={getItem:()=>null};const employees=readWorkspace().employees;
  const project={...DEFAULT_PROJECT,name:'트립오프',description:'여행 서비스 기획',folder:'C:\\Projects\\trip',references:'기획서 v1'};
  const contexts=buildMissionContexts({employees,leadId:'jiu',memberIds:['seoyeon'],task:'기획서 검토',assignments:{},project});
  project.references='기획서 v2';project.description='바뀐 설명';
  assert.equal(contexts.jiu.shared.project.description,'여행 서비스 기획');
  assert.equal(contexts.seoyeon.shared.references,'기획서 v1');
  assert.equal(contexts.jiu.shared.project.folder,'C:\\Projects\\trip');
  assert.notEqual(contexts.jiu.shared.project,contexts.seoyeon.shared.project);
});
