# 🧪 Guia de Testes - Keep Alert

## 📁 Arquivos de Teste

- **`firebase-test-lab.yaml`** - Configuração do Firebase Test Lab
- **`test-scenarios.md`** - 48 cenários de teste documentados
- **`run-firebase-tests.sh`** - Script automatizado para executar testes

---

## 🚀 Como Executar Testes

### **1️⃣ Pré-requisitos**

```bash
# Instalar gcloud CLI
# Windows: https://cloud.google.com/sdk/docs/install
# Linux/Mac: curl https://sdk.cloud.google.com | bash

# Fazer login
gcloud auth login

# Configurar projeto
gcloud config set project keep-alert
```

---

### **2️⃣ Executar Testes (Opção 1 - Script)**

```bash
# Dar permissão de execução
chmod +x run-firebase-tests.sh

# Executar
./run-firebase-tests.sh
```

**Menu de opções:**
- **1** - Teste Rápido (1 dispositivo, 5 min)
- **2** - Teste Completo (3 dispositivos, 15 min)
- **3** - Teste com YAML personalizado
- **4** - Ver resultados anteriores

---

### **3️⃣ Executar Testes (Opção 2 - Manual)**

#### **Teste Rápido**
```bash
gcloud firebase test android run \
  --type robo \
  --app android/app/build/outputs/apk/debug/app-debug.apk \
  --device model=redfin,version=30,locale=pt_BR \
  --timeout 5m
```

#### **Teste com YAML**
```bash
gcloud firebase test android run firebase-test-lab.yaml
```

#### **Teste com Múltiplos Dispositivos**
```bash
gcloud firebase test android run \
  --type robo \
  --app android/app/build/outputs/apk/debug/app-debug.apk \
  --device model=redfin,version=30,locale=pt_BR \
  --device model=bluejay,version=31,locale=pt_BR \
  --device model=oriole,version=33,locale=pt_BR \
  --timeout 15m \
  --auto-grant-permissions \
  --record-video
```

---

## 📊 Ver Resultados

### **No Console Firebase**
```
https://console.firebase.google.com/project/keep-alert/testlab/histories
```

### **Via CLI**
```bash
# Listar testes recentes
gcloud firebase test android list

# Ver detalhes de um teste
gcloud firebase test android describe TEST_MATRIX_ID
```

---

## 🎯 Cenários de Teste

Veja todos os 48 cenários detalhados em: **`test-scenarios.md`**

### **Categorias:**
1. ✅ Autenticação (5 cenários)
2. ✅ Termos de Uso (2 cenários)
3. ✅ Localização (3 cenários)
4. ✅ Mapa e Incidentes (4 cenários)
5. ✅ Criar Incidente (3 cenários)
6. ✅ Interação com Incidentes (7 cenários)
7. ✅ Feed (3 cenários)
8. ✅ Seguindo (2 cenários)
9. ✅ Perfil (4 cenários)
10. ✅ Alertas de Emergência (3 cenários)
11. ✅ Conta Inativa (2 cenários)
12. ✅ Tratamento de Erros (3 cenários)
13. ✅ Performance (3 cenários)
14. ✅ Acessibilidade (3 cenários)

---

## 📱 Dispositivos de Teste

### **Configurados no YAML:**
- **Pixel 5 (redfin)** - Android 11
- **Pixel 6a (bluejay)** - Android 12
- **Pixel 6 Pro (oriole)** - Android 13

### **Ver todos dispositivos disponíveis:**
```bash
gcloud firebase test android models list
```

---

## 💰 Custos

O Firebase Test Lab oferece:
- **Gratuito:** 10 testes virtuais/dia + 5 testes físicos/dia
- **Pago:** Spark/Blaze plan - $5 por dispositivo/hora

**Estimativa:**
- Teste Rápido (5 min, 1 device): ~$0.42
- Teste Completo (15 min, 3 devices): ~$3.75

---

## 🐛 Troubleshooting

### **Erro: APK not found**
```bash
# Gerar o APK primeiro
npx expo run:android
# ou
cd android && ./gradlew assembleDebug
```

### **Erro: Permission denied**
```bash
# Habilitar billing no projeto Firebase
gcloud billing accounts list
gcloud billing projects link keep-alert --billing-account=BILLING_ACCOUNT_ID
```

### **Erro: Invalid YAML**
```bash
# Verificar sintaxe
gcloud firebase test android run firebase-test-lab.yaml --dry-run
```

---

## 📈 Métricas de Sucesso

### **Critérios de Aprovação:**
- ✅ 0 crashes
- ✅ 0 ANRs (Application Not Responding)
- ✅ Cobertura > 70% das telas
- ✅ Performance: FPS > 30
- ✅ Memória: < 200MB uso médio
- ✅ Bateria: Consumo baixo

---

## 🔄 CI/CD Integration

### **GitHub Actions**
```yaml
# .github/workflows/test.yml
name: Firebase Test Lab

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build APK
        run: |
          cd android
          ./gradlew assembleDebug

      - name: Run Firebase Tests
        run: |
          gcloud firebase test android run \
            --type robo \
            --app android/app/build/outputs/apk/debug/app-debug.apk \
            --device model=redfin,version=30,locale=pt_BR
```

---

## 📝 Relatório de Testes

Após cada execução, você receberá:
- 📹 **Vídeo** da execução
- 📊 **Métricas** de performance
- 🖼️ **Screenshots** de cada tela
- 📄 **Logs** completos
- 🐛 **Crashes** detectados
- ⚡ **Análise** de performance

---

## 🎓 Referências

- [Firebase Test Lab Docs](https://firebase.google.com/docs/test-lab)
- [gcloud CLI Reference](https://cloud.google.com/sdk/gcloud/reference/firebase/test/android)
- [Robo Test Guide](https://firebase.google.com/docs/test-lab/android/robo-ux-test)
- [Device Catalog](https://firebase.google.com/docs/test-lab/android/available-testing-devices)
