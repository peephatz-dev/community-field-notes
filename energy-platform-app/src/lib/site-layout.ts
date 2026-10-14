// Kept independent from model/store: the electrical model can import positions.
export type SiteNodeId = 'P0' | 'P1' | 'P2' | 'P3';

/** Image-relative trace. These are normalized design coordinates, not a survey. */
export type SitePoint = readonly [u: number, v: number];
export type WorldPoint = [x: number, y: number, z: number];
export type SiteFootprint = {
  id: string;
  center: SitePoint;
  /** Normalized screenshot width/depth, not real-world measurements. */
  size: SitePoint;
  /** Rotation in image pixels; positive angles turn clockwise in the image. */
  angleDeg: number;
  kind?: string;
};
export type SiteLine = { id: string; points: readonly SitePoint[]; width: number; certainty: 'visible' | 'approximate'; label?: string };
export type CageRun = {
  id: string;
  group: string;
  from: SitePoint;
  to: SitePoint;
  width: number;
  /** Representative reconstruction divisions; NOT verified cage counts. */
  columns: number;
  rows: number;
};

export const SITE_REFERENCE = {
  title: 'ท่าเรือลุงทอง · กระชังบ้านศาลาหุม',
  location: 'บ้านศาลาหุม อำเภอสิงหนคร จังหวัดสงขลา',
  mapsUrl: 'https://maps.app.goo.gl/ijj24HM8Fcy4gBfQ7?g_st=ic',
  imageWidth: 591,
  imageHeight: 1280,
  crop: { x: 0, y: 220, width: 591, height: 922 },
  orientation: 'ภาพอ้างอิง: ซ้าย–ขวา / บน–ล่าง · ยังไม่ยืนยันทิศเหนือ',
  provenance: 'ภาพหน้าจอที่ผู้ใช้ส่ง · วันที่ถ่ายภาพดาวเทียมและมาตราส่วนไม่ทราบ',
  reconstructionLabel: 'จัดวางใหม่จากสัดส่วนในภาพ · ไม่ใช่แผนที่สำรวจ',
  proposedLabel: 'PROPOSED · รอยืนยันจากการสำรวจพื้นที่',
  copyright: 'ไม่เผยแพร่ภาพหน้าจอ Google Maps และไม่ใช้ภาพเป็น texture หรือ map tiles',
} as const;

/** One scene unit is a composition unit, not one metre. Aspect follows the crop. */
export const SITE_WORLD = { width: 46, depth: 46 * 922 / 591, origin: [.42, .5] as SitePoint };
export const SITE_WIDTH = SITE_WORLD.width;
export const SITE_DEPTH = SITE_WORLD.depth;

export function siteToWorld(u: number, v: number, height = 0): WorldPoint {
  return [(u - SITE_WORLD.origin[0]) * SITE_WORLD.width, height, (v - SITE_WORLD.origin[1]) * SITE_WORLD.depth];
}

export function worldToSite(x: number, z: number): SitePoint {
  return [x / SITE_WORLD.width + SITE_WORLD.origin[0], z / SITE_WORLD.depth + SITE_WORLD.origin[1]];
}

/** Convert pixel/image headings to Three.js rotations around +Y. */
export function siteHeading(from: SitePoint, to: SitePoint): number {
  return Math.atan2(-(to[1] - from[1]) * SITE_WORLD.depth, (to[0] - from[0]) * SITE_WORLD.width);
}

export function footprintCorners(footprint: SiteFootprint): SitePoint[] {
  const theta = footprint.angleDeg * Math.PI / 180;
  const cos = Math.cos(theta), sin = Math.sin(theta);
  // Rotate in pixel-equivalent coordinates so rectangles keep screenshot aspect.
  const pixelWidth = footprint.size[0] * SITE_REFERENCE.crop.width;
  const pixelDepth = footprint.size[1] * SITE_REFERENCE.crop.height;
  return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y]) => [
    footprint.center[0] + (x * pixelWidth * cos - y * pixelDepth * sin) / (2 * SITE_REFERENCE.crop.width),
    footprint.center[1] + (x * pixelWidth * sin + y * pixelDepth * cos) / (2 * SITE_REFERENCE.crop.height),
  ] as SitePoint);
}

