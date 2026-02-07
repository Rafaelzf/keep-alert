/**
 * Script para gerar ícones PNG dos incidentes
 *
 * Como usar:
 * 1. Instale as dependências: npm install canvas
 * 2. Execute: node scripts/generate-incident-icons.js
 *
 * Ou use uma ferramenta online para converter os SVGs para PNG
 */

const fs = require('fs');
const path = require('path');

// Configurações dos ícones
const ICON_CONFIG = {
  theft: { color: '#a855f7', icon: '💰' },
  robbery: { color: '#ef4444', icon: '🔫' },
  'robbery-attempt': { color: '#f59e0b', icon: '⚠️' },
  harassment: { color: '#a855f7', icon: '🚫' },
  fight: { color: '#fb923c', icon: '👊' },
  suspicious: { color: '#dc2626', icon: '👤' },
  fire: { color: '#f97316', icon: '🔥' },
  flooding: { color: '#06b6d4', icon: '🌊' },
  'loud-noise': { color: '#8b5cf6', icon: '🔊' },
  'lost-animal': { color: '#eab308', icon: '🐾' },
  'lost-person': { color: '#f97316', icon: '❓' },
  'animal-abuse': { color: '#dc2626', icon: '🐕' },
  kidnapping: { color: '#991b1b', icon: '⛓️' },
  'lost-child': { color: '#0369a1', icon: '👶' },
  'crash-car': { color: '#8b5cf6', icon: '🚗' },
  blackout: { color: '#dc2626', icon: '⚡' },
  'no-water': { color: '#1d4ed8', icon: '💧' },
  'tree-fall': { color: '#16a34a', icon: '🌳' },
  'interrupted-road': { color: '#8b5cf6', icon: '🚧' },
  'invasion-property': { color: '#881337', icon: '🏠' },
};

// Cria SVGs (já que canvas precisa de instalação extra)
const assetsDir = path.join(__dirname, '..', 'assets', 'incident-icons');

// Cria diretório se não existir
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('Gerando ícones SVG em:', assetsDir);

Object.entries(ICON_CONFIG).forEach(([key, { color, icon }]) => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <!-- Círculo de fundo -->
  <circle cx="40" cy="40" r="35" fill="${color}" stroke="#ffffff" stroke-width="4"/>
  <!-- Emoji/Ícone -->
  <text x="40" y="56" font-size="40" text-anchor="middle" fill="#ffffff">${icon}</text>
</svg>`;

  const filename = `${key}.svg`;
  fs.writeFileSync(path.join(assetsDir, filename), svg);
  console.log(`✓ Criado: ${filename}`);
});

console.log('\n✅ SVGs criados com sucesso!');
console.log('\n📝 Próximos passos:');
console.log('1. Converta os SVGs para PNG usando uma ferramenta online como:');
console.log('   - https://svgtopng.com/ (múltiplos arquivos)');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('2. Ou instale ImageMagick e execute:');
console.log('   cd assets/incident-icons && for file in *.svg; do convert "$file" "${file%.svg}.png"; done');
console.log('3. As imagens PNG devem ter 80x80 pixels');
