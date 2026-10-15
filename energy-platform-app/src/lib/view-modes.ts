// Pure navigation metadata keeps circuit/3D renderer dependencies out of other routes.
export const CIRCUIT_MODES = [
  ['assembly', 'ประกอบสามมิติ'],
  ['schematic', 'ผังวงจรสองมิติ'],
  ['power', 'เส้นทางกำลังไฟ'],
  ['signal', 'เส้นทางสัญญาณ'],
  ['exploded', 'แยกชิ้นส่วน'],
] as const;