/** Waterfront edge: schematic boundary of visible occupied bank, not cadastral land. */
export const SHORELINE: readonly SitePoint[] = [
  [0,.015],[.015,.105],[.028,.188],[.073,.255],[.112,.31],
  [.143,.369],[.176,.418],[.22,.478],[.25,.532],[.301,.581],
  [.336,.633],[.394,.689],[.427,.718],[.414,.763],[.457,.808],
  [.45,.848],[.491,.899],[.521,.955],[.557,1],
];
export const LAND_POLYGON: readonly SitePoint[] = [[0,0], ...SHORELINE.slice(1), [0,1]];

export const ROADS: readonly SiteLine[] = [{
  id: 'waterfront-road', label: 'ถนนเลียบแนวบ้าน', width: .025, certainty: 'visible',
  points: [[0,.365],[.013,.436],[.041,.518],[.079,.598],[.12,.677],[.155,.751],[.211,.835],[.252,.918],[.31,1]],
}];

export const PIERS: readonly SiteLine[] = [
  { id: 'lung-thong-landing', label: 'แนวท่าเรืออ้างอิง · จุดเริ่มโดยประมาณ', points: [[.426,.715],[.537,.692],[.65,.656]], width: .014, certainty: 'approximate' },
  { id: 'upper-landing', points: [[.052,.239],[.132,.219],[.186,.199]], width: .012, certainty: 'visible' },
  { id: 'central-walkway', points: [[.211,.389],[.343,.364],[.463,.327]], width: .009, certainty: 'visible' },
  { id: 'middle-landing', points: [[.263,.513],[.33,.496]], width: .009, certainty: 'visible' },
  { id: 'southern-short-landing', points: [[.511,.964],[.555,.938]], width: .009, certainty: 'approximate' },
];

/** Roof patches are individually positioned, but do not enumerate real households. */
export const BUILDINGS: readonly SiteFootprint[] = [
  {id:'roof-a',center:[.044,.268],size:[.064,.03],angleDeg:-12,kind:'metal'},
  {id:'roof-b',center:[.031,.31],size:[.065,.032],angleDeg:-14,kind:'pale'},
  {id:'roof-c',center:[.087,.332],size:[.057,.03],angleDeg:-16,kind:'red'},
  {id:'roof-d',center:[.07,.384],size:[.093,.043],angleDeg:-17,kind:'blue'},
  {id:'roof-e',center:[.13,.393],size:[.065,.032],angleDeg:-11,kind:'metal'},
  {id:'roof-f',center:[.158,.444],size:[.063,.036],angleDeg:-18,kind:'red'},
  {id:'roof-g',center:[.095,.446],size:[.074,.035],angleDeg:-16,kind:'pale'},
  {id:'roof-h',center:[.149,.501],size:[.084,.037],angleDeg:-19,kind:'metal'},
  {id:'roof-i',center:[.091,.516],size:[.069,.034],angleDeg:-20,kind:'red'},
  {id:'roof-j',center:[.218,.537],size:[.08,.041],angleDeg:-17,kind:'metal'},
  {id:'roof-k',center:[.135,.558],size:[.079,.035],angleDeg:-18,kind:'blue'},
  {id:'roof-l',center:[.164,.598],size:[.089,.035],angleDeg:-19,kind:'blue'},
  {id:'roof-m',center:[.294,.58],size:[.069,.037],angleDeg:-19,kind:'metal'},
  {id:'roof-n',center:[.213,.758],size:[.07,.038],angleDeg:-18,kind:'red'},
  {id:'roof-o',center:[.284,.784],size:[.09,.04],angleDeg:-21,kind:'red'},
  {id:'roof-p',center:[.25,.827],size:[.073,.041],angleDeg:-19,kind:'pale'},
  {id:'roof-q',center:[.355,.852],size:[.088,.035],angleDeg:-19,kind:'blue'},
  {id:'roof-r',center:[.372,.879],size:[.091,.037],angleDeg:-18,kind:'metal'},
  {id:'roof-s',center:[.403,.929],size:[.079,.035],angleDeg:-19,kind:'metal'},
];

