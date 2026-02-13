# 🔨 Como Gerar APK de Release - Keep Alert

## ❌ Problema Atual

O APK de debug (`app-debug.apk`) não funciona no Firebase Test Lab porque precisa do Metro bundler rodando. O erro é:

```
Unable to load script.
Make sure you're running Metro or that your bundle 'index.android.bundle'
is packaged correctly for release.
```

## ✅ Solução: Gerar APK de Release

---

## **MÉTODO 1 - EAS Build (Mais Fácil)** ⭐

### **1. Instalar EAS CLI**
```bash
npm install -g eas-cli
```

### **2. Fazer login**
```bash
eas login
```

### **3. Configurar projeto**
```bash
eas build:configure
```

### **4. Gerar APK de release**
```bash
eas build --platform android --profile preview
```

Aguarde ~10-15 minutos e o APK estará pronto para download!

---

## **MÉTODO 2 - Build Local (Manual)** 🔧

### **Passo 1: Criar Keystore (apenas primeira vez)**

```bash
cd android/app

# Gerar keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore keep-alert-release.keystore \
  -alias keep-alert-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Informações para preencher:**
- Password: `keep-alert-2024` (ou outro de sua escolha)
- First and Last Name: `Keep Alert`
- Organizational Unit: `Mobile`
- Organization: `Keep Alert`
- City/Locality: `Sua Cidade`
- State/Province: `Seu Estado`
- Country Code: `BR`

### **Passo 2: Configurar gradle.properties**

Edite `android/gradle.properties` e adicione:

```properties
KEEP_ALERT_UPLOAD_STORE_FILE=keep-alert-release.keystore
KEEP_ALERT_UPLOAD_KEY_ALIAS=keep-alert-key
KEEP_ALERT_UPLOAD_STORE_PASSWORD=keep-alert-2024
KEEP_ALERT_UPLOAD_KEY_PASSWORD=keep-alert-2024
```

### **Passo 3: Atualizar build.gradle**

Edite `android/app/build.gradle`:

```gradle
android {
    ...

    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('KEEP_ALERT_UPLOAD_STORE_FILE')) {
                storeFile file(KEEP_ALERT_UPLOAD_STORE_FILE)
                storePassword KEEP_ALERT_UPLOAD_STORE_PASSWORD
                keyAlias KEEP_ALERT_UPLOAD_KEY_ALIAS
                keyPassword KEEP_ALERT_UPLOAD_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

### **Passo 4: Empacotar Bundle JavaScript**

```bash
# Voltar para raiz do projeto
cd ../..

# Criar pasta de assets
mkdir -p android/app/src/main/assets

# Empacotar bundle
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res
```

### **Passo 5: Gerar APK de Release**

```bash
cd android

# Windows
gradlew assembleRelease

# Linux/Mac
./gradlew assembleRelease
```

### **Passo 6: Localizar o APK**

O APK estará em:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## **MÉTODO 3 - Release Rápido (sem keystore própria)** ⚡

Se você só quer testar rapidamente:

### **1. Editar build.gradle**

```gradle
buildTypes {
    release {
        signingConfig signingConfigs.debug  // Usar debug key temporariamente
        minifyEnabled false
    }
}
```

### **2. Empacotar bundle**

```bash
mkdir -p android/app/src/main/assets

npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res
```

### **3. Gerar APK**

```bash
cd android
./gradlew assembleRelease
```

⚠️ **Atenção:** Este APK não pode ser publicado na Play Store, mas funciona para testes!

---

## **Verificar se o APK está correto**

```bash
# Descompactar APK
unzip -l android/app/build/outputs/apk/release/app-release.apk | grep index.android.bundle

# Deve mostrar:
# assets/index.android.bundle
```

Se o arquivo `index.android.bundle` estiver lá, está correto! ✅

---

## **Testar o APK localmente**

```bash
# Desinstalar versão antiga
adb uninstall com.keepalert.android

# Instalar nova versão
adb install android/app/build/outputs/apk/release/app-release.apk

# Abrir app
adb shell am start -n com.keepalert.android/.MainActivity
```

Se abrir sem erro vermelho, está pronto para o Firebase! 🎉

---

## **Fazer Upload no Firebase**

Agora sim, faça upload do APK correto:

```bash
firebase appdistribution:distribute \
  android/app/build/outputs/apk/release/app-release.apk \
  --app FIREBASE_APP_ID \
  --test-cases firebase-test-cases.yaml
```

---

## **🎯 Recomendação**

Para produção, use **EAS Build** (Método 1):
- ✅ Mais simples
- ✅ Gerencia keystore automaticamente
- ✅ CI/CD pronto
- ✅ Builds otimizadas

Para testes rápidos, use **Método 3**:
- ✅ Rápido
- ✅ Não precisa de keystore
- ⚠️ Não serve para produção

---

## **Troubleshooting**

### **Erro: "Task :app:bundleReleaseJsAndAssets FAILED"**
```bash
# Limpar cache
cd android
./gradlew clean

# Tentar novamente
./gradlew assembleRelease
```

### **Erro: "Entry name 'assets/...' collided"**
```bash
# Limpar assets antigos
rm -rf android/app/src/main/res/drawable-*
rm -rf android/app/src/main/res/raw

# Gerar bundle novamente
```

### **APK muito grande (>100MB)**
```bash
# Habilitar splits no build.gradle
splits {
    abi {
        enable true
        reset()
        include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        universalApk true
    }
}
```

---

## **Checklist Final**

Antes de fazer upload no Firebase:

- [ ] Bundle JavaScript está empacotado (`index.android.bundle` existe no APK)
- [ ] APK abre sem erros em dispositivo físico
- [ ] Versão é release (não debug)
- [ ] Tamanho do APK é razoável (< 150MB)
- [ ] Permissões estão corretas no AndroidManifest
- [ ] Firebase configurado corretamente

---

**Boa sorte! 🚀**
