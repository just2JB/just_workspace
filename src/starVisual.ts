export const LEAD_PIXELS = [
  '00000000100000000','00000000100000000','00100001110000100',
  '00010001110001000','00001111111110000','00001111111110000',
  '00011111111111000','00111111111111100','11111111111111111',
  '00111111111111100','00011111111111000','00001111111110000',
  '00001111111110000','00010001110001000','00100001110000100',
  '00000000100000000','00000000100000000',
];
export function roleColor(role: string): string {
  const colors: Record<string,string> = { '총괄':'#ffd58c', '문서':'#7ce6c5', '디자인':'#bd9aff', '개발':'#78b7ff', '리서치':'#ff9fbd', '기획':'#ffb786', '데이터':'#84d8ef', '마케팅':'#efb6df' };
  if (colors[role]) return colors[role];
  const palette=['#efaa7d','#9ed795','#83cde0','#aaa8f2','#e69ac6','#d8cc87'];
  let hash=0;for(const c of role)hash=(hash*31+c.charCodeAt(0))>>>0;
  return palette[hash%palette.length];
}