/** Parallel runs with visible spacing, detached patches and clear water channels. */
export const CAGE_RUNS: readonly CageRun[] = [
  {id:'upper-long',group:'upper',from:[.13,.114],to:[.373,.054],width:.026,columns:7,rows:1},
  {id:'upper-short',group:'upper',from:[.158,.139],to:[.282,.108],width:.021,columns:4,rows:1},
  {id:'upper-mid-long',group:'upper-middle',from:[.134,.222],to:[.493,.134],width:.028,columns:9,rows:1},
  {id:'upper-mid-detached',group:'upper-middle',from:[.288,.246],to:[.561,.179],width:.026,columns:7,rows:1},
  {id:'central-long',group:'central',from:[.292,.325],to:[.579,.254],width:.022,columns:8,rows:1},
  {id:'central-end',group:'central',from:[.551,.288],to:[.594,.277],width:.028,columns:2,rows:2},
  {id:'central-short',group:'central',from:[.397,.366],to:[.522,.335],width:.026,columns:4,rows:1},
  {id:'central-cross',group:'central',from:[.516,.365],to:[.605,.343],width:.023,columns:3,rows:1},
  {id:'lower-detached',group:'lower-middle',from:[.37,.449],to:[.475,.423],width:.034,columns:3,rows:2},
  {id:'lower-long',group:'lower-middle',from:[.487,.436],to:[.748,.372],width:.025,columns:7,rows:1},
  {id:'lower-dense-back',group:'lower-dense',from:[.55,.495],to:[.824,.427],width:.056,columns:8,rows:2},
  {id:'lower-dense-front',group:'lower-dense',from:[.542,.513],to:[.732,.466],width:.022,columns:6,rows:1},
  {id:'lower-isolated',group:'lower-detached',from:[.707,.559],to:[.821,.531],width:.034,columns:3,rows:2},
];

export type CageCell = SiteFootprint & { runId: string; group: string };

/** Sampling visible runs avoids a uniform invented grid; counts remain synthetic. */
export const CAGE_CELLS: readonly CageCell[] = CAGE_RUNS.flatMap(run => {
  const dx = (run.to[0] - run.from[0]) * SITE_REFERENCE.crop.width;
  const dy = (run.to[1] - run.from[1]) * SITE_REFERENCE.crop.height;
  const pixelLength = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const nx = -Math.sin(angle), ny = Math.cos(angle);
  const rowPixelWidth = run.width * SITE_REFERENCE.crop.height / run.rows;
  return Array.from({length:run.columns * run.rows}, (_, index) => {
    const column = index % run.columns, row = Math.floor(index / run.columns);
    const t = (column + .5) / run.columns;
    const rowOffset = (row - (run.rows - 1) / 2) * rowPixelWidth;
    return {
      id: `${run.id}-${row}-${column}`, runId:run.id, group:run.group,
      center:[run.from[0] + (run.to[0] - run.from[0]) * t + nx * rowOffset / SITE_REFERENCE.crop.width,
        run.from[1] + (run.to[1] - run.from[1]) * t + ny * rowOffset / SITE_REFERENCE.crop.height] as SitePoint,
      size:[pixelLength / run.columns / SITE_REFERENCE.crop.width, rowPixelWidth / SITE_REFERENCE.crop.height] as SitePoint,
      angleDeg:angle * 180 / Math.PI,
    };
  });
});

export const VEGETATION: readonly SiteFootprint[] = [
  {id:'roadside-west',center:[.044,.695],size:[.077,.16],angleDeg:-20,kind:'tree-patch'},
  {id:'pier-grove',center:[.292,.7],size:[.17,.08],angleDeg:-20,kind:'palm-patch'},
  {id:'lower-palm-band',center:[.416,.832],size:[.15,.09],angleDeg:-20,kind:'palm-patch'},
  {id:'lower-bank-grove',center:[.469,.943],size:[.155,.087],angleDeg:-20,kind:'tree-patch'},
];

