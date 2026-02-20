#!/bin/bash

# Script para gerar APK de Release
# Keep Alert

echo "🔨 Gerando APK de Release - Keep Alert"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Limpar builds anteriores
echo -e "${YELLOW}🧹 Limpando builds anteriores...${NC}"
cd android
./gradlew clean
cd ..

# Criar diretório de assets
echo -e "${YELLOW}📁 Criando diretório de assets...${NC}"
mkdir -p android/app/src/main/assets

# Empacotar bundle JavaScript
echo -e "${YELLOW}📦 Empacotando bundle JavaScript...${NC}"
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao empacotar bundle!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Bundle empacotado com sucesso!${NC}"

# Gerar APK de release
echo -e "${YELLOW}🏗️  Gerando APK de release...${NC}"
cd android
./gradlew assembleRelease

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao gerar APK!${NC}"
    exit 1
fi

cd ..

# Verificar se APK foi gerado
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ ! -f "$APK_PATH" ]; then
    echo -e "${RED}❌ APK não encontrado!${NC}"
    exit 1
fi

# Informações do APK
APK_SIZE=$(du -h "$APK_PATH" | cut -f1)

echo ""
echo -e "${GREEN}✅ APK de Release gerado com sucesso!${NC}"
echo ""
echo -e "${BLUE}📊 Informações do APK:${NC}"
echo -e "   Localização: $APK_PATH"
echo -e "   Tamanho: $APK_SIZE"
echo ""

# Verificar se bundle está no APK
echo -e "${YELLOW}🔍 Verificando bundle no APK...${NC}"
if unzip -l "$APK_PATH" | grep -q "index.android.bundle"; then
    echo -e "${GREEN}✅ Bundle encontrado no APK!${NC}"
else
    echo -e "${RED}❌ Bundle NÃO encontrado no APK!${NC}"
    echo -e "${YELLOW}   Isso pode causar o erro 'Unable to load script'${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🎯 Próximos passos:${NC}"
echo "1. Testar APK localmente:"
echo "   adb install $APK_PATH"
echo ""
echo "2. Fazer upload no Firebase:"
echo "   Acesse: https://console.firebase.google.com/project/keep-alert/appdistribution"
echo ""
echo "3. Executar testes:"
echo "   Anexe o APK e o arquivo firebase-test-cases.yaml"
echo ""
echo -e "${GREEN}🚀 Pronto para upload!${NC}"
