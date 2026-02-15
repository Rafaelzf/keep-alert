# 📱 Guia Completo: Publicar Keep Alert na Google Play Store

Este guia fornece um passo a passo completo para publicar o aplicativo Keep Alert na Google Play Store.

---

## 📋 PRÉ-REQUISITOS

### ✅ O que você JÁ TEM:
- ✅ Projeto montado no Google Cloud Platform
- ✅ Projeto montado no Firebase
- ✅ Build de release gerado
- ✅ App configurado (app.json)
- ✅ Firebase configurado (google-services.json)

### ⚠️ O que você PRECISA TER:
- Conta de desenvolvedor Google Play ($25 única vez)
- SHA-1 e SHA-256 do certificado de produção
- Google Sign-In configurado para produção

---

## 🔑 PARTE 1: CONFIGURAR GOOGLE SIGN-IN PARA PRODUÇÃO

### Passo 1.1: Gerar SHA-1 e SHA-256 do certificado de produção

```bash
# Se você já tem uma keystore, use:
keytool -list -v -keystore caminho/para/sua.keystore -alias seu-alias

# Se ainda não tem, o EAS Build vai gerar automaticamente
# Neste caso, pule para o Passo 2 e volte aqui depois
```

### Passo 1.2: Adicionar SHA-1 no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto **keep-alert**
3. Vá em **Configurações do Projeto** (ícone de engrenagem)
4. Role até **Seus apps** → Selecione o app Android
5. Clique em **Adicionar impressão digital**
6. Cole o **SHA-1** e **SHA-256** que você obteve
7. Clique em **Salvar**

### Passo 1.3: Atualizar google-services.json

1. No Firebase Console, baixe o novo `google-services.json`
2. Substitua o arquivo em `firebase/google-services.json`

### Passo 1.4: Adicionar Client ID no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Selecione seu projeto
3. Vá em **APIs e Serviços** → **Credenciais**
4. Verifique se existe um **Client ID OAuth 2.0** para Android com:
   - **Nome do pacote**: `com.keepalert.android`
   - **SHA-1**: o mesmo que você adicionou no Firebase
5. Se não existir, clique em **Criar Credenciais** → **ID do cliente OAuth**
   - Tipo: **Android**
   - Nome: **Keep Alert (Android Produção)**
   - Nome do pacote: `com.keepalert.android`
   - SHA-1: Cole o SHA-1 do certificado

---

## 🏗️ PARTE 2: BUILD DE PRODUÇÃO COM EAS

### Passo 2.1: Instalar EAS CLI

```bash
npm install -g eas-cli
```

### Passo 2.2: Login no EAS

```bash
eas login
```

### Passo 2.3: Configurar o projeto

```bash
eas build:configure
```

### Passo 2.4: Gerar build de produção (AAB)

```bash
# Build para produção (gera Android App Bundle - .aab)
eas build --platform android --profile production
```

**⚠️ IMPORTANTE:** Durante o build, o EAS vai perguntar se você quer gerar uma nova keystore. Escolha:
- **Se é a primeira build**: `Yes` - gera uma nova keystore
- **Se já tem uma keystore**: `No` - use a existente

### Passo 2.5: Baixar o AAB

Após o build concluir (pode levar ~15-20 min):
1. Acesse o link fornecido pelo EAS
2. Faça download do arquivo `.aab`

### Passo 2.6: Obter SHA-1 do certificado (se não tinha antes)

```bash
# Acesse o Expo dashboard
# https://expo.dev/accounts/[seu-username]/projects/keep-alert/credentials

# OU use o comando:
eas credentials
```

1. Selecione **Android**
2. Selecione **Production**
3. Copie o **SHA-1 fingerprint** e **SHA-256 fingerprint**
4. **VOLTE ao Passo 1.2** e adicione esses SHA no Firebase

---

## 🎮 PARTE 3: CRIAR CONTA NO GOOGLE PLAY CONSOLE

### Passo 3.1: Criar conta de desenvolvedor