export const BOATS: readonly SiteFootprint[] = [
  {id:'boat-upper-a',center:[.136,.246],size:[.037,.014],angleDeg:-22},
  {id:'boat-middle-a',center:[.263,.28],size:[.05,.013],angleDeg:-25},
  {id:'boat-middle-b',center:[.23,.351],size:[.046,.014],angleDeg:-21},
  {id:'boat-central-a',center:[.337,.506],size:[.046,.014],angleDeg:-21},
  {id:'boat-central-b',center:[.347,.547],size:[.043,.014],angleDeg:-24},
  {id:'boat-central-c',center:[.385,.588],size:[.044,.014],angleDeg:-24},
  {id:'boat-pier-end',center:[.615,.659],size:[.056,.018],angleDeg:-25},
  {id:'boat-lower-a',center:[.513,.862],size:[.044,.014],angleDeg:-29},
  {id:'boat-lower-b',center:[.541,.953],size:[.041,.014],angleDeg:-28},
];

export const NODE_CANDIDATES: Record<SiteNodeId, { point: SitePoint; title: string; rationale: string; status: 'PROPOSED' }> = {
  P0:{point:[.413,.706],title:'ศูนย์ควบคุมใกล้จุดขึ้นท่า',rationale:'อยู่ด้านฝั่งใกล้แนวท่าเรืออ้างอิง เพื่อสาธิต gateway และพลังงานสำรอง',status:'PROPOSED'},
  P1:{point:[.588,.434],title:'จุดติดตามน้ำใกล้กลุ่มกระชัง',rationale:'วางตัวแทนใกล้กลุ่มกระชังช่วงกลาง โดยไม่อ้างเป็นจุดตรวจจริง',status:'PROPOSED'},
  P2:{point:[.169,.493],title:'โหลดจำเป็นของแนวบ้าน',rationale:'เชื่อมโหลดจำเป็นเข้ากับแนวอาคารริมฝั่งที่เห็นในภาพ',status:'PROPOSED'},
  P3:{point:[.111,.592],title:'จุดสาธิตโหลดทั่วไปใกล้ทางเข้า',rationale:'แยกโหลดที่ตัดได้ก่อนออกจากการติดตามน้ำและศูนย์ควบคุม',status:'PROPOSED'},
};
export const SITE_NODE_POSITIONS: Record<SiteNodeId, WorldPoint> = {
  P0:siteToWorld(...NODE_CANDIDATES.P0.point,.24),
  P1:siteToWorld(...NODE_CANDIDATES.P1.point,.24),
  P2:siteToWorld(...NODE_CANDIDATES.P2.point,.24),
  P3:siteToWorld(...NODE_CANDIDATES.P3.point,.24),
};
export const CANDIDATE_NODES: Record<SiteNodeId, { uv: SitePoint; position: WorldPoint; title: string; rationale: string; status: 'PROPOSED' }> = {
  P0:{...NODE_CANDIDATES.P0,uv:NODE_CANDIDATES.P0.point,position:SITE_NODE_POSITIONS.P0},
  P1:{...NODE_CANDIDATES.P1,uv:NODE_CANDIDATES.P1.point,position:SITE_NODE_POSITIONS.P1},
  P2:{...NODE_CANDIDATES.P2,uv:NODE_CANDIDATES.P2.point,position:SITE_NODE_POSITIONS.P2},
  P3:{...NODE_CANDIDATES.P3,uv:NODE_CANDIDATES.P3.point,position:SITE_NODE_POSITIONS.P3},
};

