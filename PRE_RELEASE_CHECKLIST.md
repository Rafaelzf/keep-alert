# ✅ Checklist Pré-Publicação - Keep Alert

Use este checklist para garantir que tudo está pronto antes de publicar.

---

## 🔧 CONFIGURAÇÕES TÉCNICAS

### Firebase
- [ ] SHA-1 de produção adicionado no Firebase Console
- [ ] SHA-256 de produção adicionado no Firebase Console
- [ ] `google-services.json` atualizado com as novas credenciais
- [ ] Regras de segurança do Firestore configuradas em produção
- [ ] Índices do Firestore criados (verificar console)
- [ ] Firebase Auth - Google habilitado

### Google Cloud Platform
- [ ] OAuth 2.0 Client ID criado para Android (produção)
- [ ] Package name correto: `com.keepalert.android`
- [ ] SHA-1 do certificado de produção adicionado

### App Config
- [ ] `app.json` - versão correta (1.0.0)
- [ ] Package name: `com.keepalert.android`
- [ ] Permissões corretas declaradas
- [ ] Ícones e splash screen configurados

---

## 🏗️ BUILD

- [ ] EAS CLI instalado (`npm install -g eas-cli`)
- [ ] Login no EAS realizado (`eas login`)
- [ ] `eas.json` criado e configurado
- [ ] Build de produção executado (`eas build --platform android --profile production`)
- [ ] AAB gerado com sucesso
- [ ] AAB baixado localmente

---

## 🧪 TESTES

- [ ] Google Sign-In testado em produção (com SHA-1 de prod)
- [ ] Reportar incidente funcionando
- [ ] Mapa carregando corretamente
- [ ] Filtros de incidentes funcionando
- [ ] Perímetro ajustável funcionando
- [ ] Botão de refresh do mapa funcionando
- [ ] Atualização em tempo real dos incidentes
- [ ] Sistema de votação de situação
- [ ] Permissões de localização funcionando
- [ ] App testado em pelo menos 2 dispositivos diferentes

---

## 📱 GOOGLE PLAY CONSOLE

### Conta
- [ ] Conta de desenvolvedor criada
- [ ] Taxa de $25 paga
- [ ] Conta aprovada

### Aplicativo
- [ ] App criado no Play Console
- [ ] Nome do app: "Keep Alert"
- [ ] Idioma padrão: Português (Brasil)

### Ficha da Loja
- [ ] Descrição curta (máx 80 caracteres)
- [ ] Descrição completa
- [ ] Ícone 512x512 (PNG 32-bit)
- [ ] Mínimo 2 screenshots
- [ ] Imagem de destaque 1024x500
- [ ] Categoria selecionada
- [ ] Tags/palavras-chave

### Informações Obrigatórias
- [ ] E-mail de contato válido
- [ ] Política de privacidade (URL pública)
- [ ] Classificação de conteúdo preenchida
- [ ] Público-alvo definido (18+)
- [ ] Declaração de segurança de dados completada
- [ ] Países/regiões selecionados

### Upload
- [ ] AAB enviado
- [ ] Nome da versão: 1.0.0
- [ ] Notas da versão em português
- [ ] Notas da versão em inglês (se disponível em outros países)

---

## 📄 DOCUMENTAÇÃO

- [ ] Política de Privacidade escrita
- [ ] Política de Privacidade hospedada (URL pública)
  - Opções: Firebase Hosting, GitHub Pages, seu site
- [ ] E-mail de contato atualizado na política
- [ ] Data de última atualização na política

---

## 🧹 LIMPEZA DE CÓDIGO

- [ ] Remover `console.log` de debug
- [ ] Remover comentários de desenvolvimento
- [ ] Remover código comentado não utilizado
- [ ] Verificar TODOs e FIXMEs

---

## 🔒 SEGURANÇA

- [ ] Nenhuma API key hardcoded
- [ ] Nenhuma senha ou secret em código
- [ ] Regras de segurança do Firestore restritivas
- [ ] Validação de dados no backend (Firestore Rules)

---

## 📊 ANALYTICS & MONITORAMENTO

- [ ] Firebase Analytics configurado (opcional)
- [ ] Firebase Crashlytics configurado (recomendado)
- [ ] Eventos importantes sendo rastreados

---

## 🎨 ASSETS VISUAIS

### Obrigatórios
- [ ] Ícone do app (512x512)
- [ ] Screenshots (mínimo 2, recomendado 4-8)
- [ ] Imagem de destaque (1024x500)

### Screenshots Recomendados
Tire screenshots mostrando:
1. Tela de login
2. Mapa com incidentes
3. Reportar incidente (seleção de tipo)
4. Reportar incidente (descrição)
5. Detalhes de um incidente
6. Filtros de incidentes
7. Configurações de perímetro
8. Perfil do usuário (se tiver)

---

## 🚀 PUBLICAÇÃO

- [ ] Todos os itens pendentes no Play Console resolvidos
- [ ] Versão enviada para revisão
- [ ] E-mail de confirmação recebido

---

## ⚠️ IMPORTANTE - GOOGLE SIGN-IN

**Problema comum**: Google Sign-In funciona em dev mas não em produção.

**Solução**:
1. Verificar se o SHA-1 de PRODUÇÃO está no Firebase
2. Verificar se o Client ID Android de PRODUÇÃO existe no Google Cloud
3. Testar com o build de produção antes de publicar
4. SHA-1 de debug ≠ SHA-1 de produção!

**Como obter SHA-1 de produção:**
```bash
# Após o build EAS
eas credentials

# OU no Expo dashboard
https://expo.dev/accounts/[seu-username]/projects/keep-alert/credentials
```

---

## 📞 CONTATOS ÚTEIS

- **Expo Support**: https://expo.dev/support
- **Google Play Support**: https://support.google.com/googleplay/android-developer
- **Firebase Support**: https://firebase.google.com/support

---

## 🎯 APÓS PUBLICAÇÃO

- [ ] Baixar app da Play Store e testar
- [ ] Verificar se Google Sign-In funciona na versão da loja
- [ ] Monitorar crashes no primeiro dia
- [ ] Ler reviews e feedback
- [ ] Planejar primeira atualização

---

**Status**: [ ] Pronto para publicar | [ ] Ainda há pendências

**Data planejada para publicação**: _______________

**Notas adicionais**:
_______________________________________________
_______________________________________________
_______________________________________________
