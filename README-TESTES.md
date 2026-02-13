# 🧪 Testes Firebase App Distribution - Keep Alert

## 📁 Arquivo de Teste

**`firebase-test-cases.yaml`** - 21 casos de teste no formato correto do Firebase

---

## 🚀 Como Fazer Upload do YAML

### **1. Via Firebase Console (Recomendado)**

1. Acesse: https://console.firebase.google.com/project/keep-alert/appdistribution
2. Faça upload do APK ou AAB
3. Na seção **"Automated tests"**, clique em **"Upload test cases"**
4. Faça upload do arquivo **`firebase-test-cases.yaml`**
5. Inicie os testes

---

### **2. Via Firebase CLI**

```bash
# Fazer upload do APK
firebase appdistribution:distribute \
  android/app/build/outputs/apk/debug/app-debug.apk \
  --app FIREBASE_APP_ID \
  --groups testers \
  --test-cases firebase-test-cases.yaml

# Verificar status
firebase appdistribution:testers:list \
  --app FIREBASE_APP_ID
```

---

## 📋 Casos de Teste Incluídos (21 cenários)

### **🔐 Autenticação**
1. ✅ Setup inicial
2. ✅ Login com email e senha
3. ✅ Aceitar termos de uso
4. ✅ Logout

### **📍 Localização e Mapa**
5. ✅ Permitir localização
6. ✅ Visualizar mapa
7. ✅ Ajustar perímetro
8. ✅ Filtrar incidentes

### **➕ Criar e Gerenciar**
9. ✅ Criar incidente
10. ✅ Atualizar situação
11. ✅ Marcar como resolvido

### **💬 Interação**
12. ✅ Visualizar detalhes
13. ✅ Seguir incidente
14. ✅ Adicionar comentário
15. ✅ Adicionar imagem

### **📱 Navegação**
16. ✅ Feed de incidentes
17. ✅ Perfil do usuário
18. ✅ Editar perfil
19. ✅ Configurações

### **🚨 Recursos Especiais**
20. ✅ Alerta de emergência (190/193)
21. ✅ Smoke test completo

---

## 📊 Estrutura do YAML

Cada caso de teste segue o formato:

```yaml
- displayName: Nome do teste
  id: identificador_unico
  prerequisiteTestCaseId: teste_anterior  # opcional
  steps:
    - goal: Objetivo do passo
      hint: Dica para o agente AI
      successCriteria: Critério de sucesso visual
```

### **Regras Importantes:**
- ✅ **displayName**: Nome legível para humanos
- ✅ **id**: ID único (snake_case)
- ✅ **steps**: Pelo menos 1 passo obrigatório
- ✅ **goal**: Objetivo claro do passo
- ✅ **successCriteria**: O que deve estar VISÍVEL na tela
- ⚠️ **hint**: Opcional, mas recomendado

---

## 🎯 Fluxo dos Testes

```
setup (1)
  └─> login_email (2)
       └─> accept_terms (3)
            ├─> allow_location (4)
            │    ├─> view_map (5)
            │    │    ├─> view_incident_details (6)
            │    │    │    ├─> follow_incident (11)
            │    │    │    ├─> add_comment (12)
            │    │    │    ├─> add_image (13)
            │    │    │    └─> emergency_alert (17)
            │    │    └─> filter_incidents (8)
            │    ├─> adjust_perimeter (7)
            │    └─> create_incident (9)
            │         ├─> update_situation (18)
            │         └─> mark_resolved (19)
            ├─> view_feed (10)
            └─> view_profile (14)
                 ├─> edit_profile (15)
                 ├─> view_settings (16)
                 └─> logout (20)
```

---

## 🤖 Como o Teste Funciona

O Firebase App Distribution usa **Gemini AI** para:

1. 📱 **Executar o APK** em dispositivos reais
2. 👁️ **Ler a tela** usando visão computacional
3. 🎯 **Seguir os hints** para completar os objetivos
4. ✅ **Validar** se o successCriteria está visível
5. 📹 **Gravar vídeo** de toda a execução
6. 📊 **Gerar relatório** com screenshots

---

## 📝 Exemplo de Caso de Teste

```yaml
- displayName: Login com email e senha
  id: login_email
  prerequisiteTestCaseId: setup
  steps:
    - goal: Fazer login com credenciais
      hint: Inserir email teste@keepalert.com e senha Teste@123456, depois tocar em Entrar
      successCriteria: O modal de termos de uso está visível na tela
```

**O que acontece:**
1. O teste `setup` executa primeiro
2. O agente AI localiza os campos de email e senha
3. Preenche com as credenciais fornecidas
4. Clica no botão "Entrar"
5. Verifica se o modal de termos aparece
6. ✅ Passa se o modal está visível
7. ❌ Falha se o modal não aparecer

---

## ⚙️ Configurações Recomendadas

### **Dispositivos de Teste:**
- Pixel 5 (Android 11)
- Pixel 6 (Android 12)
- Pixel 7 Pro (Android 13)
- Samsung Galaxy S21 (Android 11)

### **Localização:**
- Idioma: Português (Brasil)
- Região: pt_BR
- Orientação: Portrait

### **Opções:**
- ✅ Gravar vídeo
- ✅ Capturar screenshots
- ✅ Conceder permissões automaticamente
- ✅ Limpar dados entre testes

---

## 🐛 Troubleshooting

### **Erro: "Invalid YAML format"**
```bash
# Validar sintaxe YAML
yamllint firebase-test-cases.yaml

# Ou online
# https://www.yamllint.com/
```

### **Erro: "Test failed - Success criteria not met"**
- Verifique se o texto do `successCriteria` corresponde exatamente ao que está na tela
- Certifique-se que os elementos estão visíveis (não ocultos ou fora da tela)
- Aguarde carregamentos (adicione mais contexto no hint)

### **Erro: "Prerequisite test failed"**
- Execute os testes em ordem
- Verifique se o teste pré-requisito passou
- Considere criar um novo fluxo independente

---

## 📈 Métricas de Sucesso

### **Objetivos:**
- ✅ Taxa de aprovação > 90%
- ✅ Cobertura de telas > 80%
- ✅ 0 crashes
- ✅ Tempo de execução < 30 minutos

### **O que será testado:**
- Fluxo de login e autenticação
- Navegação entre telas
- Criação e interação com incidentes
- Funcionalidades de mapa
- Sistema de seguir e comentar
- Alertas de emergência
- Perfil e configurações

---

## 🔗 Referências

- [Firebase App Distribution Docs](https://firebase.google.com/docs/app-distribution)
- [Test Cases YAML Format](https://firebase.google.com/docs/app-distribution/android/app-testing-agent#test-cases-yaml)
- [Gemini Testing Agent](https://firebase.google.com/docs/app-distribution/android/app-testing-agent)

---

## ✅ Próximos Passos

1. ✅ Fazer upload do APK no Firebase Console
2. ✅ Fazer upload do `firebase-test-cases.yaml`
3. ✅ Selecionar dispositivos de teste
4. ✅ Iniciar os testes
5. ✅ Aguardar resultados (15-30 minutos)
6. ✅ Analisar relatório e vídeos
7. ✅ Corrigir falhas encontradas
8. ✅ Re-testar

---

**Dica:** Comece com o **smoke test completo** (caso 21) para validar o fluxo principal antes de executar todos os testes! 🎯
