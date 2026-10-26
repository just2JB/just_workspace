import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceMockMessages, messagesForStar, recordInstruction } from '../src/missionMessages.ts';
import { completeExpired, DURATION, readWorkspace } from '../src/model.ts';
import { missionIdFromHash } from '../src/missionRoute.ts';
const make=(extra={})=>({id:'m1',title:'목 테스트',lead:'lead',members:['a','b'],started:100000,ratings:{},messageMode:'mock',messages:[],...extra});
test('실행 시간이 지난 단계만 대화로 기록하고 반복 처리해도 중복되지 않는다',()=>{
  const m=make();assert.equal(advanceMockMessages(m,m.started+300,DURATION),m);
  const started=advanceMockMessages(m,m.started+2000,DURATION);
  assert.equal(started.messages.length,4);
  assert.ok(started.messages.every(x=>x.at<=m.started+2000));
  assert.equal(advanceMockMessages(started,m.started+2000,DURATION),started);
  const done=completeExpired([started],m.started+DURATION)[0];
  assert.equal(done.messages.length,9);
  assert.equal(done.messages.at(-1).kind,'final');
  assert.equal(new Set(done.messages.map(x=>x.id)).size,9);
});
test('별별 방에는 해당 별이 발신·수신한 대화만 표시한다',()=>{
  const m=advanceMockMessages(make(),110000,DURATION);
  const a=messagesForStar(m.messages,'a'),b=messagesForStar(m.messages,'b');
  assert.equal(a.length,4);assert.equal(b.length,4);
  assert.ok(a.every(x=>x.from==='a'||x.to==='a'));
  assert.ok(!a.some(x=>x.from==='b'||x.to==='b'));
  assert.equal(messagesForStar(m.messages,'lead').length,9);
});
test('중단 이후의 대화와 최종 보고는 생성하지 않고 과거 미션도 소급 생성하지 않는다',()=>{
  const cancelled=make({cancelled:true,ended:102000});
  const next=advanceMockMessages(cancelled,120000,DURATION);
  assert.equal(next.messages.length,4);assert.ok(next.messages.every(x=>x.at<=102000));
  assert.ok(!next.messages.some(x=>x.kind==='final'));
  const legacy=make({messageMode:undefined,messages:undefined});
  assert.equal(advanceMockMessages(legacy,120000,DURATION),legacy);
});
test('추가 지시는 현재 미션 참여자에게만 기록하고 종료 후에는 받지 않는다',()=>{
  const m=make(),n=recordInstruction(m,'a','  근거도 정리해줘  ',102000,'user1',DURATION);
  assert.equal(n.messages[0].text,'근거도 정리해줘');assert.equal(n.messages[0].mock,false);
  assert.equal(messagesForStar(n.messages,'a').length,1);assert.equal(messagesForStar(n.messages,'b').length,0);
  assert.equal(recordInstruction(m,'unknown','지시',102000,'user2',DURATION),m);
  assert.equal(recordInstruction(m,'a','지시',110000,'user3',DURATION),m);
  const done=make({ended:105000});assert.equal(recordInstruction(done,'a','지시',106000,'user4',DURATION),done);
});
test('새로고침 후 대화와 완료 보고를 복구해도 중복되지 않는다',()=>{
  globalThis.localStorage={getItem:()=>null};const data=readWorkspace(),started=Date.now()-20000;
  data.missions=[make({started})];
  globalThis.localStorage={getItem:()=>JSON.stringify(data)};
  const recovered=readWorkspace();assert.equal(recovered.missions[0].messages.length,9);
  globalThis.localStorage={getItem:()=>JSON.stringify(recovered)};
  assert.equal(readWorkspace().missions[0].messages.length,9);
});
test('업무 대시보드 주소를 파싱하고 잘못된 주소는 안전하게 처리한다',()=>{
  assert.equal(missionIdFromHash('#/missions/mission-1'),'mission-1');
  assert.equal(missionIdFromHash('#/missions/a%20b'),'a b');
  assert.equal(missionIdFromHash('#/missions/%xx'),null);
  assert.equal(missionIdFromHash('#'),null);
});
