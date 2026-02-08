# 🚀 Instruções para Deploy das Cloud Functions

## ✅ O que já foi feito:
- ✅ Dependências instaladas
- ✅ Código compilado (TypeScript → JavaScript)
- ✅ `firebase.json` configurado
- ✅ `.firebaserc` configurado com projeto

## 📋 Execute estes comandos no seu terminal:

### 1. Login no Firebase (apenas primeira vez)

```bash
npx firebase-tools login
```

Isso vai:
1. Abrir navegador
2. Pedir para fazer login com sua conta Google
3. Autorizar Firebase CLI

### 2. Deploy das Functions

```bash
cd functions
firebase deploy --only functions
```

Ou da raiz do projeto:

```bash
npx firebase-tools deploy --only functions
```

### 3. Verificar Deploy

Após o deploy, você verá:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/keep-alert-799b5/overview
Functions URL (sendIncidentAlerts): https://us-central1-keep-alert-799b5.cloudfunctions.net/sendIncidentAlerts

Functions:
  sendIncidentAlerts(us-central1)
```

### 4. Verificar Logs

```bash
npx firebase-tools functions:log --only sendIncidentAlerts
```

Ou no console:
https://console.firebase.google.com/project/keep-alert-799b5/functions/logs

---

## 🧪 Testar Após Deploy

1. **Abrir app no celular**
2. **Criar incidente próximo à sua localização**
3. **Aguardar notificação aparecer!** 📱

---

## ❌ Troubleshooting

### Erro: "Failed to authenticate"
```bash
npx firebase-tools login
```

### Erro: "No project active"
```bash
npx firebase-tools use keep-alert-799b5
```

### Erro de permissão
Verificar se sua conta Google tem acesso ao projeto no Firebase Console

### Ver status do deploy
```bash
npx firebase-tools functions:list
```
