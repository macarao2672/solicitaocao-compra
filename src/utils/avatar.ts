// Utilitário para geração de avatares com iniciais e capas modernas em SVG (sem fotos de bancos de imagem fictícios)

export function generateInitialsAvatar(name: string, bgHex = 'f97316', textHex = 'ffffff'): string {
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  let initials = '';
  if (parts.length >= 2) {
    initials = `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  } else if (parts.length === 1 && parts[0].length > 0) {
    initials = parts[0].substring(0, 2).toUpperCase();
  } else {
    initials = 'US';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
    <rect width="128" height="128" rx="32" fill="#${bgHex}" />
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="50" font-weight="700" fill="#${textHex}" letter-spacing="1">
      ${initials}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateGradientCover(fromColor = '#18181b', toColor = '#27272a'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" width="1200" height="400">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${fromColor}" />
        <stop offset="100%" stop-color="${toColor}" />
      </linearGradient>
      <radialGradient id="glow" cx="80%" cy="20%" r="60%">
        <stop offset="0%" stop-color="#ea580c" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#09090b" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1200" height="400" fill="url(#grad)" />
    <rect width="1200" height="400" fill="url(#glow)" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const MODERN_AVATAR_PRESETS = [
  generateInitialsAvatar('Admin', 'f97316'), // Laranja
  generateInitialsAvatar('Gestão', '0ea5e9'), // Azul Celeste
  generateInitialsAvatar('Equipe', '10b981'), // Esmeralda
  generateInitialsAvatar('Compras', '8b5cf6'), // Violeta
  generateInitialsAvatar('Auditor', 'ec4899'), // Rosa
  generateInitialsAvatar('Diretoria', '64748b'), // Ardósia
];

export const MODERN_COVER_PRESETS = [
  generateGradientCover('#18181b', '#27272a'),
  generateGradientCover('#0f172a', '#1e293b'),
  generateGradientCover('#1c1917', '#292524'),
  generateGradientCover('#1e1b4b', '#312e81'),
  generateGradientCover('#064e3b', '#022c22'),
];
