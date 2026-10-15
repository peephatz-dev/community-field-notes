'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SITE_WORLD, WATER_TRANSITION, MONITORING_ZONES, worldToSite } from '@/lib/site-layout';
import { BATHYMETRY_GLSL, environmentReadout, VERTICAL_SCALE, WATER_DATUM, type EnvironmentState } from '@/lib/environment-model';

type WaterShader = { uniforms: { uWaveTime: { value: number }; [key: string]: { value: unknown } }; vertexShader: string; fragmentShader: string };

export type SiteWaterProps = {
  reducedMotion?: boolean; mobile?: boolean; quality?: 'low' | 'balanced' | 'high';
  environment?:EnvironmentState; minute?:number; running?:boolean; playbackSpeed?:number;
  onInspect?:(point:[number,number])=>void;
};

/**
 * Original procedural water. Its two image-relative colors reproduce only the
 * visible contrast in the supplied reference; they do not classify salinity.
 * The boundary stays fixed while wind ripples animate across its surface.
 */
export function SiteWater({ reducedMotion = false, mobile = false, quality = 'balanced', environment, minute=0, running=true, playbackSpeed=1, onInspect }: SiteWaterProps) {
  const shader = useRef<WaterShader | null>(null);
  const phase=useRef(0);
  const readout=environment?environmentReadout(environment,minute):null;
  const enabled=!!environment?.enabled,inspection=!!environment?.inspection;
  const waterLevel=enabled&&readout?readout.waterLevel:0;
  const waterY=WATER_DATUM+waterLevel*VERTICAL_SCALE;
  const uniforms=useMemo(()=>({
    uWaveTime:{value:0},uWaveStrength:{value:1},uWindDirection:{value:new THREE.Vector2(1,0)},uLayer:{value:0},uWaterLevel:{value:0},
    uZoneSalinity:{value:new THREE.Vector3(25.2,28.4,31.2)},uZoneTemperature:{value:new THREE.Vector3(29.1,29,28.9)},
    uZonePositions:{value:MONITORING_ZONES.map(zone=>new THREE.Vector2(...zone.point))},
  }),[]);
  const normalMap = useMemo(() => {
    const size = 256, data = new Uint8Array(size * size * 4);
    // Integer wavevectors make this original height field seamless. Each pair
    // of normal components is the gradient of the SAME phase, rather than two
    // unrelated patterns that create a checkerboard in reflected sunlight.
    const vectors = [[1,2],[2,1],[3,-2],[1,-4],[5,3],[6,-4],[4,7],[-8,5],[9,3],[5,-11],[12,7],[9,-14],[-17,5],[15,13],[21,-8]];
    const waves = vectors.map(([kx,ky],index) => ({
      kx, ky,
      phase: ((index * 2.3999632297 + .713) % (Math.PI * 2)),
      slope: (.13 - index * .004) / Math.hypot(kx,ky),
    }));
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size * Math.PI * 2, v = y / size * Math.PI * 2;
      let nx = 0, ny = 0;
      for (const wave of waves) {
        const gradient = -Math.cos(u * wave.kx + v * wave.ky + wave.phase) * wave.slope;
        nx += gradient * wave.kx;
        ny += gradient * wave.ky;
      }
      const inverseLength = 1 / Math.sqrt(nx * nx + ny * ny + 1), index = (y * size + x) * 4;
      data[index] = (nx * inverseLength * .5 + .5) * 255;
      data[index + 1] = (ny * inverseLength * .5 + .5) * 255;
      data[index + 2] = (inverseLength * .5 + .5) * 255; data[index + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat); texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.NoColorSpace;
    texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.generateMipmaps = true; texture.repeat.set(50, 50); texture.needsUpdate = true;
    return texture;
  }, []);
  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: .42, clearcoat: .28, clearcoatRoughness: .31, ior: 1.333, envMapIntensity: .55, normalMap, normalScale: new THREE.Vector2(.17, .17) });
    mat.onBeforeCompile = compiled => {
      Object.assign(compiled.uniforms,uniforms);
      compiled.uniforms.uSiteOrigin = { value: new THREE.Vector2(...SITE_WORLD.origin) };
      compiled.uniforms.uSiteExtent = { value: new THREE.Vector2(SITE_WORLD.width, SITE_WORLD.depth) };
      compiled.uniforms.uTransition = { value: WATER_TRANSITION.line.map(point => new THREE.Vector2(...point)) };
      compiled.uniforms.uTransitionFeather = { value: WATER_TRANSITION.feather };
      compiled.uniforms.uInnerWater = { value: new THREE.Color(WATER_TRANSITION.upperColor) };
      compiled.uniforms.uOuterWater = { value: new THREE.Color(WATER_TRANSITION.lowerColor) };
      compiled.vertexShader = `uniform float uWaveTime;
        uniform float uWaveStrength;
        uniform vec2 uWindDirection;
        uniform vec2 uSiteOrigin;
        uniform vec2 uSiteExtent;
        varying vec2 vSitePosition;
        ${compiled.vertexShader}`.replace('#include <beginnormal_vertex>', `
        #include <beginnormal_vertex>
        vec2 windAlong=normalize(vec2(uWindDirection.x,-uWindDirection.y));
        vec2 windAcross=vec2(-windAlong.y,windAlong.x);
        vec2 wavePosition=vec2(dot(position.xy,windAlong),dot(position.xy,windAcross));
        float waveA = wavePosition.x * 0.48 + wavePosition.y * 0.37 - uWaveTime * 0.62;
        float waveB = wavePosition.x * -0.28 + wavePosition.y * 0.61 - uWaveTime * 0.41;
        vec2 waveGradient=windAlong*(cos(waveA)*0.48*0.035-cos(waveB)*0.28*0.026)+windAcross*(cos(waveA)*0.37*0.035+cos(waveB)*0.61*0.026);
        objectNormal = normalize(vec3(-waveGradient*uWaveStrength,1.0));
      `).replace('#include <begin_vertex>', `
        #include <begin_vertex>
        transformed.z += (sin(waveA) * 0.035 + sin(waveB) * 0.026) * uWaveStrength;
      `).replace('#include <project_vertex>', `
        #include <project_vertex>
        vec3 siteWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vSitePosition = siteWorldPosition.xz / uSiteExtent + uSiteOrigin;
      `);
      compiled.fragmentShader = `
        varying vec2 vSitePosition;
        uniform vec2 uTransition[5];
        uniform float uTransitionFeather;
        uniform vec3 uInnerWater;
        uniform vec3 uOuterWater;
        uniform int uLayer;
        uniform float uWaterLevel;
        uniform vec3 uZoneSalinity;
        uniform vec3 uZoneTemperature;
        uniform vec2 uZonePositions[3];
        ${BATHYMETRY_GLSL}
        float assumedZoneValue(vec3 values,vec2 point) {
          vec2 a=(point-uZonePositions[0])*vec2(1.0,1.560);
          vec2 b=(point-uZonePositions[1])*vec2(1.0,1.560);
          vec2 c=(point-uZonePositions[2])*vec2(1.0,1.560);
          vec3 weights=1.0/(vec3(dot(a,a),dot(b,b),dot(c,c))+vec3(0.008));
          return dot(values,weights)/max(0.001,weights.x+weights.y+weights.z);
        }
        float observedColorBoundary(float u) {
          float boundary = uTransition[0].y;
          for (int i = 0; i < 4; i++) {
            if (u >= uTransition[i].x || i == 0) {
              float t = clamp((u - uTransition[i].x) / max(0.001, uTransition[i + 1].x - uTransition[i].x), 0.0, 1.0);
              boundary = mix(uTransition[i].y, uTransition[i + 1].y, t);
            }
          }
          return boundary;
        }
        ${compiled.fragmentShader}`.replace('#include <color_fragment>', `
          #include <color_fragment>
          float boundary = observedColorBoundary(vSitePosition.x);
          float outerMix = smoothstep(boundary - uTransitionFeather * 0.5, boundary + uTransitionFeather * 0.5, vSitePosition.y);
          // Gentle original variation avoids a perfectly flat painted surface.
          float mottling = sin(vSitePosition.x * 93.0 + vSitePosition.y * 46.0) * sin(vSitePosition.y * 71.0) * 0.026;
          vec3 waterColor=mix(uInnerWater, uOuterWater, outerMix);
          if(uLayer==1) {
            float depth=max(0.0,uWaterLevel-assumedSeabedElevation(vSitePosition));
            waterColor=mix(vec3(0.44,0.30,0.10),vec3(0.02,0.18,0.27),clamp(depth/6.2,0.0,1.0));
          } else if(uLayer==2) {
            float salinity=assumedZoneValue(uZoneSalinity,vSitePosition);
            waterColor=mix(vec3(0.018,0.16,0.30),vec3(0.025,0.31,0.23),clamp(salinity/25.0,0.0,1.0));
            waterColor=mix(waterColor,vec3(0.48,0.21,0.055),clamp((salinity-25.0)/20.0,0.0,1.0));
          } else if(uLayer==3) {
            float temperature=assumedZoneValue(uZoneTemperature,vSitePosition);
            waterColor=mix(vec3(0.018,0.19,0.33),vec3(0.48,0.105,0.045),clamp((temperature-20.0)/16.0,0.0,1.0));
          }
          diffuseColor.rgb *= waterColor * (1.0 + mottling);
        `);
      shader.current = compiled as unknown as WaterShader;
    };
    mat.customProgramCacheKey = () => 'lung-thong-synthetic-environment-water-v2'; return mat;
  }, [normalMap,uniforms]);
  useEffect(()=>{
    material.transparent=inspection;material.opacity=inspection?.25:1;material.depthWrite=!inspection;material.needsUpdate=true;
  },[inspection,material]);
  useEffect(() => () => { normalMap.dispose(); material.dispose(); }, [normalMap, material]);
  useFrame((_, delta) => {
    const windStrength=enabled&&readout?Math.min(2.2,.55+readout.wind/10):1;
    const windAngle=enabled&&readout?(readout.windDirection-90)*Math.PI/180:0;
    const windX=Math.cos(windAngle),windZ=Math.sin(windAngle);
    uniforms.uWindDirection.value.set(windX,windZ);
    uniforms.uWaveStrength.value=windStrength;
    uniforms.uWaterLevel.value=waterLevel;
    uniforms.uLayer.value=environment?.layer==='depth'?1:environment?.layer==='salinity'?2:environment?.layer==='temperature'?3:0;
    if(environment){const {A,B,C}=environment.zones;uniforms.uZoneSalinity.value.set(A.salinity,B.salinity,C.salinity);uniforms.uZoneTemperature.value.set(A.temperature,B.temperature,C.temperature);}
    material.normalScale.set(.17*windStrength,.17*windStrength);
    if (reducedMotion||!running) return;
    const elapsed=Math.min(delta,.1)*Math.max(.1,playbackSpeed);
    phase.current+=elapsed;
    uniforms.uWaveTime.value=phase.current;
    normalMap.offset.x -= elapsed * .003 * windStrength * windX; normalMap.offset.y += elapsed * .003 * windStrength * windZ;
  });
  const segments = mobile ? 64 : quality === 'high' ? 144 : 100;
  return <mesh name={enabled?'SYNTHETIC_ENVIRONMENT_WATER':'OBSERVED_WATER_COLOR_RECONSTRUCTION'} rotation={[-Math.PI / 2, 0, 0]} position={[0, waterY, 0]} material={material} receiveShadow onClick={event=>{
    if(!inspection||!onInspect||event.delta>5)return;
    event.stopPropagation();const [u,v]=worldToSite(event.point.x,event.point.z);
    onInspect([Math.min(1,Math.max(0,u)),Math.min(1,Math.max(0,v))]);
  }}>
    <planeGeometry args={[700, 700, segments, segments]} />
  </mesh>;
}

/** Compatibility for older consumers; the active scene uses SiteWater. */
export const LakeWater = SiteWater;
