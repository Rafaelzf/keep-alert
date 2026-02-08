const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../assets/notification/icon.svg');
const pngPath = path.join(__dirname, '../assets/notification/icon.png');

sharp(svgPath)
  .resize(96, 96)
  .png()
  .toFile(pngPath)
  .then(() => {
    console.log('✅ Ícone de notificação criado com sucesso!');
    console.log(`   Localização: ${pngPath}`);
  })
  .catch(err => {
    console.error('❌ Erro ao converter ícone:', err);
  });
