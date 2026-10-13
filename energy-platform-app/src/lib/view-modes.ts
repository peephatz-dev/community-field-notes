// Pure navigation metadata keeps circuit/3D renderer dependencies out of other routes.
export const CIRCUIT_MODES = [
  ['assembly', '3D Assembly'],
  ['schematic', '2D Schematic'],
  ['power', 'Power Flow'],
  ['signal', 'Signal Flow'],
  ['exploded', 'Exploded View'],
] as const;
