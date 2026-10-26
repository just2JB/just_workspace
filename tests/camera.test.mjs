import test from 'node:test';
import assert from 'node:assert/strict';
import { toWorld, zoomAt } from '../src/camera.ts';
import { roleColor } from '../src/starVisual.ts';

test('이동·확대 후 화면 좌표가 원래 별의 월드 좌표로 변환된다',()=>{
  const c={x:120,y:-80,scale:2};
  assert.deepEqual(toWorld({x:520,y:220},c),{x:200,y:150});
  assert.deepEqual(toWorld({x:-80,y:-180},c),{x:-100,y:-50});
});
test('확대 시 포인터 아래 월드 위치는 바뀌지 않는다',()=>{
  const camera={x:220,y:-100,scale:.8},anchor={x:450,y:280};
  const before=toWorld(anchor,camera),next=zoomAt(camera,anchor,1.7),after=toWorld(anchor,next);
  assert.ok(Math.abs(before.x-after.x)<1e-9);
  assert.ok(Math.abs(before.y-after.y)<1e-9);
  assert.equal(zoomAt(camera,anchor,100).scale,2.5);
  assert.equal(zoomAt(camera,anchor,0).scale,.35);
});
test('특기별 색상이 구분되고 사용자 지정 특기도 동일한 색으로 복원된다',()=>{
  assert.equal(new Set(['총괄','문서','디자인','개발','리서치'].map(roleColor)).size,5);
  assert.equal(roleColor('음악 분석'),roleColor('음악 분석'));
  assert.match(roleColor('음악 분석'),/^#[a-f0-9]{6}$/i);
});
