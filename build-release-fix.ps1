# Script para gerar APK de Release - Keep Alert
# Versao sem clean para evitar erro de codegen

Write-Host "Gerando APK de Release - Keep Alert" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Criar diretorio de assets
Write-Host "Criando diretorio de assets..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "android\app\src\main\assets" | Out-Null

# Empacotar bundle JavaScript usando Expo
Write-Host "Empacotando bundle JavaScript com Expo..." -ForegroundColor Yellow
npx expo export --platform android --output-dir dist

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao empacotar com Expo!" -ForegroundColor Red
    Write-Host "Tentando com react-native bundle..." -ForegroundColor Yellow

    # Fallback para react-native bundle
    npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android\app\src\main\assets\index.android.bundle --assets-dest android\app\src\main\res

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao empacotar bundle!" -ForegroundColor Red
        exit 1
    }
}
else {
    # Copiar bundle do expo export para assets
    Copy-Item "dist\_expo\android\index.android.bundle" -Destination "android\app\src\main\assets\index.android.bundle" -Force
    Write-Host "Bundle copiado do Expo export" -ForegroundColor Green
}

Write-Host "Bundle empacotado com sucesso!" -ForegroundColor Green

# Gerar APK de release (sem clean)
Write-Host "Gerando APK de release..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao gerar APK!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Verificar se APK foi gerado
$APK_PATH = "android\app\build\outputs\apk\release\app-release.apk"

if (-Not (Test-Path $APK_PATH)) {
    Write-Host "APK nao encontrado!" -ForegroundColor Red
    exit 1
}

# Informacoes do APK
$APK_SIZE = (Get-Item $APK_PATH).Length / 1MB
$APK_SIZE_MB = [math]::Round($APK_SIZE, 2)

Write-Host ""
Write-Host "APK de Release gerado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Informacoes do APK:" -ForegroundColor Blue
Write-Host "   Localizacao: $APK_PATH"
Write-Host "   Tamanho: $APK_SIZE_MB MB"
Write-Host ""

Write-Host "Proximos passos:" -ForegroundColor Blue
Write-Host "1. Testar APK localmente:"
Write-Host "   adb install $APK_PATH"
Write-Host ""
Write-Host "2. Fazer upload no Firebase Console"
Write-Host ""
Write-Host "Pronto para upload!" -ForegroundColor Green

# Abrir pasta automaticamente
explorer.exe (Split-Path -Parent (Resolve-Path $APK_PATH))
