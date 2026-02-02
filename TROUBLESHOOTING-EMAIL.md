# Troubleshooting - Email de Reset de Senha Não Chega

## 1. Verificar Logs do Console (Metro/Expo)

Quando você tenta enviar o email, verifique no terminal onde o Expo está rodando se aparece:
```
[forgotPassword] Enviando email para: seu@email.com
[forgotPassword] Email enviado com sucesso!
```

Se aparecer erro, anote a mensagem.

## 2. Verificar Firebase Console

### Passo 1: Verificar se o email está cadastrado
1. Acesse https://console.firebase.google.com
2. Selecione seu projeto
3. Vá em **Authentication** → **Users**
4. Procure pelo email que você está testando
5. ✅ Se o email não aparecer na lista, você precisa criar uma conta primeiro

### Passo 2: Verificar configuração de email
1. No Firebase Console, vá em **Authentication** → **Templates**
2. Clique em **Redefinir senha** (Password reset)
3. Verifique:
   - ✅ Nome do remetente está configurado
   - ✅ Endereço de resposta está configurado
   - ✅ Template está ativo

### Passo 3: Verificar domínio autorizado
1. No Firebase Console, vá em **Authentication** → **Settings**
2. Vá na aba **Authorized domains**
3. Verifique se seu domínio está na lista

## 3. Possíveis Causas

### Causa 1: Email não está cadastrado no Firebase
**Solução:** Crie uma conta primeiro usando a tela de registro

### Causa 2: Email está na caixa de SPAM
**Solução:** Verifique a pasta de spam/lixo eletrônico

### Causa 3: Firebase está usando serviço de email gratuito
O Firebase usa um serviço de email gratuito que pode ter atrasos ou cair em spam.

**Solução:**
- Aguarde até 10-15 minutos
- Verifique spam
- Configure SMTP customizado (para produção)

### Causa 4: Conta Firebase no plano gratuito (Spark)
O plano gratuito tem limitações no envio de emails.

**Solução:** Verifique quotas em Firebase Console → Usage

### Causa 5: Email digitado errado
**Solução:** Verifique se o email está correto

## 4. Como Testar Agora

### Teste 1: Email que você TEM acesso
```
1. Use um email real que você pode acessar (Gmail, Outlook, etc)
2. Tente enviar o reset
3. Verifique:
   - Console do Metro/Expo (logs)
   - Caixa de entrada
   - Pasta de SPAM
   - Aguarde 5 minutos
```

### Teste 2: Verificar no Firebase Console
```
1. Firebase Console → Authentication → Users
2. Clique no usuário
3. Veja se há registro de "Password reset email sent"
```

## 5. Configurar Email Customizado (Opcional - Produção)

Para produção, é recomendado configurar SMTP customizado:

1. Firebase Console → Project Settings
2. Cloud Messaging
3. Configure SMTP custom (requer plano Blaze)

Provedores recomendados:
- SendGrid
- AWS SES
- Mailgun
- Postmark

## 6. Comandos para Ver Logs

No terminal onde o Expo está rodando, você verá os logs automaticamente.

Se quiser ver logs mais detalhados:
```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

Os logs aparecem no terminal em tempo real.

## 7. Verificar Configuração do Firebase

Verifique se o arquivo de configuração está correto:
```bash
# Ver variáveis de ambiente
cat .env
```

Deve conter:
- EXPO_PUBLIC_FIREBASE_API_KEY
- EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
- etc...

## 8. Próximos Passos

1. ✅ Rode o app novamente: `npm start`
2. ✅ Tente enviar email de reset
3. ✅ Olhe no console do Metro/Expo os logs
4. ✅ Verifique Firebase Console → Authentication → Users
5. ✅ Verifique spam
6. ✅ Aguarde 5-10 minutos

## 9. Se Nada Funcionar

Teste com a API direto no Firebase Console:
1. Firebase Console → Authentication → Users
2. Selecione um usuário
3. Clique nos 3 pontinhos (...)
4. "Send password reset email"
5. Veja se o email chega

Se funcionar por aqui mas não pelo app, o problema é no código.
Se não funcionar nem por aqui, o problema é na configuração do Firebase.
