'use client';

import { useFrame, useThree, type ThreeElements } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import * as THREE from 'three';

type Props = Omit<ThreeElements['group'], 'children'> & {
  children: ReactNode;
  center?: boolean;
  avoidOverlap?: boolean;
  selected?: boolean;
  distanceFactor?: number;
  zIndexRange?: [number, number];
  style?: CSSProperties;
  className?: string;
};

type LabelBox={x:number;y:number;selected:boolean;visible:boolean};
const placements=new WeakMap<HTMLElement,Map<HTMLElement,LabelBox>>();
const lanes=[[0,0],[0,58],[0,-58],[135,0],[-135,0]] as const;

/** A screen-space label with deferred DOM-root disposal for concurrent React. */
export function SpatialHtml({ children, center = false, avoidOverlap=false, selected=false, distanceFactor, zIndexRange = [10, 0], style, className, ...groupProps }: Props) {
  const group = useRef<THREE.Group>(null);
  const element = useRef<HTMLDivElement | null>(null);
  const root = useRef<Root | null>(null);
  const { gl } = useThree();
  const vectors = useMemo(() => ({ world: new THREE.Vector3(), projected: new THREE.Vector3(), camera: new THREE.Vector3() }), []);

  useLayoutEffect(() => {
    const target = gl.domElement.parentElement;
    if (!target) return;
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;top:0;left:0;transform-origin:0 0;pointer-events:none;';
    const domRoot = createRoot(el);
    element.current = el; root.current = domRoot;
    target.appendChild(el);
    if(avoidOverlap){let boxes=placements.get(target);if(!boxes){boxes=new Map();placements.set(target,boxes);}boxes.set(el,{x:0,y:0,selected,visible:false});}
    return () => {
      placements.get(target)?.delete(el);
      el.remove();
      if (root.current === domRoot) { root.current = null; element.current = null; }
      // The outer R3F root may still be committing its unmount. Dispose afterward.
      queueMicrotask(() => domRoot.unmount());
    };
  }, [gl,avoidOverlap]);

  useLayoutEffect(() => {
    root.current?.render(<div className={className} style={{ position: 'absolute', transform: center ? 'translate(-50%, -50%)' : undefined, pointerEvents: 'auto', ...style }}>{children}</div>);
  });

  useFrame(({ camera, size }) => {
    const el = element.current, object = group.current;
    if (!el || !object) return;
    object.getWorldPosition(vectors.world);
    vectors.projected.copy(vectors.world).project(camera);
    camera.getWorldPosition(vectors.camera);
    const distance = vectors.world.distanceTo(vectors.camera);
    let visible = vectors.projected.z > -1 && vectors.projected.z < 1 && Math.abs(vectors.projected.x)<1.08 && Math.abs(vectors.projected.y)<1.08;
    el.style.display = visible ? 'block' : 'none';
    if (!visible){const box=el.parentElement&&placements.get(el.parentElement)?.get(el);if(box)box.visible=false;return;}
    let x = (vectors.projected.x * .5 + .5) * size.width;
    let y = (-vectors.projected.y * .5 + .5) * size.height;
    if(avoidOverlap&&el.parentElement){const boxes=placements.get(el.parentElement),own=boxes?.get(el);if(own&&boxes){let found=false;own.selected=selected;
      for(const [dx,dy] of lanes){const nx=x+dx,ny=y+dy;if(nx<66||nx>size.width-66||ny<28||ny>size.height-28)continue;let blocked=false;
       for(const [other,b] of boxes){if(other!==el&&b.visible&&(!selected||b.selected)&&Math.abs(nx-b.x)<130&&Math.abs(ny-b.y)<49){blocked=true;break;}}
       if(!blocked){x=nx;y=ny;found=true;break;}}
      own.x=x;own.y=y;own.visible=found;visible=visible&&found;el.style.display=visible?'block':'none';if(!visible)return;
    }}
    const scale = distanceFactor && camera instanceof THREE.PerspectiveCamera ? distanceFactor / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance) : 1;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    el.style.zIndex = String(Math.round(zIndexRange[0] + (zIndexRange[1] - zIndexRange[0]) * distance / camera.far));
  });

  return <group ref={group} {...groupProps} />;
}
