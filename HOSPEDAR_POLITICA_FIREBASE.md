# 🔥 Hospedar Política de Privacidade no Firebase Hosting

**Tempo estimado**: 5 minutos

---

## 🎯 Por que Firebase Hosting?

- ✅ **Gratuito** (10 GB/mês)
- ✅ **HTTPS automático**
- ✅ **Rápido** (CDN global)
- ✅ **Você já usa Firebase** no projeto
- ✅ **URL profissional** (yourproject.web.app)

---

## 📋 Passo a Passo

### 1. Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login no Firebase

```bash
firebase login
```

Uma janela do navegador vai abrir para você fazer login com sua conta Google.

### 3. Inicializar Firebase Hosting

```bash
# Na raiz do projeto keep-alert
firebase init hosting
```

**Respostas para as perguntas:**

```
? What do you want to use as your public directory?
  → public

? Configure as a single-page app (rewrite all urls to /index.html)?
  → No

? Set up automatic builds and deploys with GitHub?
  → No

? File public/index.html already exists. Overwrite?
  → Yes (ou No, não importa)
```

### 4. Criar arquivo HTML da política

Copie o conteúdo da política de privacidade:

```bash
# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path public
Copy-Item POLITICA_PRIVACIDADE.md public/privacy.md
```

Agora crie o arquivo HTML em `public/privacy.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Política de Privacidade - Keep Alert</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #b91c1c;
            border-bottom: 3px solid #b91c1c;
            padding-bottom: 10px;
        }
        h2 {
            color: #7c3aed;
            margin-top: 30px;
        }
        h3 {
            color: #374151;
        }
        .last-update {
            color: #6b7280;
            font-style: italic;
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 30px;
        }
        a {
            color: #7c3aed;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        ul {
            padding-left: 20px;
        }
        .contact-info {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin-top: 40px;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Política de Privacidade - Keep Alert</h1>
        <p class="last-update"><strong>Última atualização:</strong> [COLOQUE A DATA AQUI]</p>

        <div class="section">
            <h2>1. Introdução</h2>
            <p>Esta Política de Privacidade descreve como o Keep Alert ("nós", "nosso" ou "aplicativo") coleta, usa e protege as informações dos usuários.</p>
        </div>

        <div class="section">
            <h2>2. Informações que Coletamos</h2>

            <h3>2.1 Informações de Autenticação</h3>
            <ul>
                <li><strong>Nome</strong> e <strong>e-mail</strong> obtidos através do Google Sign-In</li>
                <li><strong>ID de usuário</strong> único gerado pelo Firebase</li>
            </ul>

            <h3>2.2 Dados de Localização</h3>
            <ul>
                <li><strong>Localização aproximada</strong> para exibir incidentes próximos a você</li>
                <li><strong>Importante:</strong> Sua localização exata é randomizada antes de ser armazenada para proteger sua privacidade</li>
                <li>Utilizamos deslocamento aleatório de 50-100 metros em direção aleatória</li>
            </ul>

            <h3>2.3 Conteúdo Gerado pelo Usuário</h3>
            <ul>
                <li>Descrições de incidentes reportados</li>
                <li>Categoria do incidente</li>
                <li>Localização aproximada do incidente</li>
                <li>Data e hora do reporte</li>
            </ul>
        </div>

        <div class="section">
            <h2>3. Como Usamos Suas Informações</h2>
            <p>Utilizamos as informações coletadas para:</p>
            <ul>
                <li>Fornecer funcionalidade do aplicativo (mapa de incidentes em tempo real)</li>
                <li>Autenticar usuários de forma segura</li>
                <li>Exibir incidentes reportados na sua região</li>
                <li>Melhorar a experiência do usuário</li>
                <li>Prevenir uso indevido e fraudes</li>
            </ul>
        </div>

        <div class="section">
            <h2>4. Compartilhamento de Dados</h2>

            <h3>4.1 Dados Públicos</h3>
            <p>Os seguintes dados são <strong>visíveis para outros usuários</strong>:</p>
            <ul>
                <li>Localização aproximada dos incidentes reportados</li>
                <li>Descrição do incidente</li>
                <li>Categoria do incidente</li>
                <li>Nome do usuário (obtido do Google)</li>
            </ul>

            <h3>4.2 Dados NÃO Compartilhados</h3>
            <ul>
                <li>Sua localização exata nunca é compartilhada</li>
                <li>Seu e-mail não é visível para outros usuários</li>
                <li>Não vendemos seus dados para terceiros</li>
                <li>Não compartilhamos dados com anunciantes</li>
            </ul>

            <h3>4.3 Serviços Terceiros</h3>
            <p>Utilizamos os seguintes serviços para operar o aplicativo:</p>
            <ul>
                <li><strong>Firebase</strong> (Google): Autenticação, banco de dados e hosting</li>
                <li><strong>Google Sign-In</strong>: Autenticação de usuários</li>
            </ul>
        </div>

        <div class="section">
            <h2>5. Armazenamento e Segurança</h2>
            <ul>
                <li>Dados são armazenados no Firebase Firestore (servidores Google Cloud)</li>
                <li>Utilizamos criptografia em trânsito (HTTPS/TLS)</li>
                <li>Autenticação via OAuth 2.0 (Google)</li>
                <li>Acesso ao banco de dados protegido por regras de segurança</li>
            </ul>
        </div>

        <div class="section">
            <h2>6. Seus Direitos</h2>
            <p>Você tem o direito de:</p>
            <ul>
                <li><strong>Acessar</strong> seus dados pessoais</li>
                <li><strong>Corrigir</strong> informações incorretas</li>
                <li><strong>Excluir</strong> sua conta e dados associados</li>
                <li><strong>Revogar</strong> permissões de localização</li>
                <li><strong>Exportar</strong> seus dados</li>
            </ul>
        </div>

        <div class="section">
            <h2>7. Permissões do Aplicativo</h2>

            <h3>Localização (Obrigatória)</h3>
            <ul>
                <li><strong>Por que precisamos:</strong> Para mostrar incidentes próximos a você</li>
                <li><strong>Quando usamos:</strong> Ao abrir o mapa e ao reportar incidentes</li>
                <li><strong>Como protegemos:</strong> Localizações são randomizadas antes de armazenar</li>
            </ul>

            <h3>Notificações (Opcional)</h3>
            <ul>
                <li><strong>Por que precisamos:</strong> Para alertá-lo sobre incidentes próximos</li>
                <li><strong>Você controla:</strong> Pode desativar nas configurações do app</li>
            </ul>
        </div>

        <div class="section">
            <h2>8. Menores de Idade</h2>
            <p>O Keep Alert não é destinado a menores de 18 anos. Se tomarmos conhecimento de que coletamos dados de menores sem consentimento parental, tomaremos medidas para excluir essas informações.</p>
        </div>

        <div class="section">
            <h2>9. Lei Geral de Proteção de Dados (LGPD)</h2>
            <p>Este aplicativo está em conformidade com a LGPD (Lei nº 13.709/2018):</p>
            <ul>
                <li><strong>Base legal:</strong> Consentimento do usuário e execução de contrato</li>
                <li><strong>Titular dos dados:</strong> Você tem controle sobre seus dados</li>
                <li><strong>Encarregado de dados:</strong> [SEU_NOME] - [SEU_EMAIL]</li>
            </ul>
        </div>

        <div class="contact-info">
            <h2>10. Contato</h2>
            <p>Para questões sobre privacidade, entre em contato:</p>
            <p><strong>E-mail:</strong> <a href="mailto:[SEU_EMAIL]">[SEU_EMAIL]</a></p>
        </div>

        <p style="margin-top: 40px; text-align: center; color: #6b7280;">
            <small>Última revisão: [DATA] | Versão: 1.0.0</small>
        </p>
    </div>
</body>
</html>
```

