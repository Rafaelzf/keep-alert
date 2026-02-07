const fs = require('fs');
const path = require('path');

// Mapeamento de cores por categoria (do constants/incidents.ts)
const COLORS = {
  theft: '#a855f7',
  robbery: '#ef4444',
  'robbery-attempt': '#f59e0b',
  harassment: '#a855f7',
  fight: '#fb923c',
  suspicious: '#dc2626',
  fire: '#f97316',
  flooding: '#06b6d4',
  'loud-noise': '#8b5cf6',
  'lost-animal': '#eab308',
  'lost-person': '#f97316',
  'animal-abuse': '#dc2626',
  kidnapping: '#991b1b',
  'lost-child': '#0369a1',
  'crash-car': '#8b5cf6',
  blackout: '#dc2626',
  'no-water': '#1d4ed8',
  'tree-fall': '#16a34a',
  'interrupted-road': '#8b5cf6',
  'invasion-property': '#881337',
};

const assetsDir = path.join(__dirname, '..', 'assets', 'incident-icons');

console.log('Processando ícones SVG...\n');

// Processa cada SVG
Object.entries(COLORS).forEach(([name, color]) => {
  const svgPath = path.join(assetsDir, `${name}.svg`);

  if (!fs.existsSync(svgPath)) {
    console.log(`⚠️  Arquivo não encontrado: ${name}.svg`);
    return;
  }

  // Lê o SVG original
  let svgContent = fs.readFileSync(svgPath, 'utf-8');

  // Extrai apenas o path do ícone
  const pathMatch = svgContent.match(/<path[^>]*d="([^"]+)"[^>]*>/);

  if (!pathMatch) {
    console.log(`⚠️  Path não encontrado em: ${name}.svg`);
    return;
  }

  const iconPath = pathMatch[1];

  // Cria novo SVG com círculo colorido e ícone branco
  const wrappedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Círculo de fundo colorido -->
  <circle cx="50" cy="50" r="48" fill="${color}" stroke="#ffffff" stroke-width="3"/>
  <!-- Ícone FontAwesome redimensionado e centralizado -->
  <g transform="translate(25, 25) scale(0.098)">
    <path d="${iconPath}" fill="#ffffff"/>
  </g>
</svg>`;

  // Salva o SVG processado
  fs.writeFileSync(svgPath, wrappedSvg);
  console.log(`✓ Processado: ${name}.svg`);
});

console.log('\n✅ Processamento concluído!');
console.log('Execute agora: node scripts/convert-svg-to-png.js');
