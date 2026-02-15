# 📱 Keep Alert - Guia de Publicação na Google Play Store

![Status](https://img.shields.io/badge/Status-Pronto_para_Publicar-success)
![Platform](https://img.shields.io/badge/Platform-Android-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

---

## 📚 Documentação Organizada

Este repositório contém **4 guias completos** para te ajudar a publicar o Keep Alert na Google Play Store:

### 🎯 Escolha seu guia:

| Guia | Quando usar | Tempo de leitura |
|------|-------------|------------------|
| **[RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md)** | 🚀 Quer publicar RÁPIDO | 5 min |
| **[PUBLICACAO_GOOGLE_PLAY.md](./PUBLICACAO_GOOGLE_PLAY.md)** | 📖 Quer entender TUDO | 20 min |
| **[COMANDOS_RAPIDOS.md](./COMANDOS_RAPIDOS.md)** | 💻 Quer apenas os comandos | 3 min |
| **[PRE_RELEASE_CHECKLIST.md](./PRE_RELEASE_CHECKLIST.md)** | ✅ Quer verificar se está tudo OK | 10 min |

---

## 🎯 Recomendação

**Se é sua primeira vez publicando:**
1. Leia o **[RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md)** (5 min)
2. Execute os passos seguindo o **[COMANDOS_RAPIDOS.md](./COMANDOS_RAPIDOS.md)**
3. Use o **[PRE_RELEASE_CHECKLIST.md](./PRE_RELEASE_CHECKLIST.md)** antes de enviar
4. Consulte o **[PUBLICACAO_GOOGLE_PLAY.md](./PUBLICACAO_GOOGLE_PLAY.md)** se tiver dúvidas

**Se já publicou antes:**
- Use o **[COMANDOS_RAPIDOS.md](./COMANDOS_RAPIDOS.md)** para atualizações

---

## 📄 Arquivos Importantes

### Configuração
- ✅ `eas.json` - Configuração do EAS Build (criado)
- ✅ `app.json` - Configuração do app (atualizado com versionCode)

### Documentação Legal
- ⚠️ `POLITICA_PRIVACIDADE.md` - **VOCÊ PRECISA PREENCHER**
  - Substitua `[SEU_EMAIL]` pelo seu e-mail
  - Substitua `[DATA]` pela data atual
  - Hospede em URL pública (Firebase Hosting ou GitHub Pages)

---

## ⚡ Início Rápido (3 passos)

### 1. Instalar EAS CLI
```bash
npm install -g eas-cli
eas login
```

### 2. Fazer build de produção
```bash
eas build --platform android --profile production
```

### 3. Obter SHA-1 e configurar Firebase
```bash
eas credentials --platform android
# Copie SHA-1 e SHA-256
# Adicione no Firebase Console
```

**Depois disso**, siga o [RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md)

---

## 🔑 Configurações Críticas

### ⚠️ IMPORTANTE - Google Sign-In em Produção

O Google Sign-In funciona no dev mas **NÃO vai funcionar em produção** se você não configurar o SHA-1 correto!

**Checklist Google Sign-In**:
- [ ] SHA-1 de **PRODUÇÃO** adicionado no Firebase Console
- [ ] SHA-1 de **PRODUÇÃO** adicionado no Google Cloud Console
- [ ] Client ID OAuth Android criado no Google Cloud
- [ ] `google-services.json` atualizado e substituído
- [ ] Testado no build de produção ANTES de publicar

**Como obter SHA-1 de produção:**
```bash
eas credentials --platform android
```

⚠️ **ATENÇÃO**: SHA-1 de debug ≠ SHA-1 de produção!

---

## 📱 Requisitos da Google Play Store

### Obrigatórios
- [x] Conta de desenvolvedor ($25 única vez)
- [ ] Política de privacidade hospedada (URL pública)
- [ ] Ícone 512x512
- [ ] Mínimo 2 screenshots
- [ ] Imagem de destaque 1024x500
- [ ] Descrição do app
- [ ] Classificação de conteúdo
- [ ] Declaração de segurança de dados

### Recomendados
- [ ] 4-8 screenshots de qualidade
- [ ] Vídeo promocional (opcional)
- [ ] Firebase Crashlytics configurado
- [ ] Teste interno antes de produção

---

## 🗺️ Roadmap de Publicação

```
┌─────────────────────┐
│  1. Preparação      │ ← Você está aqui
│  (5 min)            │
└─────────────────────┘
           ↓
┌─────────────────────┐
│  2. Build EAS       │
│  (20 min)           │
└─────────────────────┘
           ↓
┌─────────────────────┐
│  3. Config Firebase │
│  (10 min)           │
└─────────────────────┘
           ↓
┌─────────────────────┐
│  4. Rebuild         │
│  (20 min)           │
└─────────────────────┘
           ↓
┌─────────────────────┐
│  5. Play Console    │
│  (30 min)           │
└─────────────────────┘
           ↓
┌─────────────────────┐
│  6. Revisão Google  │
│  (1-7 dias)         │
└─────────────────────┘
           ↓
┌─────────────────────┐
│  🎉 PUBLICADO!      │
└─────────────────────┘
```

---

## ❓ FAQ Rápido

### P: Posso publicar via Firebase?
**R:** Não diretamente. Firebase não publica apps na Play Store. Você precisa usar:
- **EAS Build** (Expo) para gerar o AAB
- **Google Play Console** para publicar

### P: Quanto custa?
**R:**
- Conta de desenvolvedor Google Play: **$25** (única vez)
- EAS Build: **Gratuito** (com limitações) ou pago
- Firebase: **Gratuito** (plano Spark suficiente para começar)

### P: Quanto tempo demora?
**R:**
- Preparar e fazer build: **~1h 30min**
- Revisão do Google: **1-7 dias** (primeira vez)
- Atualizações futuras: **1-2 dias**

### P: E se o Google Sign-In não funcionar?
**R:** 99% dos casos é SHA-1 incorreto. Veja [RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md) → Seção "Problemas Comuns"

---

## 🆘 Precisa de Ajuda?

1. **Problema com Google Sign-In**: Ver [RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md) → Problemas Comuns
2. **Dúvida sobre o processo**: Consultar [PUBLICACAO_GOOGLE_PLAY.md](./PUBLICACAO_GOOGLE_PLAY.md)
3. **Esqueceu um comando**: Ver [COMANDOS_RAPIDOS.md](./COMANDOS_RAPIDOS.md)
4. **Quer verificar tudo**: Usar [PRE_RELEASE_CHECKLIST.md](./PRE_RELEASE_CHECKLIST.md)

---

## 📞 Suporte Oficial

- **Expo/EAS**: https://expo.dev/support
- **Google Play**: https://support.google.com/googleplay/android-developer
- **Firebase**: https://firebase.google.com/support

---

## 🎯 Próximos Passos

**Pronto para começar?**

1. **AGORA**: Leia o [RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md)
2. **DEPOIS**: Execute os comandos do [COMANDOS_RAPIDOS.md](./COMANDOS_RAPIDOS.md)
3. **ANTES DE PUBLICAR**: Verifique o [PRE_RELEASE_CHECKLIST.md](./PRE_RELEASE_CHECKLIST.md)

---

## 📊 Status do Projeto

- [x] App desenvolvido
- [x] Build de release gerado
- [x] Firebase configurado
- [x] Documentação de publicação criada
- [ ] SHA-1 de produção configurado
- [ ] Política de privacidade hospedada
- [ ] Conta Play Console criada
- [ ] App enviado para revisão
- [ ] App publicado

---

**Última atualização**: 14/02/2026
**Versão do guia**: 1.0.0
**Versão do app**: 1.0.0

---

<div align="center">

**Boa sorte com a publicação! 🚀**

Se seguir os passos corretamente, seu app estará na Play Store em breve!

</div>
