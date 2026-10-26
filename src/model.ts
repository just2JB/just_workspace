import type { AgentContext } from './missionContext';
import { advanceMockMessages } from './missionMessages.ts';
import type { MissionMessage } from './missionMessages';
import { DEFAULT_PROJECT, normalizeProjectData } from './projects.ts';
import type { Project } from './projects';
export type MemoryNote = { id:string; text:string; created:number; updated:number };
export type Employee = { id: string; name: string; role: string; specialty: string; model: string; x: number; y: number; shape: number; notes?:MemoryNote[]; templateId?:string; instructions?:string };
export type Mission = { id: string; title: string; lead: string; members: string[]; started: number; ended?: number; cancelled?: boolean; ratings: Record<string, { user?: number; lead?: number }>; contexts?:Record<string,AgentContext>; messageMode?:'mock'; messages?:MissionMessage[]; projectId?:string; project?:Project };
export type Workspace = { version: 1; employees: Employee[]; missions: Mission[]; projects:Project[]; activeProjectId:string };
export const DURATION = 10_000;
export const KEY = 'just-workspace.v1';
export function completeExpired(missions: Mission[], now: number): Mission[] {
  let changed = false;
  const next = missions.map(original => {
    const m=advanceMockMessages(original,now,DURATION);
    if(m!==original)changed=true;
    if (!m.ended && now >= m.started + DURATION) {
      changed = true;
      return { ...m, ended: m.started + DURATION };
    }
    return m;
  });
  return changed ? next : missions;
}
export const seed: Workspace = { version: 1, employees: [
  { id: 'jiu', name: '폴라리스', role: '총괄', specialty: '계획 · 업무 분배 · 검토 · 종합', model: 'Mock · 총괄 시뮬레이터', x: .46, y: .47, shape: 0 },
  { id: 'seoyeon', name: '아카이브', role: '문서', specialty: '문서 분석 · 교정 · 논리 검토', model: 'Mock · 문서 시뮬레이터', x: .77, y: .46, shape: 1 },
  { id: 'doyun', name: '프리즘', role: '디자인', specialty: '화면 구성 · 시각 디자인', model: 'Mock · 디자인 시뮬레이터', x: .27, y: .68, shape: 2 },
  { id: 'taeo', name: '펄서', role: '개발', specialty: '구현 · 테스트 · 오류 수정', model: 'Mock · 개발 시뮬레이터', x: .16, y: .35, shape: 3 },
], missions: [],projects:[{...DEFAULT_PROJECT}],activeProjectId:DEFAULT_PROJECT.id };
export function readWorkspace(): Workspace {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (data?.version === 1 && Array.isArray(data.employees) && data.employees.length && data.employees.every((e: Employee) => typeof e.id === 'string' && typeof e.name === 'string' && typeof e.role === 'string' && typeof e.specialty === 'string' && typeof e.model === 'string' && Number.isFinite(e.x) && Number.isFinite(e.y) && Number.isInteger(e.shape)) && Array.isArray(data.missions) && data.missions.every((m: Mission) => typeof m.id === 'string' && typeof m.title === 'string' && Array.isArray(m.members) && typeof m.lead === 'string' && Number.isFinite(m.started) && m.ratings && typeof m.ratings === 'object')) {
      const previousNames: Record<string, string[]> = { jiu: ['지우','루멘'], seoyeon: ['서연','노바'], doyun: ['도윤','베가'], taeo: ['태오','리겔'] };
      // Migrate only the original defaults; preserve user-created/custom names and all records.
      const employees = data.employees.map((e: Employee) => ({ ...e, name:previousNames[e.id]?.includes(e.name)?seed.employees.find(s=>s.id===e.id)!.name:e.name, notes:Array.isArray(e.notes)?e.notes.filter(n=>n&&typeof n.id==='string'&&typeof n.text==='string'&&Number.isFinite(n.created)&&Number.isFinite(n.updated)):[] }));
      const projectData=normalizeProjectData(data);
      return { ...data,...projectData,employees,missions:completeExpired(projectData.missions,Date.now()) };
    }
  } catch { /* Unavailable/corrupt storage falls back to a usable local session. */ }
  return { ...structuredClone(seed), employees: seed.employees.map((e, i) => ({ ...e, x: .12 + ((i % 2) + .2 + Math.random() * .65) * .36, y: .32 + (Math.floor(i / 2) + Math.random() * .55) * .21 })) };
}
export function activeFor(missions: Mission[], id: string) { return missions.find(m => !m.ended && (m.lead === id || m.members.includes(id))); }
export function recentCount(missions: Mission[], id: string) { return missions.filter(m => m.ended && !m.cancelled && m.ended > Date.now() - 7 * 86400_000 && (m.lead === id || m.members.includes(id))).length; }
export function average(missions: Mission[], id: string, field: 'user' | 'lead') {
  const scores = missions.filter(m => m.ended && !m.cancelled).flatMap(m => { const n = m.ratings[id]?.[field]; return typeof n === 'number' ? [n] : []; });
  return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';
}
