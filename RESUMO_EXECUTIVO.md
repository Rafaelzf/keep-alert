# ⚡ RESUMO EXECUTIVO - Publicar Keep Alert

**Para quem quer ir direto ao ponto!**

---

## 📌 ORDEM DE EXECUÇÃO

### 1️⃣ PREPARAÇÃO (5 min)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login
```

**Preencher dados pessoais**:
- [ ] Atualizar `POLITICA_PRIVACIDADE.md` com seu e-mail e data
- [ ] Hospedar política em URL pública (Firebase Hosting, GitHub Pages, etc)

---

### 2️⃣ PRIMEIRO BUILD (15-20 min)

```bash
# Build de produção
eas build --platform android --profile production
```

**Durante o build**:
- Pergunta sobre keystore → Escolha **Yes** (gerar nova)
- Aguarde ~15-20 minutos

**Após concluir**:
```bash
# Obter SHA-1 e SHA-256
eas credentials --platform android

# Copie os fingerprints exibidos
```

---

### 3️⃣ CONFIGURAR FIREBASE (5 min)

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Seu projeto → **Configurações do Projeto**
3. Aba **Seus apps** → App Android
4. Clique **Adicionar impressão digital**
5. Cole **SHA-1** e **SHA-256** (do passo anterior)
6. **Salvar**
7. Baixe o **novo** `google-services.json`
8. Substitua em `firebase/google-services.json`

---

### 4️⃣ CONFIGURAR GOOGLE CLOUD (5 min)

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Seu projeto → **APIs e Serviços** → **Credenciais**
3. Verificar se existe **Client ID OAuth 2.0** para Android
4. Se NÃO existir:
   - **Criar Credenciais** → **ID do cliente OAuth**
   - Tipo: **Android**
   - Nome: `Keep Alert Android`
   - Package: `com.keepalert.android`
   - SHA-1: Cole o mesmo do Firebase

---

### 5️⃣ REBUILD (15-20 min)

```bash
# Build novamente (agora com SHA-1 configurado)
eas build --platform android --profile production

# Aguarde concluir e baixe o AAB
```

---

### 6️⃣ CRIAR CONTA PLAY CONSOLE (1-2 dias)

1. Acesse [Google Play Console](https://play.google.com/console)
2. **Criar conta** de desenvolvedor
3. Pagar $25 (única vez)
4. Aguardar aprovação (~48h)

---

### 7️⃣ CRIAR APP NO PLAY CONSOLE (10 min)

1. **Criar app**
   - Nome: `Keep Alert`
   - Idioma: Português (Brasil)
   - Tipo: App
   - Gratuito

2. **Preencher obrigatórios**:
   - Descrição curta e completa (use template do `PUBLICACAO_GOOGLE_PLAY.md`)
   - Ícone 512x512
   - Mínimo 2 screenshots
   - Imagem destaque 1024x500
   - Categoria: Mapas e navegação
   - E-mail de contato
   - **URL da política de privacidade** (CRÍTICO!)

3. **Classificação de conteúdo**
   - Preencher questionário
   - Obter classificação

4. **Público-alvo**
   - 18+ anos

5. **Segurança de dados**
   - Declarar: localização, nome, e-mail
   - Finalidade: funcionalidade do app
   - Não compartilha com terceiros

---

### 8️⃣ UPLOAD DO AAB (5 min)

1. **Produção** → **Criar nova versão**
2. **Upload** do arquivo `.aab`
3. Nome da versão: `1.0.0`
4. Notas da versão:
   ```
   🎉 Lançamento inicial do Keep Alert!
   • Mapa em tempo real com incidentes
   • Sistema de reportes
   • Filtros personalizáveis
   • Autenticação via Google
   ```
5. **Salvar**

---

### 9️⃣ PAÍSES E REVISÃO (2 min)

1. Selecionar países: **Brasil** (no mínimo)
2. Verificar todos os ✅ verdes
3. **Enviar para revisão**

---

### 🔟 AGUARDAR APROVAÇÃO (1-7 dias)

- Google Play revisa o app
- Você receberá e-mail com o resultado
- Primeira publicação pode levar até 7 dias
- Atualizações futuras: 1-2 dias

---

## ⚠️ PROBLEMAS MAIS COMUNS

### ❌ Google Sign-In não funciona no app publicado

**Causa**: SHA-1 de produção não foi adicionado no Firebase/Google Cloud

**Solução**:
1. `eas credentials --platform android`
2. Copiar SHA-1 e SHA-256
3. Adicionar no Firebase Console
4. Adicionar no Google Cloud Console
5. Rebuild: `eas build --platform android --profile production`

---

### ❌ "Você precisa adicionar uma política de privacidade"

**Solução**:
1. Preencher `POLITICA_PRIVACIDADE.md` com seus dados
2. Hospedar em:
   - Firebase Hosting
   - GitHub Pages
   - Seu próprio site
3. Adicionar URL no Play Console

---

### ❌ "Version code 1 has already been used"

**Solução**:
Edite `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // era 1.0.0
    "android": {
      "versionCode": 2   // era 1
    }
  }
}
```

---

## 📱 HOSPEDAR POLÍTICA DE PRIVACIDADE (RÁPIDO)

### Opção 1: GitHub Pages (Grátis, 2 min)

```bash
# 1. Criar repositório no GitHub
# 2. Criar pasta docs/
mkdir docs
cp POLITICA_PRIVACIDADE.md docs/index.md

