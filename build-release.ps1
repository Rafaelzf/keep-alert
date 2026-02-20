# Script para gerar APK de Release - Keep Alert
# PowerShell

Write-Host "🔨 Gerando APK de Release - Keep Alert" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Limpar builds anteriores
Write-Host "🧹 Limpando builds anteriores..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat clean
Set-Location ..

# Criar diretório de assets
Write-Host "📁 Criando diretório de assets..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "android\app\src\main\assets" | Out-Null

# Empacotar bundle JavaScript
Write-Host "📦 Empacotando bundle JavaScript..." -ForegroundColor Yellow
npx react-native bundle `
  --platform android `
  --dev false `
  --entry-file index.js `
  --bundle-output android\app\src\main\assets\index.android.bundle `
  --assets-dest android\app\src\main\res

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao empacotar bundle!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Bundle empacotado com sucesso!" -ForegroundColor Green

# Gerar APK de release
Write-Host "🏗️  Gerando APK de release..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao gerar APK!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Verificar se APK foi gerado
$APK_PATH = "android\app\build\outputs\apk\release\app-release.apk"

if (-Not (Test-Path $APK_PATH)) {
    Write-Host "❌ APK não encontrado!" -ForegroundColor Red
    exit 1
}

# Informações do APK
$APK_SIZE = (Get-Item $APK_PATH).Length / 1MB
$APK_SIZE_MB = [math]::Round($APK_SIZE, 2)

Write-Host ""
Write-Host "✅ APK de Release gerado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Informações do APK:" -ForegroundColor Blue
Write-Host "   Localização: $APK_PATH"
Write-Host "   Tamanho: $APK_SIZE_MB MB"
Write-Host ""

# Verificar se bundle está no APK
Write-Host "🔍 Verificando bundle no APK..." -ForegroundColor Yellow

# Extrair e verificar
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $APK_PATH))
$bundleExists = $zip.Entries | Where-Object { $_.FullName -like "*index.android.bundle*" }
$zip.Dispose()

if ($bundleExists) {
    Write-Host "✅ Bundle encontrado no APK!" -ForegroundColor Green
} else {
    Write-Host "❌ Bundle NÃO encontrado no APK!" -ForegroundColor Red
    Write-Host "   Isso vai causar o erro 'Unable to load script'" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎯 Próximos passos:" -ForegroundColor Blue
Write-Host "1. Testar APK localmente:"
Write-Host "   adb install $APK_PATH"
Write-Host ""
Write-Host "2. Fazer upload no Firebase:"
Write-Host "   https://console.firebase.google.com/project/keep-alert/appdistribution"
Write-Host ""
Write-Host "3. Executar testes:"
Write-Host "   Anexe o APK e o arquivo firebase-test-cases.yaml"
Write-Host ""
Write-Host "🚀 Pronto para upload!" -ForegroundColor Green

# Abrir pasta do APK no Explorer
Write-Host ""
$openExplorer = Read-Host "Abrir pasta do APK no Explorer? (S/N)"
if ($openExplorer -eq "S" -or $openExplorer -eq "s") {
    explorer.exe (Split-Path -Parent (Resolve-Path $APK_PATH))
}
