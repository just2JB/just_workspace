import { useEffect, useRef, useState } from 'react';
import type { Employee, Mission } from './model';
import { activeFor, DURATION } from './model';
import { Maximize2, Minus, Plus } from 'lucide-react';
import { DEFAULT_CAMERA, toWorld, zoomAt } from './camera';
import type { Point } from './camera';
import { LEAD_PIXELS, roleColor } from './starVisual';

const pixels = [
  '0000001000000', '0000001000000', '0000011100000', '0000011100000', '0011111111100', '1111111111111', '0011111111100', '0001111111000', '0001111111000', '0011101011100', '0011000001100', '0110000000110', '0100000000010',
];
export function StarIcon({ small=false, role, lead=role==='총괄' }: { small?:boolean; role?:string; lead?:boolean }) {
  const sprite=lead?LEAD_PIXELS:pixels,color=role?roleColor(role):'#c8ced9';
  return <svg className={small?'star-icon small':'star-icon'} style={{filter:`drop-shadow(0 0 8px ${color}55)`}} viewBox={`0 0 ${sprite.length} ${sprite.length}`} aria-hidden="true" shapeRendering="crispEdges">{sprite.flatMap((row,y)=>[...row].map((v,x)=>v==='1'?<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={Math.abs(x-sprite.length/2)<1.5&&Math.abs(y-sprite.length/2)<1.5?'#fff':color}/>:null))}</svg>;
}
type Props = { employees: Employee[]; missions: Mission[]; selected: string | null; onSelect: (id: string | null) => void; onMove: (id: string, x: number, y: number) => void; reduced: boolean; onMission: () => void; };
export default function Universe({ employees, missions, selected, onSelect, onMove, reduced, onMission }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef({ employees, missions, selected, reduced });
  latest.current = { employees, missions, selected, reduced };
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const flights = useRef(new Map<string, { key: string; from: { x: number; y: number }; started: number }>());
  const drag = useRef<{ id?:string; moved:boolean; start:Point; current:Point; pan:Point; offset:Point } | null>(null);
  const camera=useRef({...DEFAULT_CAMERA});
  const dimensions=useRef({width:800,height:600});
  const spaceHeld=useRef(false);
  const [dragging,setDragging]=useState(false);
  const [zoom,setZoom]=useState(1);
  const [hover, setHover] = useState<string | null>(null);
  const hoverRef = useRef(hover); hoverRef.current = hover;
  function changeZoom(scale:number,point?:Point){const {width,height}=dimensions.current;camera.current=zoomAt(camera.current,point||{x:width/2,y:height/2},scale);setZoom(camera.current.scale);}
  function resetView(){camera.current={...DEFAULT_CAMERA};setZoom(1);}
  useEffect(()=>{
    const el=canvas.current!;
    const wheel=(event:WheelEvent)=>{event.preventDefault();const r=el.getBoundingClientRect();changeZoom(camera.current.scale*Math.exp(-event.deltaY*.0015),{x:event.clientX-r.left,y:event.clientY-r.top});};
    const down=(event:KeyboardEvent)=>{if(event.code!=='Space'||!(event.target instanceof Element)||event.target.closest('input,textarea,select,button,[role="dialog"],[contenteditable]'))return;event.preventDefault();spaceHeld.current=true;};
    const up=(event:KeyboardEvent)=>{if(event.code==='Space')spaceHeld.current=false;};
    const blur=()=>{spaceHeld.current=false;drag.current=null;setDragging(false);};
    el.addEventListener('wheel',wheel,{passive:false});window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
    return()=>{el.removeEventListener('wheel',wheel);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
  },[]);
  useEffect(()=>{
    if(!selected)return;const p=positions.current.get(selected);if(!p)return;
    const {width,height}=dimensions.current,c=camera.current,x=p.x*c.scale+c.x,y=p.y*c.scale+c.y;
    if(x<45||x>width-45||y<45||y>height-100)camera.current={...c,x:width/2-p.x*c.scale,y:height/2-p.y*c.scale};
  },[selected]);
  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext('2d')!;
    let width = 0, height = 0, frame = 0;
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width; height = entry.contentRect.height;
      dimensions.current={width,height};
      const dpr = Math.min(devicePixelRatio || 1, 2);
      el.width = width * dpr; el.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    resize.observe(el);
    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const { employees: es, missions: ms, selected: pick, reduced: still } = latest.current;
      const cameraView=camera.current;
      // Deterministic square-pixel starfield, with animation isolated from React.
      for (let i = 0; i < 150; i++) {
        const wrap=(n:number,max:number)=>((n%max)+max)%max;
        const x = wrap(((i * 127.31 + 23) % 997) / 997 * width+cameraView.x*.22,width);
        const y = wrap(((i * 91.71 + 19) % 991) / 991 * height+cameraView.y*.22,height);
        const a = still ? .24 : .13 + (Math.sin(time / 2200 + i * 7) + 1) * .13;
        ctx.fillStyle = `rgba(188,199,219,${a})`; ctx.fillRect(Math.round(x), Math.round(y), i % 19 === 0 ? 2 : 1, i % 19 === 0 ? 2 : 1);
        if (i % 31 === 0) { ctx.fillRect(x - 2, y, 5, 1); ctx.fillRect(x, y - 2, 1, 5); }
      }
      ctx.save();ctx.translate(cameraView.x,cameraView.y);ctx.scale(cameraView.scale,cameraView.scale);
      // Background and employees share world coordinates, independent of the viewport.
      const cell = 7, mx = -25, my = height + 26, radius = Math.min(width * .18, 158);
      for (let y = -radius; y < radius; y += cell) for (let x = -radius; x < radius; x += cell) {
        if (x*x+y*y < radius*radius) {
          const edge = Math.sqrt(x*x+y*y) / radius;
          const noise = Math.abs(Math.sin(x * 13 + y * 7));
          const c = Math.floor(22 + (1-edge)*16 + noise*13);
          ctx.fillStyle = `rgb(${c},${c+3},${c+10})`; ctx.fillRect(mx+x, my+y, cell, cell);
        }
      }
      const w = Math.max(200, width), h = Math.max(200, height);
      const target = (e: Employee) => ({ x:e.x*w,y:e.y*h });
      for (const m of ms.filter(m => !m.ended)) {
        const lead = es.find(e => e.id === m.lead); if (!lead) continue;
        const p=target(lead),rx=Math.min(w*.19,140),ry=Math.min(h*.16,102);
        ctx.strokeStyle = roleColor(lead.role)+'55'; ctx.lineWidth = 1/cameraView.scale; ctx.setLineDash([3, 6]);
        ctx.beginPath(); ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = '11px "Segoe UI", sans-serif'; ctx.fillStyle = '#8994a7'; ctx.textAlign = 'center';
        const taskName=m.project?`${m.project.name} · ${m.title}`:m.title;
        const title = taskName.length > 26 ? taskName.slice(0, 26)+'…' : taskName;
        ctx.fillText(title, p.x, p.y - ry - 20);
      }
      for (const e of es) {
        let p = target(e);
        const m = activeFor(ms, e.id);
        if (m && m.lead !== e.id) {
          const lead = es.find(x => x.id === m.lead);
          if (lead) {
            const center = target(lead), index = m.members.indexOf(e.id);
            const angle = (still ? 0 : (Date.now()-m.started)/DURATION*Math.PI*2) + index * Math.PI*2 / m.members.length - Math.PI/2;
            const rx=Math.min(w*.19,140),ry=Math.min(h*.16,102);
            p = { x: center.x + Math.cos(angle)*rx, y: center.y + Math.sin(angle)*ry };
          }
        } else if (!m && !still) { p.x += Math.sin(time/6200+e.shape*2)*7; p.y += Math.cos(time/5100+e.shape*3)*6; }
        const previous = positions.current.get(e.id) || p;
        const key = m?.id || 'idle';
        let flight = flights.current.get(e.id);
        if (!flight || flight.key !== key) {
          flight = { key, from: { ...previous }, started: flight ? time : time - 900 };
          flights.current.set(e.id, flight);
        }
        // A short, frame-rate-independent flight toward the lead, then exact orbit tracking.
        const progress = still ? 1 : Math.min(1, (time - flight.started) / 850);
        const ease = 1 - Math.pow(1 - progress, 3);
        const smooth = { x: flight.from.x + (p.x-flight.from.x)*ease, y: flight.from.y + (p.y-flight.from.y)*ease };
        const speed = Math.hypot(smooth.x-previous.x,smooth.y-previous.y);
        if (!still && progress < 1 && speed > .8) {
          const dx=(smooth.x-previous.x)/speed, dy=(smooth.y-previous.y)/speed;
          for (let i=1;i<=7;i++) {
            const distance=i*5;
            ctx.fillStyle=roleColor(e.role)+Math.round((1-i/8)*96).toString(16).padStart(2,'0');
            ctx.fillRect(Math.round(smooth.x-dx*distance),Math.round(smooth.y-dy*distance),i<3?2:1,i<3?2:1);
          }
        }
        if (drag.current?.id === e.id && drag.current.moved) { smooth.x=drag.current.current.x-drag.current.offset.x; smooth.y=drag.current.current.y-drag.current.offset.y; }
        positions.current.set(e.id, smooth);
        const x = Math.round(smooth.x), y = Math.round(smooth.y);
        const isSelected = pick === e.id, isHovered = hoverRef.current === e.id;
        const isLead=m?m.lead===e.id:e.role==='총괄';
        const sprite=isLead?LEAD_PIXELS:pixels,color=roleColor(e.role);
        const size = isLead ? 2.2 : 1;
        const glow = ctx.createRadialGradient(x,y,1,x,y,isLead?56:isSelected?32:20);
        glow.addColorStop(0,color+'40');glow.addColorStop(1,color+'00');
        ctx.fillStyle = glow; ctx.fillRect(x-60,y-60,120,120);
        const pulse = still ? 1 : .82 + Math.sin(time/(m?320:1600)+e.shape)*.14;
        ctx.globalAlpha = pulse;
        sprite.forEach((row,yy)=>[...row].forEach((v,xx)=>{if(v==='1'){ctx.fillStyle=Math.abs(xx-sprite.length/2)<1.5&&Math.abs(yy-sprite.length/2)<1.5?'#fff':color;ctx.fillRect(Math.round(x+(xx-sprite.length/2)*size),Math.round(y+(yy-sprite.length/2)*size),Math.ceil(size),Math.ceil(size));}}));
        ctx.globalAlpha = 1;
        if (isSelected || isHovered) {
          ctx.strokeStyle=isSelected?color:'#637087';ctx.lineWidth=1/cameraView.scale;
          for (const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) { ctx.beginPath(); ctx.moveTo(x+sx*24,y+sy*17); ctx.lineTo(x+sx*24,y+sy*24); ctx.lineTo(x+sx*17,y+sy*24); ctx.stroke(); }
        }
        ctx.textAlign='center';ctx.font=`${isSelected?'600':'400'} 12px "Segoe UI",sans-serif`;ctx.fillStyle=isSelected?color:'#9ca7b9';ctx.fillText(e.name,x,y+(isLead?39:28));
        if(isHovered){ctx.font='10px "Segoe UI",sans-serif';ctx.fillStyle='#abb4c4';ctx.fillText(`${e.role} · ${m?'작업 중':'대기 중'}`,x,y+(isLead?56:45));}
      }
      ctx.restore();frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); };
  }, []);
  function pointer(event:React.PointerEvent<HTMLCanvasElement>){const r=event.currentTarget.getBoundingClientRect();return{x:event.clientX-r.left,y:event.clientY-r.top};}
  function hit(p:Point){return [...positions.current.entries()].reverse().find(([,pos])=>Math.hypot(pos.x-p.x,pos.y-p.y)<Math.max(22/camera.current.scale,14))?.[0];}
  function endDrag(event:React.PointerEvent<HTMLCanvasElement>,cancelled=false){const d=drag.current;if(!d)return;if(!cancelled){if(d.id){if(d.moved)onMove(d.id,(d.current.x-d.offset.x)/Math.max(200,dimensions.current.width),(d.current.y-d.offset.y)/Math.max(200,dimensions.current.height));onSelect(d.id);}else if(!d.moved)onSelect(null);}drag.current=null;setDragging(false);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}
  return <div className="universe">
    <canvas ref={canvas} tabIndex={0} aria-label="우주 캔버스. 빈 곳을 드래그하면 화면 이동, 스크롤하면 확대·축소. 별을 드래그하면 배치 변경." onContextMenu={e=>e.preventDefault()}
      onPointerDown={event=>{if(drag.current)return;const screen=pointer(event),world=toWorld(screen,camera.current),id=!spaceHeld.current&&event.button===0?hit(world):undefined,p=id?positions.current.get(id)!:world;drag.current={id,moved:false,start:screen,current:world,pan:{x:camera.current.x,y:camera.current.y},offset:{x:world.x-p.x,y:world.y-p.y}};event.currentTarget.setPointerCapture(event.pointerId);setDragging(true);}}
      onPointerMove={event=>{const screen=pointer(event),world=toWorld(screen,camera.current),d=drag.current;if(d){if(Math.hypot(screen.x-d.start.x,screen.y-d.start.y)>3)d.moved=true;if(d.id){if(!activeFor(missions,d.id))d.current=world;else d.moved=false;}else if(d.moved)camera.current={...camera.current,x:d.pan.x+screen.x-d.start.x,y:d.pan.y+screen.y-d.start.y};}else setHover(hit(world)||null);}}
      onPointerUp={e=>endDrag(e)} onPointerCancel={e=>endDrag(e,true)} onLostPointerCapture={()=>{drag.current=null;setDragging(false);}} onPointerLeave={()=>{if(!drag.current)setHover(null);}} style={{cursor:dragging?'grabbing':hover?'pointer':'grab'}}/>
    <div className="canvas-tools"><button aria-label="축소" onClick={()=>changeZoom(camera.current.scale/1.2)}><Minus size={14}/></button><button className="zoom-value" aria-label="배율 100%로 초기화" onClick={()=>changeZoom(1)}>{Math.round(zoom*100)}%</button><button aria-label="확대" onClick={()=>changeZoom(camera.current.scale*1.2)}><Plus size={14}/></button><span/><button aria-label="처음 위치로 돌아가기" onClick={resetView}><Maximize2 size={14}/></button></div>
    <button className="mission-launch white-button" onClick={onMission}><Plus size={15}/> 업무 맡기기</button>
  </div>;
}