# 3. Commit e push
git add docs/
git commit -m "Add privacy policy"
git push

# 4. No GitHub:
# Settings → Pages → Source: main branch, /docs folder

# 5. URL será: https://[seu-usuario].github.io/[repo]/
```

### Opção 2: Firebase Hosting (Grátis, 5 min)

```bash
# 1. Instalar Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Init Hosting
firebase init hosting

# 4. Criar public/privacy.html com conteúdo da política

# 5. Deploy
firebase deploy --only hosting

# 6. URL: https://[seu-projeto].web.app/privacy.html
```

---

## 🎯 CHECKLIST MÍNIMO

Antes de publicar, certifique-se:

- [ ] SHA-1 adicionado no Firebase
- [ ] SHA-1 adicionado no Google Cloud
- [ ] google-services.json atualizado
- [ ] Build de produção funcionando
- [ ] Google Sign-In testado no build de produção
- [ ] Política de privacidade hospedada (URL pública)
- [ ] Screenshots tirados (mínimo 2)
- [ ] Ícone 512x512 preparado
- [ ] AAB baixado
- [ ] Play Console configurado
- [ ] Enviado para revisão

---

## ⏱️ TEMPO TOTAL ESTIMADO

| Etapa | Tempo |
|-------|-------|
| Preparação | 5 min |
| Primeiro build | 20 min |
| Firebase + Google Cloud | 10 min |
| Rebuild | 20 min |
| Criar conta Play Console | 1-2 dias (aprovação) |
| Configurar app | 20 min |
| Upload e envio | 10 min |
| **TOTAL (sem aprovações)** | **~1h 30min** |

---

## 🚀 PRÓXIMOS PASSOS APÓS PUBLICAÇÃO

1. **Baixar da Play Store** e testar
2. **Monitorar crashes** (Firebase Crashlytics)
3. **Ler reviews** dos usuários
4. **Planejar v1.1.0**

---

## 📞 AJUDA

- Ver guia completo: `PUBLICACAO_GOOGLE_PLAY.md`
- Comandos rápidos: `COMANDOS_RAPIDOS.md`
- Checklist detalhado: `PRE_RELEASE_CHECKLIST.md`

---

**Boa sorte! 🎉**

Se tudo estiver correto, você terá seu app na Play Store em ~1-7 dias!