**⚠️ IMPORTANTE**: Substitua:
- `[COLOQUE A DATA AQUI]` pela data atual
- `[SEU_EMAIL]` pelo seu e-mail
- `[SEU_NOME]` pelo seu nome
- `[DATA]` pela data de hoje

### 5. Fazer Deploy

```bash
firebase deploy --only hosting
```

Aguarde alguns segundos... Done! ✅

### 6. Copiar a URL

Após o deploy, você verá algo assim:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/keep-alert-xxxx/overview
Hosting URL: https://keep-alert-xxxx.web.app
```

Sua URL da política de privacidade será:

```
https://keep-alert-xxxx.web.app/privacy.html
```

**Copie essa URL e use no Google Play Console!**

---

## 🎯 Pronto!

Agora você tem:
- ✅ Política de privacidade hospedada
- ✅ URL pública com HTTPS
- ✅ Página profissional e responsiva

---

## 🔄 Para Atualizar a Política

1. Edite `public/privacy.html`
2. Execute `firebase deploy --only hosting`
3. Pronto! A URL permanece a mesma.

---

## 📱 Testar

Abra a URL no navegador do celular para ver como ficou:

```
https://[seu-projeto].web.app/privacy.html
```

---

## ⚠️ Problemas Comuns

### Erro: "No Firebase project found"
```bash
firebase use --add
# Selecione seu projeto
```

### Erro: "Permission denied"
```bash
firebase login --reauth
```

### Erro: "Command not found: firebase"
```bash
npm install -g firebase-tools
```

---

## 🎨 Personalizar

### Mudar cores
Edite o `<style>` no arquivo HTML:
```css
h1 {
    color: #b91c1c;  /* Vermelho do Keep Alert */
}
h2 {
    color: #7c3aed;  /* Roxo */
}
```

### Adicionar logo
Adicione antes do `<h1>`:
```html
<img src="logo.png" alt="Keep Alert" style="width: 100px; margin-bottom: 20px;">
```

---

## 📚 Recursos

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

**Pronto! Sua política de privacidade está no ar! 🚀**
