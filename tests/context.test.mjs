import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMissionContexts } from '../src/missionContext.ts';
import { readWorkspace } from '../src/model.ts';
function fixture(){
  globalThis.localStorage={getItem:()=>null};
  const employees=readWorkspace().employees;
  employees[1].notes=[{id:'n',text:'문서 담당의 교육 메모',created:1,updated:1}];
  return {employees,leadId:'jiu',memberIds:['seoyeon','doyun'],task:'기획서 검토',assignments:{seoyeon:{summary:'문서 검토',details:'문서 담당에게만 주는 상세 검토 지시'},doyun:{summary:'디자인 구성',details:'디자인 담당에게만 주는 상세 구성 지시'}},expectedResult:'문제점과 수정안 제출'};
}
test('총괄은 전체 상세 지시를 받고 팀원은 자신의 상세와 동료 요약만 받는다',()=>{
  const contexts=buildMissionContexts(fixture());
  assert.equal(contexts.jiu.allAssignments.length,3);
  assert.ok(JSON.stringify(contexts.jiu).includes('디자인 담당에게만 주는 상세 구성 지시'));
  assert.equal(contexts.seoyeon.ownAssignment.details,'문서 담당에게만 주는 상세 검토 지시');
  assert.equal(contexts.seoyeon.team.find(e=>e.id==='doyun').summary,'디자인 구성');
  assert.equal(contexts.seoyeon.allAssignments,undefined);
  assert.ok(!JSON.stringify(contexts.seoyeon).includes('디자인 담당에게만 주는 상세 구성 지시'));
  assert.equal(contexts.taeo,undefined);
});
test('각 별의 교육 메모는 자기 패킷에만 포함된다',()=>{
  const contexts=buildMissionContexts(fixture());
  assert.deepEqual(contexts.seoyeon.agent.educationNotes,['문서 담당의 교육 메모']);
  assert.ok(!JSON.stringify(contexts.jiu).includes('문서 담당의 교육 메모'));
  assert.ok(!JSON.stringify(contexts.doyun).includes('문서 담당의 교육 메모'));
});
test('총괄 교체 시 전문 분야는 유지하고 미션 역할·가이드·보고 대상을 바꾼다',()=>{
  const input=fixture();input.leadId='seoyeon';input.memberIds=['jiu','doyun'];
  const contexts=buildMissionContexts(input);
  assert.equal(contexts.seoyeon.agent.specialty,'문서');
  assert.equal(contexts.seoyeon.agent.missionRole,'총괄');
  assert.equal(contexts.seoyeon.reportTo,null);
  assert.equal(contexts.jiu.agent.missionRole,'팀원');
  assert.equal(contexts.jiu.reportTo.id,'seoyeon');
  assert.ok(contexts.seoyeon.guidelines.some(g=>g.includes('最終')||g.includes('최종')));
  assert.equal(contexts.jiu.allAssignments,undefined);
});
test('시작 시 패킷은 원본 지시·메모 수정에 영향받지 않고 저장 후에도 복구된다',()=>{
  const input=fixture(),contexts=buildMissionContexts(input);
  input.assignments.seoyeon.details='새 지시';input.employees[1].notes[0].text='새 메모';
  assert.equal(contexts.seoyeon.ownAssignment.details,'문서 담당에게만 주는 상세 검토 지시');
  assert.equal(contexts.seoyeon.agent.educationNotes[0],'문서 담당의 교육 메모');
  const data={version:1,employees:input.employees,missions:[{id:'m',title:input.task,lead:input.leadId,members:input.memberIds,started:Date.now(),ratings:{},contexts}]};
  globalThis.localStorage={getItem:()=>JSON.stringify(data)};
  assert.deepEqual(readWorkspace().missions[0].contexts,contexts);
});
