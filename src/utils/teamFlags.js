// ISO 3166-1 alpha-2 codes per team ID (flagcdn.com supports gb-sct / gb-eng)
export const TEAM_FLAGS = {
  101: 'mx', 102: 'kr', 103: 'cz', 104: 'za',
  105: 'ca', 106: 'ba', 107: 'qa', 108: 'ch',
  109: 'gb-sct', 110: 'ma', 111: 'br', 112: 'ht',
  113: 'us', 114: 'au', 115: 'tr', 116: 'py',
  117: 'de', 118: 'ec', 119: 'ci', 120: 'cw',
  121: 'nl', 122: 'jp', 123: 'se', 124: 'tn',
  125: 'be', 126: 'ir', 127: 'eg', 128: 'nz',
  129: 'es', 130: 'uy', 131: 'sa', 132: 'cv',
  133: 'fr', 134: 'sn', 135: 'no', 136: 'iq',
  137: 'ar', 138: 'at', 139: 'dz', 140: 'jo',
  141: 'pt', 142: 'co', 143: 'cd', 144: 'uz',
  145: 'gb-eng', 146: 'hr', 147: 'gh', 148: 'pa',
}

// Most prominent / culturally distinctive flag colour per team ID
export const FLAG_COLORS = {
  101: '#006847', // Mexico      — green
  102: '#CD2E3A', // South Korea — red (taegeuk)
  103: '#D7141A', // Czechia     — red
  104: '#007A4D', // South Africa— green (Y-band)
  105: '#FF0000', // Canada      — red
  106: '#002395', // Bosnia      — blue
  107: '#8D1B3D', // Qatar       — maroon
  108: '#FF0000', // Switzerland — red
  109: '#003078', // Scotland    — blue (Saltire)
  110: '#C1272D', // Morocco     — red
  111: '#009C3B', // Brazil      — green
  112: '#00209F', // Haiti       — blue
  113: '#B22234', // USA         — red
  114: '#012169', // Australia   — dark blue
  115: '#E30A17', // Türkiye     — red
  116: '#D52B1E', // Paraguay    — red
  117: '#FFCE00', // Germany     — gold (most distinctive)
  118: '#FFD100', // Ecuador     — yellow
  119: '#F77F00', // Ivory Coast — orange
  120: '#002B7F', // Curaçao     — blue
  121: '#FF6600', // Netherlands — orange (national colour)
  122: '#BC002D', // Japan       — red (sun)
  123: '#006AA7', // Sweden      — blue
  124: '#E70013', // Tunisia     — red
  125: '#F6D200', // Belgium     — yellow (most visible on dark bg)
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
  145: '#CF142B', // England     — red (St George's Cross)
  146: '#FF0000', // Croatia     — red
  147: '#CE1126', // Ghana       — red
  148: '#DA121A', // Panama      — red
}

export function flagUrl(code, w = 40, h = 30) {
  return `https://flagcdn.com/${w}x${h}/${code}.png`
}
