// ISO 3166-1 alpha-2 codes keyed by ESPN team ID (primary) and legacy fallback IDs.
// GroupStandings uses team.crest first (ESPN logo URL); this map is the second fallback.
export const TEAM_FLAGS = {
  // ── Groups A-F: ESPN IDs (confirmed from live API) ───────────────
  203:   'mx',      // Mexico
  451:   'kr',      // South Korea
  450:   'cz',      // Czechia
  467:   'za',      // South Africa
  206:   'ca',      // Canada
  452:   'ba',      // Bosnia-Herzegovina
  4398:  'qa',      // Qatar
  475:   'ch',      // Switzerland
  580:   'gb-sct',  // Scotland
  2869:  'ma',      // Morocco
  205:   'br',      // Brazil
  2654:  'ht',      // Haiti
  660:   'us',      // USA
  628:   'au',      // Australia
  465:   'tr',      // Türkiye
  210:   'py',      // Paraguay
  481:   'de',      // Germany
  209:   'ec',      // Ecuador
  4789:  'ci',      // Ivory Coast
  11678: 'cw',      // Curaçao
  449:   'nl',      // Netherlands
  627:   'jp',      // Japan
  466:   'se',      // Sweden
  659:   'tn',      // Tunisia
  // ── Groups G-L: legacy fallback IDs (unconfirmed ESPN IDs) ───────
  125: 'be',      // Belgium
  126: 'ir',      // Iran
  127: 'eg',      // Egypt
  128: 'nz',      // New Zealand
  129: 'es',      // Spain
  130: 'uy',      // Uruguay
  131: 'sa',      // Saudi Arabia
  132: 'cv',      // Cape Verde
  133: 'fr',      // France
  134: 'sn',      // Senegal
  135: 'no',      // Norway
  136: 'iq',      // Iraq
  137: 'ar',      // Argentina
  138: 'at',      // Austria
  139: 'dz',      // Algeria
  140: 'jo',      // Jordan
  141: 'pt',      // Portugal
  142: 'co',      // Colombia
  143: 'cd',      // DR Congo
  144: 'uz',      // Uzbekistan
  145: 'gb-eng',  // England
  146: 'hr',      // Croatia
  147: 'gh',      // Ghana
  148: 'pa',      // Panama
}

export const FLAG_COLORS = {
  // ── Groups A-F: ESPN IDs ─────────────────────────────────────────
  203:   '#006847', // Mexico       — green
  451:   '#CD2E3A', // South Korea  — red
  450:   '#D7141A', // Czechia      — red
  467:   '#007A4D', // South Africa — green
  206:   '#FF0000', // Canada       — red
  452:   '#002395', // Bosnia       — blue
  4398:  '#8D1B3D', // Qatar        — maroon
  475:   '#FF0000', // Switzerland  — red
  580:   '#003078', // Scotland     — blue
  2869:  '#C1272D', // Morocco      — red
  205:   '#009C3B', // Brazil       — green
  2654:  '#00209F', // Haiti        — blue
  660:   '#B22234', // USA          — red
  628:   '#012169', // Australia    — dark blue
  465:   '#E30A17', // Türkiye      — red
  210:   '#D52B1E', // Paraguay     — red
  481:   '#FFCE00', // Germany      — gold
  209:   '#FFD100', // Ecuador      — yellow
  4789:  '#F77F00', // Ivory Coast  — orange
  11678: '#002B7F', // Curaçao      — blue
  449:   '#FF6600', // Netherlands  — orange
  627:   '#BC002D', // Japan        — red
  466:   '#006AA7', // Sweden       — blue
  659:   '#E70013', // Tunisia      — red
  // ── Groups G-L: legacy IDs ───────────────────────────────────────
  125: '#F6D200', // Belgium     — yellow
  126: '#239F40', // Iran        — green
  127: '#CE1126', // Egypt       — red
  128: '#00247D', // New Zealand — blue
  129: '#AA151B', // Spain       — red
  130: '#5EB6E4', // Uruguay     — sky blue
  131: '#006C35', // Saudi Arabia— green
  132: '#003893', // Cape Verde  — blue
  133: '#0055A4', // France      — blue
  134: '#00853F', // Senegal     — green
  135: '#EF2B2D', // Norway      — red
  136: '#007A3D', // Iraq        — green
  137: '#74ACDF', // Argentina   — sky blue
  138: '#ED2939', // Austria     — red
  139: '#006233', // Algeria     — green
  140: '#007A3D', // Jordan      — green
  141: '#006600', // Portugal    — green
  142: '#FCD116', // Colombia    — yellow
  143: '#007FFF', // DR Congo    — blue
  144: '#009ACD', // Uzbekistan  — sky blue
  145: '#CF142B', // England     — red
  146: '#FF0000', // Croatia     — red
  147: '#CE1126', // Ghana       — red
  148: '#DA121A', // Panama      — red
}

// Fallback lookup by 3-letter TLA for teams whose ESPN ID isn't in TEAM_FLAGS yet
export const TLA_TO_FLAG = {
  MEX: 'mx',  KOR: 'kr',  CZE: 'cz',  RSA: 'za',
  CAN: 'ca',  BIH: 'ba',  QAT: 'qa',  SUI: 'ch',
  SCO: 'gb-sct', MAR: 'ma', BRA: 'br', HAI: 'ht',
  USA: 'us',  AUS: 'au',  TUR: 'tr',  PAR: 'py',
  GER: 'de',  ECU: 'ec',  CIV: 'ci',  CUW: 'cw',
  NED: 'nl',  JPN: 'jp',  SWE: 'se',  TUN: 'tn',
  BEL: 'be',  IRN: 'ir',  EGY: 'eg',  NZL: 'nz',
  ESP: 'es',  URU: 'uy',  KSA: 'sa',  CPV: 'cv',
  FRA: 'fr',  SEN: 'sn',  NOR: 'no',  IRQ: 'iq',
  ARG: 'ar',  AUT: 'at',  ALG: 'dz',  JOR: 'jo',
  POR: 'pt',  COL: 'co',  COD: 'cd',  UZB: 'uz',
  ENG: 'gb-eng', CRO: 'hr', GHA: 'gh', PAN: 'pa',
}

export function getFlagCode(team) {
  if (!team) return null
  return TEAM_FLAGS[team.id] ?? TLA_TO_FLAG[team.tla] ?? null
}

export function flagUrl(code, w = 40) {
  return `https://flagcdn.com/w${w}/${code}.png`
}