export const LANDMARKS = [
  {id:'pier',point:[.426,.715] as SitePoint,label:'ท่าเรือลุงทอง · ตำแหน่งเริ่มท่าโดยประมาณ'},
  {id:'waterfront',point:[.157,.481] as SitePoint,label:'แนวอาคารริมน้ำ'},
  {id:'cages',point:[.656,.456] as SitePoint,label:'กลุ่มกระชังสี่เหลี่ยม'},
  {id:'road',point:[.13,.697] as SitePoint,label:'ถนนเลียบฝั่ง'},
  {id:'channel',point:[.666,.625] as SitePoint,label:'พื้นที่น้ำเปิดระหว่างกระชังกับแนวท่า'},
] as const;

/** Color is observable; salinity class, current direction and cause are not. */
export const WATER_TRANSITION = {
  line:[[.344,.716],[.475,.7],[.628,.659],[.797,.632],[1,.61]] as readonly SitePoint[],
  feather:.038,
  upperColor:'#315f51', lowerColor:'#234d59',
  label:'แนวสีเขียว–ฟ้าที่สังเกตในภาพ',
  interpretation:'สีที่ต่างกันยังไม่ยืนยันน้ำจืด น้ำกร่อย หรือน้ำทะเล ต้องวัดความเค็ม/การนำไฟฟ้าและเวลาน้ำขึ้นลง',
  measured:false,
} as const;

/** Monitoring strategy, not measured water classes or surveyed zone boundaries. */
export const MONITORING_ZONES = [
  { id:'A', title:'กลุ่มกระชังด้านใน', point:CANDIDATE_NODES.P1.uv, description:'บริเวณสีเขียวหม่นที่มีกระชังหนาแน่น · เสนอให้ P1 เป็นจุดหลัก', marker:'P1', status:'PROPOSED' },
  { id:'B', title:'แนวเปลี่ยนสีที่สังเกต', point:[.735,.646] as SitePoint, description:'เสนอจุดเฝ้าสังเกตการเปลี่ยนแปลง เพื่อเทียบกับจุดหลัก · ยังไม่มีเครื่องมือ', marker:'B-ref', status:'CONCEPT' },
  { id:'C', title:'น้ำสีเข้มด้านนอก', point:[.735,.843] as SitePoint, description:'เสนอจุดอ้างอิงเปรียบเทียบด้านนอก · ยังไม่มีเครื่องมือ', marker:'C-ref', status:'CONCEPT' },
] as const;

export const SITE_MONITORING_MARKERS = MONITORING_ZONES.filter(zone => zone.id !== 'A').map(zone => ({
  id:zone.marker, zone:zone.id, uv:zone.point, position:siteToWorld(...zone.point,.5),
  title:zone.title, status:zone.status, instrumented:false as const,
}));

/** UI occlusions are retained as uncertainty, never filled with claimed evidence. */
export const OCCLUSIONS = [
  {id:'upper-interface',bounds:[0,0,1,.012] as const,label:'พื้นที่เหนือ crop ถูกแถบค้นหา/ปุ่มบัง · ไม่สร้างผังยืนยันต่อออกไป'},
  {id:'layers',bounds:[.854,.018,.104,.078] as const,label:'ปุ่มชั้นข้อมูลบังผิวน้ำ'},
  {id:'location',bounds:[.837,.79,.135,.096] as const,label:'ปุ่มตำแหน่งบังผิวน้ำ'},
  {id:'direction',bounds:[.85,.89,.122,.081] as const,label:'ปุ่มนำทางบังบริเวณน้ำ'},
  {id:'attribution',bounds:[0,.929,.333,.055] as const,label:'ข้อความ Google Maps บังแนวถนนบางส่วน'},
] as const;

export const SITE_LAYOUT = {
  reference:SITE_REFERENCE, world:SITE_WORLD, shoreline:SHORELINE, land:LAND_POLYGON,
  roads:ROADS, piers:PIERS, buildings:BUILDINGS, cageRuns:CAGE_RUNS, cageCells:CAGE_CELLS,
  vegetation:VEGETATION, boats:BOATS, nodes:NODE_CANDIDATES, landmarks:LANDMARKS,
  waterTransition:WATER_TRANSITION, occlusions:OCCLUSIONS,
  monitoringZones:MONITORING_ZONES, monitoringMarkers:SITE_MONITORING_MARKERS,
} as const;
