#!/bin/bash

# Script para executar testes no Firebase Test Lab
# Keep Alert - Android

echo "🔥 Firebase Test Lab - Keep Alert"
echo "=================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se o APK existe
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

if [ ! -f "$APK_PATH" ]; then
    echo -e "${RED}❌ APK não encontrado em: $APK_PATH${NC}"
    echo -e "${YELLOW}Execute primeiro: npx expo run:android${NC}"
    exit 1
fi

echo -e "${GREEN}✅ APK encontrado!${NC}"
APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
echo -e "   Tamanho: $APK_SIZE"
echo ""

# Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI não está instalado${NC}"
    echo -e "${YELLOW}Instale em: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi

echo -e "${GREEN}✅ gcloud CLI instalado${NC}"
echo ""

# Menu de opções
echo "Escolha o tipo de teste:"
echo "1) Teste Rápido (1 dispositivo, 5 min)"
echo "2) Teste Completo (3 dispositivos, 15 min)"
echo "3) Teste Personalizado (usar YAML)"
echo "4) Ver resultados anteriores"
echo ""
read -p "Opção [1-4]: " option

case $option in
    1)
        echo -e "${YELLOW}🚀 Executando Teste Rápido...${NC}"
        gcloud firebase test android run \
            --type robo \
            --app "$APK_PATH" \
            --device model=redfin,version=30,locale=pt_BR,orientation=portrait \
            --timeout 5m \
            --auto-grant-permissions \
            --results-bucket=gs://keep-alert-test-results \
            --results-dir=quick-test-$(date +%Y%m%d-%H%M%S)
        ;;

    2)
        echo -e "${YELLOW}🚀 Executando Teste Completo...${NC}"
        gcloud firebase test android run \
            --type robo \
            --app "$APK_PATH" \
            --device model=redfin,version=30,locale=pt_BR,orientation=portrait \
            --device model=bluejay,version=31,locale=pt_BR,orientation=portrait \
            --device model=oriole,version=33,locale=pt_BR,orientation=portrait \
            --timeout 15m \
            --auto-grant-permissions \
            --record-video \
            --performance-metrics \
            --results-bucket=gs://keep-alert-test-results \
            --results-dir=full-test-$(date +%Y%m%d-%H%M%S)
        ;;

    3)
        echo -e "${YELLOW}🚀 Executando com YAML...${NC}"
        if [ ! -f "firebase-test-lab.yaml" ]; then
            echo -e "${RED}❌ Arquivo firebase-test-lab.yaml não encontrado${NC}"
            exit 1
        fi
        gcloud firebase test android run firebase-test-lab.yaml
        ;;

    4)
        echo -e "${YELLOW}📊 Abrindo resultados...${NC}"
        echo "Acesse: https://console.firebase.google.com/project/keep-alert/testlab/histories"
        ;;

    *)
        echo -e "${RED}❌ Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Comando executado!${NC}"
echo -e "${YELLOW}📊 Acesse os resultados em:${NC}"
echo "https://console.firebase.google.com/project/keep-alert/testlab/histories"
