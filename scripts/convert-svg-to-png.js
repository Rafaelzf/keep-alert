const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets', 'incident-icons');

console.log('Convertendo SVGs para PNG...\n');

const svgFiles = fs.readdirSync(assetsDir).filter((file) => file.endsWith('.svg'));

Promise.all(
  svgFiles.map(async (file) => {
    const svgPath = path.join(assetsDir, file);
    const pngPath = path.join(assetsDir, file.replace('.svg', '.png'));

    try {
      await sharp(svgPath).resize(80, 80).png().toFile(pngPath);

      console.log(`✓ Convertido: ${file} → ${path.basename(pngPath)}`);
    } catch (error) {
      console.error(`✗ Erro ao converter ${file}:`, error.message);
    }
  })
)
  .then(() => {
    console.log('\n✅ Conversão concluída!');
    console.log(`📁 Imagens PNG criadas em: ${assetsDir}`);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante a conversão:', error);
  });
