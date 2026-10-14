'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SITE_WORLD, WATER_TRANSITION } from '@/lib/site-layout';

type WaterShader = { uniforms: { uWaveTime: { value: number }; [key: string]: { value: unknown } }; vertexShader: string; fragmentShader: string };

type SiteWaterProps = { reducedMotion?: boolean; mobile?: boolean; quality?: 'balanced' | 'high' };

/**
 * Original procedural water. Its two image-relative colors reproduce only the
 * visible contrast in the supplied reference; they do not classify salinity.
 * The boundary stays fixed while wind ripples animate across its surface.
 */
export function SiteWater({ reducedMotion = false, mobile = false, quality = 'balanced' }: SiteWaterProps) {
  const shader = useRef<WaterShader | null>(null);
  const normalMap = useMemo(() => {
    const size = 128, data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size * Math.PI * 2, v = y / size * Math.PI * 2;
      const nx = Math.cos(u * 9 + v * 3) * .25 + Math.cos(u * 14 - v * 6) * .13;
      const ny = Math.cos(v * 11 + u * 2) * .21 + Math.cos(v * 18 + u * 5) * .12;
      const inverseLength = 1 / Math.sqrt(nx * nx + ny * ny + 1), index = (y * size + x) * 4;
      data[index] = (nx * inverseLength * .5 + .5) * 255;
      data[index + 1] = (ny * inverseLength * .5 + .5) * 255;
      data[index + 2] = (inverseLength * .5 + .5) * 255; data[index + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat); texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.NoColorSpace;
    texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.generateMipmaps = true; texture.repeat.set(210, 210); texture.needsUpdate = true;
    return texture;
  }, []);
  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: .36, clearcoat: .42, clearcoatRoughness: .24, ior: 1.333, envMapIntensity: .55, normalMap, normalScale: new THREE.Vector2(.18, .18) });
    mat.onBeforeCompile = compiled => {
      compiled.uniforms.uWaveTime = { value: 0 };
      compiled.uniforms.uSiteOrigin = { value: new THREE.Vector2(...SITE_WORLD.origin) };
      compiled.uniforms.uSiteExtent = { value: new THREE.Vector2(SITE_WORLD.width, SITE_WORLD.depth) };
      compiled.uniforms.uTransition = { value: WATER_TRANSITION.line.map(point => new THREE.Vector2(...point)) };
      compiled.uniforms.uTransitionFeather = { value: WATER_TRANSITION.feather };
      compiled.uniforms.uInnerWater = { value: new THREE.Color(WATER_TRANSITION.upperColor) };
      compiled.uniforms.uOuterWater = { value: new THREE.Color(WATER_TRANSITION.lowerColor) };
      compiled.vertexShader = `uniform float uWaveTime;
        uniform vec2 uSiteOrigin;
        uniform vec2 uSiteExtent;
        varying vec2 vSitePosition;
        ${compiled.vertexShader}`.replace('#include <beginnormal_vertex>', `
        #include <beginnormal_vertex>
        float waveA = position.x * 0.48 + position.y * 0.37 + uWaveTime * 0.62;
        float waveB = position.x * -0.28 + position.y * 0.61 + uWaveTime * 0.41;
        objectNormal = normalize(vec3(-cos(waveA) * 0.48 * 0.035 + cos(waveB) * 0.28 * 0.026, -cos(waveA) * 0.37 * 0.035 - cos(waveB) * 0.61 * 0.026, 1.0));
      `).replace('#include <begin_vertex>', `
        #include <begin_vertex>
        transformed.z += sin(waveA) * 0.035 + sin(waveB) * 0.026;
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
          diffuseColor.rgb *= mix(uInnerWater, uOuterWater, outerMix) * (1.0 + mottling);
        `);
      shader.current = compiled as unknown as WaterShader;
    };
    mat.customProgramCacheKey = () => 'lung-thong-image-relative-water-v1'; return mat;
  }, [normalMap]);
  useEffect(() => () => { normalMap.dispose(); material.dispose(); }, [normalMap, material]);
  useFrame(({ clock }, delta) => {
    if (reducedMotion) return;
    if (shader.current) shader.current.uniforms.uWaveTime.value = clock.elapsedTime;
    normalMap.offset.x += delta * .003; normalMap.offset.y += delta * .0015;
  });
  const segments = mobile ? 64 : quality === 'high' ? 144 : 100;
  return <mesh name="OBSERVED_WATER_COLOR_RECONSTRUCTION" rotation={[-Math.PI / 2, 0, 0]} position={[0, -.115, 0]} material={material} receiveShadow>
    <planeGeometry args={[700, 700, segments, segments]} />
  </mesh>;
}

/** Compatibility for older consumers; the active scene uses SiteWater. */
export const LakeWater = SiteWater;
