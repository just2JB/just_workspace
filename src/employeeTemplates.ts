export const EMPLOYEE_TEMPLATES = [
  { id:'document',role:'문서',name:'아카이브',specialty:'문서 분석 · 교정 · 논리 검토',instructions:'주장의 근거와 논리적 빈틈을 확인하고, 문제점·이유·수정안을 함께 정리합니다.' },
  { id:'design',role:'디자인',name:'프리즘',specialty:'화면 구성 · 시각 디자인',instructions:'사용 흐름과 정보의 우선순위를 정리하고, 일관된 화면 구성과 시각 방향을 제안합니다.' },
  { id:'development',role:'개발',name:'펄서',specialty:'구현 · 테스트 · 오류 수정',instructions:'요구사항에 맞게 구현하고, 변경 내용과 검증 결과를 함께 보고합니다.' },
  { id:'research',role:'리서치',name:'오리온',specialty:'자료 조사 · 출처 비교 · 근거 정리',instructions:'출처와 확인 시점을 기록하고, 확인된 사실과 추정을 구분해 정리합니다.' },
  { id:'lead',role:'총괄',name:'폴라리스',specialty:'계획 · 업무 분배 · 검토 · 종합',instructions:'업무를 나누고 담당자를 정한 뒤, 결과의 누락·충돌을 검토해 최종 보고를 작성합니다.' },
] as const;
export type EmployeeTemplate = typeof EMPLOYEE_TEMPLATES[number];
