import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { NODE_DEFINITIONS } from '../src/lib/model.ts';
import { BUILDINGS, BOATS, CAGE_RUNS, CAGE_CELLS, CANDIDATE_NODES, LANDMARKS, MONITORING_ZONES, PIERS, ROADS, SHORELINE, SITE_MONITORING_MARKERS, SITE_REFERENCE, SITE_WORLD, VEGETATION, WATER_TRANSITION, siteToWorld, worldToSite } from '../src/lib/site-layout.ts';

function normalized(point) {
  assert.ok(point.every(value => Number.isFinite(value) && value >= 0 && value <= 1), `outside normalized trace: ${point}`);
}

test('site trace anchors and reconstruction footprints remain inside the normalized reference crop', () => {
  [...SHORELINE, ...ROADS.flatMap(line => line.points), ...PIERS.flatMap(line => line.points), ...WATER_TRANSITION.line,
    ...BUILDINGS.map(item => item.center), ...BOATS.map(item => item.center), ...VEGETATION.map(item => item.center),
    ...CAGE_RUNS.flatMap(run => [run.from, run.to]), ...CAGE_CELLS.map(item => item.center),
    ...LANDMARKS.map(item => item.point), ...MONITORING_ZONES.map(item => item.point)].forEach(normalized);
  assert.ok(SITE_REFERENCE.crop.x + SITE_REFERENCE.crop.width <= SITE_REFERENCE.imageWidth);
  assert.ok(SITE_REFERENCE.crop.y + SITE_REFERENCE.crop.height <= SITE_REFERENCE.imageHeight);
});

test('world conversion preserves relative site coordinates and crop aspect without asserting real-world metres', () => {
  for (const uv of [[0, 0], [1, 1], [.42, .5], ...Object.values(CANDIDATE_NODES).map(node => node.uv)]) {
    const [x, y, z] = siteToWorld(...uv, .24), restored = worldToSite(x, z);
    assert.equal(y, .24);
    assert.ok(Math.abs(restored[0] - uv[0]) < 1e-12);
    assert.ok(Math.abs(restored[1] - uv[1]) < 1e-12);
  }
  assert.ok(Math.abs(SITE_WORLD.depth / SITE_WORLD.width - SITE_REFERENCE.crop.height / SITE_REFERENCE.crop.width) < 1e-12);
});

test('reconstructed cage runs retain ordered distinct clusters and nonuniform geometry rather than one invented grid', () => {
  const groups = new Map();
  for (const run of CAGE_RUNS) {
    const coordinates = groups.get(run.group) ?? [];
    coordinates.push((run.from[1] + run.to[1]) / 2); groups.set(run.group, coordinates);
    assert.ok(run.width > 0 && run.columns > 0 && run.rows > 0);
  }
  const centers = [...groups.values()].map(values => values.reduce((sum, value) => sum + value, 0) / values.length);
  assert.ok(centers.every((value, i) => i === 0 || value > centers[i - 1]));
  assert.ok(groups.size > 2);
  assert.ok(new Set(CAGE_RUNS.map(run => run.columns)).size > 1);
  assert.ok(new Set(CAGE_RUNS.map(run => run.width)).size > 1);
  assert.ok(new Set(CAGE_CELLS.map(cell => cell.angleDeg.toFixed(2))).size > 1);
  assert.equal(new Set(CAGE_CELLS.map(cell => cell.id)).size, CAGE_CELLS.length);
});

test('P0–P3 candidates are explicitly proposed and have one visual position source', () => {
  assert.deepEqual(Object.keys(CANDIDATE_NODES).sort(), ['P0', 'P1', 'P2', 'P3']);
  for (const node of Object.values(CANDIDATE_NODES)) {
    normalized(node.uv);
    assert.equal(node.status, 'PROPOSED');
    assert.ok(node.rationale.length > 0);
    const uv = worldToSite(node.position[0], node.position[2]);
    assert.ok(Math.abs(uv[0] - node.uv[0]) < 1e-12 && Math.abs(uv[1] - node.uv[1]) < 1e-12);
  }
  assert.ok(NODE_DEFINITIONS.every(node => !Object.hasOwn(node, 'position')));
});

test('observed water colors and conceptual comparison markers carry no measurement claim', () => {
  assert.equal(WATER_TRANSITION.measured, false);
  assert.deepEqual(SITE_MONITORING_MARKERS.map(marker => marker.zone).sort(), ['B', 'C']);
  assert.ok(SITE_MONITORING_MARKERS.every(marker => marker.instrumented === false));
  assert.ok(!Object.hasOwn(WATER_TRANSITION, 'salinity'));
  assert.ok(MONITORING_ZONES.every(zone => !Object.hasOwn(zone, 'salinity') && !Object.hasOwn(zone, 'dissolvedOxygen')));
});

test('public media remain declared licensed/data-pack assets rather than a deployed site screenshot or map tile', async () => {
  const publicRoot = new URL('../public/', import.meta.url), manifest = JSON.parse(await readFile(new URL('assets/asset-manifest.json', publicRoot), 'utf8'));
  const declared = new Set(manifest.map(asset => `assets/${asset.path}`));
  const powerguard=JSON.parse(await readFile(new URL('powerguard/ASSET_MANIFEST.json',publicRoot),'utf8'));
  powerguard.assets.forEach(asset=>declared.add(asset.path.replace(/^\//,'')));
  async function files(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(entries.map(entry => entry.isDirectory() ? files(new URL(`${entry.name}/`, directory)) : [new URL(entry.name, directory)]));
    return nested.flat();
  }
  for (const file of await files(publicRoot)) {
    const path = relative(publicRoot.pathname, file.pathname);
    if (/\.(?:png|jpe?g|webp|hdr|glb)$/i.test(path)) assert.ok(declared.has(path), `undeclared public media: ${path}`);
    assert.ok(!/(?:screenshot|satellite|google[-_]?map|map[-_]?tile)/i.test(path), `private map reference deployed: ${path}`);
  }
});