1. Acesse [Google Play Console](https://play.google.com/console)
2. Clique em **Criar conta**
3. Escolha **Organização** ou **Pessoa física**
4. Preencha as informações
5. Pague a taxa de $25 (única vez)
6. Aguarde aprovação (~48h)

---

## 📤 PARTE 4: UPLOAD DO APP NA PLAY STORE

### Passo 4.1: Criar novo aplicativo

1. No [Play Console](https://play.google.com/console), clique em **Criar app**
2. Preencha:
   - **Nome do app**: `Keep Alert`
   - **Idioma padrão**: `Português (Brasil)`
   - **App ou jogo**: `App`
   - **Gratuito ou pago**: `Gratuito`
3. Aceite as declarações
4. Clique em **Criar app**

### Passo 4.2: Configurar informações principais

#### 4.2.1 - Ficha da loja (Store Listing)

**Descrição curta** (máx. 80 caracteres):
```
Alertas de segurança em tempo real próximos a você
```

**Descrição completa** (máx. 4000 caracteres):
```
Keep Alert é um aplicativo de segurança colaborativo que permite reportar e visualizar ocorrências em tempo real próximas à sua localização.

🚨 RECURSOS PRINCIPAIS:

• Mapa em tempo real com incidentes reportados
• Reporte rápido de ocorrências (acidentes, assaltos, etc.)
• Sistema de perímetro personalizável
• Filtros por tipo de ocorrência
• Atualização automática de incidentes
• Interface intuitiva e moderna

🔒 PRIVACIDADE:

• Localização aproximada para proteção de privacidade
• Autenticação segura via Google
• Dados criptografados no Firebase

📍 COMO USAR:

1. Faça login com sua conta Google
2. Permita acesso à localização
3. Veja incidentes próximos no mapa
4. Reporte ocorrências com um toque
5. Ajude a manter sua comunidade informada

Keep Alert - Fique alerta, fique seguro!
```

**Capturas de tela**:
- Mínimo 2, recomendado 8
- Tamanho: 16:9 ou 9:16
- Resolução mínima: 320px
- Formato: PNG ou JPEG

**Ícone do app**:
- Tamanho: 512x512 px
- Formato: PNG (32-bit)
- Arquivo: Use `assets/icon.png` (ou crie um 512x512)

**Imagem de destaque**:
- Tamanho: 1024x500 px
- Formato: PNG ou JPEG

**Categoria**: `Mapas e navegação` ou `Ferramentas`

**E-mail de contato**: Seu e-mail

**Política de privacidade**: URL da sua política (OBRIGATÓRIO)

#### 4.2.2 - Classificação de conteúdo

1. Vá em **Classificação de conteúdo**
2. Preencha o questionário:
   - O app contém violência? **Não** (apenas reportes informativos)
   - Conteúdo sexual? **Não**
   - Linguagem imprópria? **Não**
   - etc.
3. Obtenha a classificação

#### 4.2.3 - Público-alvo e conteúdo

1. **Público-alvo**: 18+ (app de segurança)
2. **Anúncios**: Não (se não tiver anúncios)

#### 4.2.4 - Política de privacidade e segurança de dados

**⚠️ CRÍTICO - Declaração de segurança de dados:**

Você precisa declarar quais dados coleta:

**Dados coletados:**
- ✅ Localização aproximada (para mostrar incidentes próximos)
- ✅ Nome e e-mail (do Google Sign-In)
- ✅ Informações pessoais (descrições de incidentes)

**Uso dos dados:**
- Funcionalidade do app
- Segurança e proteção contra fraudes

**Compartilhamento:**
- Não compartilhado com terceiros

### Passo 4.3: Upload do AAB

1. Vá em **Produção** → **Criar nova versão**
2. Clique em **Upload** e selecione o arquivo `.aab`
3. Preencha:
   - **Nome da versão**: `1.0.0`
   - **Notas da versão** (em português):
     ```
     🎉 Lançamento inicial do Keep Alert!

     • Mapa em tempo real com incidentes
     • Sistema de reportes de ocorrências
     • Filtros personalizáveis
     • Perímetro ajustável
     • Autenticação via Google
     ```

### Passo 4.4: Configurar países/regiões

1. **Países disponíveis**: Selecione Brasil (ou outros países)

### Passo 4.5: Revisar e lançar

1. Verifique todos os itens pendentes na página inicial
2. Complete todos os itens obrigatórios
3. Quando tudo estiver ✅ verde, clique em **Enviar para revisão**

---

## 🔄 PARTE 5: CONFIGURAR PUBLICAÇÃO AUTOMÁTICA (OPCIONAL)

### Passo 5.1: Criar Service Account no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Vá em **IAM e Admin** → **Contas de serviço**
3. Clique em **Criar conta de serviço**
4. Nome: `expo-play-store-deployer`
5. Clique em **Criar e continuar**
6. Função: **Nenhuma** (configuraremos no Play Console)
7. Clique em **Concluir**
8. Clique na conta de serviço criada
9. Vá em **Chaves** → **Adicionar chave** → **Criar nova chave**
10. Tipo: **JSON**
11. Salve o arquivo como `play-store-service-account.json` na raiz do projeto

### Passo 5.2: Configurar permissões no Play Console

1. No [Play Console](https://play.google.com/console), vá em **Configurações** (no menu lateral)
2. **Acesso à API** → **Criar novo projeto de conta de serviço**
3. Siga o link para Google Cloud Console
4. Copie o e-mail da service account (formato: `nome@projeto.iam.gserviceaccount.com`)
5. Volte ao Play Console
6. Clique em **Conceder acesso**
7. Cole o e-mail da service account
8. Permissões:
   - **Versões**: Criar e editar
   - **Ficha da loja**: Ver
9. Clique em **Convidar usuário**

### Passo 5.3: Publicar automaticamente com EAS

```bash
# Após fazer o build de produção:
eas submit --platform android --latest

# OU especificar o arquivo:
eas submit --platform android --path ./keep-alert.aab
```

---

## ⚠️ CHECKLIST FINAL ANTES DE PUBLICAR

### Desenvolvimento
- [ ] Remover todos os `console.log` de debug
- [ ] Testar Google Sign-In em produção
- [ ] Testar todas as funcionalidades principais
- [ ] Verificar permissões (localização, notificações)
- [ ] Testar em diferentes dispositivos/tamanhos de tela

### Firebase
- [ ] SHA-1 de produção adicionado no Firebase
- [ ] Regras de segurança do Firestore configuradas
- [ ] Autenticação Google habilitada
- [ ] Índices do Firestore criados

### Assets
- [ ] Ícone 512x512 preparado
- [ ] Screenshots do app (mín. 2)
- [ ] Imagem de destaque 1024x500
- [ ] Splash screen configurado

### Documentação
- [ ] Política de privacidade hospedada (URL pública)
- [ ] Termos de uso (se aplicável)
- [ ] E-mail de contato válido

### Play Console
- [ ] Todas as seções obrigatórias preenchidas
- [ ] Classificação de conteúdo obtida
- [ ] Países/regiões selecionados
- [ ] AAB enviado com sucesso

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### Erro: "Google Sign-In não funciona em produção"
**Solução**: Verifique se o SHA-1 do certificado de produção está no Firebase E no Google Cloud Console.

### Erro: "Upload rejected: Version code already exists"
**Solução**: Incremente o `versionCode` no `app.json`:
```json
"android": {
  "versionCode": 2  // Era 1, agora 2
}
```

### Erro: "Falta política de privacidade"
**Solução**: Crie uma página HTML simples com sua política e hospede no Firebase Hosting ou GitHub Pages.

### Erro: "SHA-1 inválido"
**Solução**: Use o SHA-1 do certificado de PRODUÇÃO (do EAS), não do debug.

---

## 📚 RECURSOS ADICIONAIS

- [Documentação EAS Build](https://docs.expo.dev/build/introduction/)
- [Documentação EAS Submit](https://docs.expo.dev/submit/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Firebase Auth - Google Sign In](https://firebase.google.com/docs/auth/android/google-signin)

---

## 🎯 PRÓXIMOS PASSOS APÓS PUBLICAÇÃO

1. **Testar a versão da Play Store**: Baixe o app da Play Store e teste
2. **Monitorar crashes**: Use Firebase Crashlytics
3. **Coletar feedback**: Analytics e reviews
4. **Planejar atualizações**: Incremente versão e publique novamente

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verifique o checklist acima
2. Consulte a documentação oficial
3. Revise as configurações do Firebase
4. Teste o build localmente antes de submeter

---

**Boa sorte com a publicação! 🚀**
