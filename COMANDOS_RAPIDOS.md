# 🚀 Comandos Rápidos para Publicação

## 📦 INSTALAÇÃO E SETUP

```bash
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Login no EAS
eas login

# Configurar projeto EAS (já feito)
# eas build:configure
```

---

## 🏗️ BUILD

### Build de Produção (AAB para Play Store)
```bash
# Gera Android App Bundle (.aab) para produção
eas build --platform android --profile production

# Ou com auto-submit
eas build --platform android --profile production --auto-submit
```

### Build de Preview (APK para teste)
```bash
# Gera APK para testar antes de publicar
eas build --platform android --profile preview
```

### Verificar status do build
```bash
# Lista todos os builds
eas build:list

# Ver detalhes de um build específico
eas build:view [BUILD_ID]
```

---

## 🔑 CREDENCIAIS

### Ver SHA-1 e SHA-256 do certificado
```bash
# Mostra fingerprints do certificado de produção
eas credentials

# Ou via web
# https://expo.dev/accounts/[seu-username]/projects/keep-alert/credentials
```

### Gerenciar keystore
```bash
# Ver credenciais Android
eas credentials --platform android

# Criar nova keystore (só se necessário)
eas credentials --platform android --profile production
```

---

## 📤 SUBMIT PARA PLAY STORE

### Submit manual
```bash
# Faz upload do último build para Play Store
eas submit --platform android --latest

# Ou especificar arquivo AAB
eas submit --platform android --path ./keep-alert.aab
```

### Submit automático (após configurar service account)
```bash
# Build + Submit em um comando
eas build --platform android --profile production --auto-submit
```

---

## 🔄 ATUALIZAÇÕES

### Atualizar versão
```bash
# Edite app.json:
# "version": "1.0.1",  <- incrementar
# "android": {
#   "versionCode": 2,  <- incrementar
# }

# Depois:
eas build --platform android --profile production
eas submit --platform android --latest
```

---

## 🧪 TESTES

### Testar build localmente
```bash
# Gerar APK de preview
eas build --platform android --profile preview

# Instalar no dispositivo conectado
adb install caminho/para/app.apk
```

### Logs e debug
```bash
# Ver logs do build
eas build:view [BUILD_ID]

# Logs do dispositivo Android
adb logcat | grep -i "keep-alert"
```

---

## 🔍 VERIFICAÇÕES IMPORTANTES

### Antes do primeiro build
```bash
# 1. Verificar configurações
cat app.json | grep -E "version|package|versionCode"

# 2. Verificar google-services.json existe
ls firebase/google-services.json

# 3. Verificar eas.json
cat eas.json
```

### Após o build
```bash
# Baixar o AAB
# (link fornecido pelo EAS após build concluir)

# Verificar SHA-1
eas credentials --platform android
```

---

## 📊 MONITORAMENTO

### Firebase
```bash
# Ver logs do Firebase
# https://console.firebase.google.com/project/[seu-projeto]/crashlytics

# Analytics
# https://console.firebase.google.com/project/[seu-projeto]/analytics
```

### Google Play Console
```bash
# Acessar console
# https://play.google.com/console

# Ver estatísticas do app
# https://play.google.com/console/u/0/developers/[ID]/app/[APP_ID]/statistics
```

---

## 🆘 TROUBLESHOOTING

### Build falhou
```bash
# Ver logs detalhados
eas build:view [BUILD_ID]

# Limpar cache e tentar novamente
eas build --platform android --profile production --clear-cache
```

### Google Sign-In não funciona em produção
```bash
# 1. Verificar SHA-1
eas credentials --platform android

# 2. Adicionar SHA-1 no Firebase Console
# https://console.firebase.google.com/project/[seu-projeto]/settings/general

# 3. Baixar novo google-services.json
# Substituir em: firebase/google-services.json

# 4. Rebuild
eas build --platform android --profile production
```

### Erro de versão já existe
```json
// Edite app.json
{
  "expo": {
    "version": "1.0.1",  // Incrementar
    "android": {
      "versionCode": 2   // Incrementar
    }
  }
}
```

---

## 📱 INSTALAÇÃO DIRETA (TESTE INTERNO)

### Instalar APK de preview
```bash
# Após baixar o APK
adb install keep-alert.apk

# Ou via wireless
adb connect [IP_DO_DISPOSITIVO]:5555
adb install keep-alert.apk
```

### Compartilhar APK para testers
```bash
# Upload para Google Drive, Dropbox, etc
# Ou usar internal testing track na Play Store
```

---

## 🔐 SEGURANÇA

### Verificar se não há secrets no código
```bash
# Buscar por possíveis API keys
grep -r "AIza" . --exclude-dir=node_modules

# Buscar por TODOs
grep -r "TODO\|FIXME" . --exclude-dir=node_modules
```

### Remover console.logs
```bash
# Buscar console.logs (para revisar manualmente)
grep -r "console.log" components/ app/ --include="*.tsx" --include="*.ts"
```

---

## 🎯 WORKFLOW COMPLETO

### Primeira publicação
```bash
# 1. Build de produção
eas build --platform android --profile production

# 2. Obter SHA-1
eas credentials --platform android

# 3. Adicionar SHA-1 no Firebase + Google Cloud

# 4. Rebuild (após adicionar SHA-1)
eas build --platform android --profile production

# 5. Baixar AAB

# 6. Upload manual no Play Console
# (ou usar eas submit após configurar service account)
```

### Atualizações futuras
```bash
# 1. Incrementar versão em app.json
# version: "1.0.1" → "1.0.2"
# versionCode: 2 → 3

# 2. Build + Submit
eas build --platform android --profile production
eas submit --platform android --latest
```

---

## 📚 LINKS ÚTEIS

- **EAS Dashboard**: https://expo.dev/accounts/[username]/projects/keep-alert
- **Firebase Console**: https://console.firebase.google.com
- **Google Play Console**: https://play.google.com/console
- **Google Cloud Console**: https://console.cloud.google.com

---

## ⚡ DICAS RÁPIDAS

1. **Sempre teste em produção ANTES de publicar**
   ```bash
   eas build --platform android --profile preview
   # Instalar e testar Google Sign-In
   ```

2. **Mantenha backup da keystore**
   - EAS gerencia automaticamente
   - Mas sempre tenha backup no Expo dashboard

3. **Monitore o primeiro dia após publicação**
   - Firebase Crashlytics
   - Play Console > Estatísticas
   - Reviews dos usuários

4. **SHA-1 de debug ≠ SHA-1 de produção**
   - Debug: `~/.android/debug.keystore`
   - Produção: Gerenciado pelo EAS

---

**Pronto para começar!** 🚀
