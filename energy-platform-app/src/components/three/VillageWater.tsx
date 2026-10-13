'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

type WaterShader = { uniforms: { uWaveTime: { value: number }; [key: string]: { value: unknown } }; vertexShader: string; fragmentShader: string };

/** Opaque grey-green lake water follows the field references, with animated PBR normals and HDR sky reflections. */
export function LakeWater({ reducedMotion = false, mobile = false }: { reducedMotion?: boolean; mobile?: boolean }) {
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
    texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.generateMipmaps = true; texture.repeat.set(38, 38); texture.needsUpdate = true;
    return texture;
  }, []);
  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({ color: '#4a6253', metalness: 0, roughness: .27, clearcoat: .72, clearcoatRoughness: .17, ior: 1.333, envMapIntensity: .85, normalMap, normalScale: new THREE.Vector2(.17, .17) });
    mat.onBeforeCompile = compiled => {
      compiled.uniforms.uWaveTime = { value: 0 };
      compiled.vertexShader = `uniform float uWaveTime;\n${compiled.vertexShader}`.replace('#include <beginnormal_vertex>', `
        #include <beginnormal_vertex>
        float waveA = position.x * 0.48 + position.y * 0.37 + uWaveTime * 0.62;
        float waveB = position.x * -0.28 + position.y * 0.61 + uWaveTime * 0.41;
        objectNormal = normalize(vec3(-cos(waveA) * 0.48 * 0.035 + cos(waveB) * 0.28 * 0.026, -cos(waveA) * 0.37 * 0.035 - cos(waveB) * 0.61 * 0.026, 1.0));
      `).replace('#include <begin_vertex>', `
        #include <begin_vertex>
        transformed.z += sin(waveA) * 0.035 + sin(waveB) * 0.026;
      `);
      shader.current = compiled as unknown as WaterShader;
    };
    mat.customProgramCacheKey = () => 'salahum-pbr-water-v2'; return mat;
  }, [normalMap]);
  useEffect(() => () => { normalMap.dispose(); material.dispose(); }, [normalMap, material]);
  useFrame(({ clock }, delta) => {
    if (reducedMotion) return;
    if (shader.current) shader.current.uniforms.uWaveTime.value = clock.elapsedTime;
    normalMap.offset.x += delta * .003; normalMap.offset.y += delta * .0015;
  });
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.115, -8]} material={material} receiveShadow>
    <planeGeometry args={[130, 130, mobile ? 64 : 112, mobile ? 64 : 112]} />
  </mesh>;
}
