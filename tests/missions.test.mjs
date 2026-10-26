import test from 'node:test';
import assert from 'node:assert/strict';
import { activeFor, average, completeExpired, DURATION, KEY, readWorkspace, recentCount } from '../src/model.ts';

const make = (overrides = {}) => ({ id: 'm1', title: '기획서 검토', lead: 'jiu', members: ['seoyeon', 'doyun'], started: Date.now(), ratings: {}, ...overrides });
test('10초 직전에는 계속 일하고, 정확히 10초에 종료되어 모든 팀원이 해제된다', () => {
  const m = make(), input = [m];
  assert.equal(completeExpired(input, m.started + DURATION - 1), input);
  assert.equal(activeFor(input, 'jiu'), m);
  assert.equal(activeFor(input, 'seoyeon'), m);
  assert.equal(activeFor(input, 'taeo'), undefined);
  const finished = completeExpired(input, m.started + DURATION);
  assert.equal(finished[0].ended, m.started + DURATION);
  for (const id of ['jiu', 'seoyeon', 'doyun']) assert.equal(activeFor(finished, id), undefined);
  assert.equal(input[0].ended, undefined);
});
test('동시 업무는 각자의 시작 시간을 기준으로 독립적으로 끝난다', () => {
  const a = make(), b = make({ id: 'm2', lead: 'taeo', members: ['other'], started: a.started + 5000 });
  const next = completeExpired([a, b], a.started + DURATION);
  assert.ok(next[0].ended);
  assert.equal(next[1].ended, undefined);
  assert.equal(activeFor(next, 'taeo')?.id, 'm2');
});
test('중단한 업무는 완료 건수와 평가 평균에 포함하지 않는다', () => {
  const m = make({ ended: Date.now(), cancelled: true, ratings: { seoyeon: { user: 5, lead: 4 } } });
  assert.equal(recentCount([m], 'seoyeon'), 0);
  assert.equal(average([m], 'seoyeon', 'user'), '—');
  assert.equal(activeFor([m], 'seoyeon'), undefined);
});
test('최근 7일 완료 업무만 세고 사용자 평가와 총괄 평가를 따로 평균 낸다', () => {
  const m = make({ ended: Date.now(), ratings: { seoyeon: { user: 5, lead: 3 } } });
  const n = make({ id: 'm2', ended: Date.now(), ratings: { seoyeon: { user: 3 } } });
  const old = make({ id: 'old', ended: Date.now() - 8 * 86400000 });
  assert.equal(recentCount([m, n, old], 'seoyeon'), 2);
  assert.equal(recentCount([m], 'jiu'), 1);
  assert.equal(average([m, n], 'seoyeon', 'user'), '4.0');
  assert.equal(average([m, n], 'seoyeon', 'lead'), '3.0');
  assert.equal(average([m], 'jiu', 'lead'), '—');
});
test('새로고침 시 지난 미션은 종료 시점으로 복구하고 평가를 보존한다', () => {
  const store = new Map();
  globalThis.localStorage = { getItem: key => store.get(key) ?? null };
  const fresh = readWorkspace();
  const m = make({ started: Date.now() - 15000, ratings: { seoyeon: { user: 4 } } });
  store.set(KEY, JSON.stringify({ ...fresh, missions: [m] }));
  const recovered = readWorkspace();
  assert.equal(recovered.missions[0].ended, m.started + DURATION);
  assert.equal(recovered.missions[0].ratings.seoyeon.user, 4);
  const confirmedNote={id:'note1',text:'근거 없는 수치를 표시한다.',created:Date.now(),updated:Date.now()};
  store.set(KEY,JSON.stringify({...fresh,employees:fresh.employees.map((e,i)=>i===0?{...e,notes:[confirmedNote]}:e),missions:[m]}));
  const withMemory=readWorkspace();
  assert.deepEqual(withMemory.employees[0].notes,[confirmedNote]);
  assert.deepEqual(withMemory.employees[1].notes,[]);
  assert.equal(withMemory.missions[0].ratings.seoyeon.user,4);
  store.set(KEY, 'broken json');
  assert.equal(readWorkspace().employees.length, 4);
  assert.equal(readWorkspace().missions.length, 0);
});
test('기본 사람 이름을 별 이름으로 바꾸되 사용자 이름과 위치·기록을 보존한다', () => {
  const fresh = readWorkspace();
  const m = make({ ended: Date.now() });
  for (const names of [['지우','서연','나만의 별','태오'],['루멘','노바','나만의 별','리겔']]) {
    const employees = fresh.employees.map((e, i) => ({ ...e, name: names[i] }));
    globalThis.localStorage = { getItem: () => JSON.stringify({ ...fresh, employees, missions: [m] }) };
    const restored = readWorkspace();
    assert.deepEqual(restored.employees.map(e => e.name), ['폴라리스','아카이브','나만의 별','펄서']);
    assert.equal(restored.employees[0].x, employees[0].x);
    assert.equal(restored.missions[0].lead, 'jiu');
  }
});
