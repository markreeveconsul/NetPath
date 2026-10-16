// Net Path sandbox: device icons, link styles and level-of-detail rules.
// Original artwork (no third-party or trademarked icon art). Matches the approved mockup.
//
// Icons are 48x48, drawn with 2px rounded strokes. Inside the markup:
//   class "n" = outline only (no fill)     class "l" = LED dot
// Style them with DEVICE_ICON_CSS (or port the rules to your CSS/Tailwind setup).
// Keep the geometry identical when converting to JSX or a <symbol> sprite.



export const DEVICE_ICON_VIEWBOX = '0 0 48 48';

export const DEVICE_ICON_CSS = `
.np-icon{fill:var(--np-icon-fill,#16312f);stroke:var(--np-icon-stroke,#6ee7b7);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.np-icon .n{fill:none}
.np-icon .l{fill:var(--np-led,#4ade80);stroke:none}
`;

export const DEVICE_ICONS = {
  pc: '<rect x="5" y="9" width="28" height="20" rx="3"/><path class="n" d="M19 29v5M12 39h14"/><rect x="36" y="9" width="8" height="30" rx="2"/><circle class="l" cx="40" cy="14" r="1.5"/>',
  laptop: '<rect x="10" y="9" width="28" height="19" rx="2.5"/><path d="M5 38h38l-4-10H9z"/><path class="n" d="M20 34h8"/>',
  server: '<rect x="9" y="6" width="30" height="10" rx="2"/><rect x="9" y="19" width="30" height="10" rx="2"/><rect x="9" y="32" width="30" height="10" rx="2"/><circle class="l" cx="15" cy="11" r="1.6"/><circle class="l" cx="15" cy="24" r="1.6"/><circle class="l" cx="15" cy="37" r="1.6"/><path class="n" d="M23 11h10M23 24h10M23 37h10"/>',
  switch: '<rect x="4" y="16" width="40" height="16" rx="3"/><path class="n" d="M10 22v4M16 22v4M22 22v4M28 22v4"/><circle class="l" cx="37" cy="24" r="1.6"/>',
  router: '<rect x="5" y="14" width="38" height="22" rx="11"/><path class="n" d="M15 22h17M28 18l4 4-4 4M33 30H16M20 26l-4 4 4 4"/>',
  hub: '<rect x="5" y="16" width="38" height="16" rx="2.5"/><path class="n" d="M11 16V9M20 16V9M29 16V9M38 16V9"/><circle class="l" cx="37" cy="24" r="1.6"/>',
  l3switch: '<rect x="4" y="24" width="40" height="16" rx="3"/><path class="n" d="M10 30v4M16 30v4M22 30v4M28 30v4M14 15h20M30 10l5 5-5 5"/><circle class="l" cx="37" cy="32" r="1.6"/>',
  ap: '<ellipse cx="24" cy="35" rx="16" ry="6"/><path class="n" d="M16 27a11 11 0 0 1 16 0M10 21a19 19 0 0 1 28 0"/><circle class="l" cx="24" cy="35" r="1.6"/>',
  firewall: '<rect x="6" y="9" width="36" height="30" rx="2"/><path class="n" d="M6 19h36M6 29h36M24 9v10M15 19v10M33 19v10M24 29v10"/>',
  cloud: '<path d="M13 36c-5 0-8-4-8-8s3-8 8-8c1-6 6-9 11-9s10 3 11 9c5 0 8 3 8 8s-3 8-8 8z"/>',
  smartphone: '<rect x="15" y="5" width="18" height="38" rx="4"/><path class="n" d="M21 9h6"/><circle class="l" cx="24" cy="38" r="1.6"/>',
  printer: '<rect x="12" y="6" width="24" height="12" rx="1.5"/><rect x="6" y="18" width="36" height="16" rx="3"/><rect x="13" y="28" width="22" height="13" rx="1.5"/><circle class="l" cx="37" cy="23" r="1.5"/>',
};

// Shown as text on palette tiles and in the inspector (never color alone).
export const DEVICE_ICON_META = {
  pc: { label: 'PC', tier: 'full' },
  laptop: { label: 'Laptop', tier: 'full' },
  server: { label: 'Server', tier: 'full' },
  switch: { label: 'Switch', tier: 'full' },
  router: { label: 'Router', tier: 'full' },
  hub: { label: 'Hub', tier: 'full' },
  l3switch: { label: 'Multilayer switch', tier: 'limited' },
  ap: { label: 'Access point', tier: 'limited' },
  firewall: { label: 'Firewall', tier: 'limited' },
  cloud: { label: 'Cloud / Internet', tier: 'limited' },
  smartphone: { label: 'Smartphone', tier: 'limited' },
  printer: { label: 'Printer', tier: 'limited' },
};

// ---- Links -----------------------------------------------------------------





// State is always encoded by pattern as well as color: solid = up, dotted = negotiating, dashed = down.
export function linkStyle(state, media = 'copper') {
  if (state === 'draft') return { stroke: '#6ee7b7', width: 3, dash: '6 6' };
  if (state === 'down') return { stroke: '#f87171', width: 3, dash: '7 5' };
  if (state === 'negotiating') return { stroke: '#fbbf24', width: 4, dash: '1 7', cap: 'round' };
  switch (media) {
    case 'fiber': return { stroke: '#60a5fa', width: 6, cap: 'round' };
    case 'serial': return { stroke: '#c4b5fd', width: 3 };
    case 'console': return { stroke: '#94a3b8', width: 2, dash: '2 5', cap: 'round' };
    default: return { stroke: '#4ade80', width: 4, cap: 'round' };
  }
}

// Port LED at each link end: filled dot (r=6, 2px canvas-colored outline) when up/negotiating, empty ring when no link.
export const PORT_LED_COLOR = { up: '#4ade80', negotiating: '#fbbf24', off: '#4a6066' };

// ---- Level of detail by zoom ---------------------------------------------
// far : icon + name
// mid : + IP/VLAN label, status badge, link-end LEDs (default 100% view)
// near: + interface-name labels at link ends and port dots on selected devices

export function lodForZoom(zoom) {
  if (zoom < 0.6) return 'far';
  if (zoom < 1.2) return 'mid';
  return 'near';
}

// ---- Palette tokens (from the approved mockup; align with existing theme variables where they exist) ----
export const NP_TOKENS = {
  canvasBg: '#0e1719',
  surface: '#15232a',
  line: '#26383f',
  text: '#dbe7e4',
  textMuted: '#8fa6a6',
  accent: '#6ee7b7', // selection ring, icon strokes, draft cable
  iconFill: '#16312f',
};
