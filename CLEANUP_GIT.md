# 🚨 Limpeza de Segurança - Remover .env do Git

## Problema
O arquivo `.env` com chaves Firebase foi commitado no repositório. Mesmo que você delete agora, ele permanece no histórico do Git.

## Solução

### 1. Remover .env do histórico do Git

```bash
# Remove o arquivo do Git mas mantém localmente
git rm --cached .env

# Commit a remoção
git add .gitignore
git commit -m "security: remove .env from repository and add to .gitignore"

# Se já foi enviado para GitHub/GitLab, force push (cuidado!)
git push origin main --force
```

### 2. Regenerar chaves Firebase (RECOMENDADO)

Como as chaves já foram expostas no Git:

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Project Settings** > **General**
3. Role até **Your apps**
4. Delete o app web atual e crie um novo
5. Copie as novas credenciais para o `.env`

### 3. Configurar Firebase App Check

Para proteger contra uso não autorizado:

1. No Firebase Console, vá em **App Check**
2. Ative para seu app
3. Configure reCAPTCHA para web
4. Configure Play Integrity para Android
5. Configure App Attest para iOS

### 4. Configurar Security Rules

No Firebase Console > **Firestore Database** ou **Realtime Database**:

```javascript
// Exemplo de regras seguras
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Só permite acesso autenticado
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Verificação

Após fazer isso, verifique:

```bash
# .env não deve aparecer
git status

# .env deve estar na lista
cat .gitignore | grep .env
```
