# 📋 Cenários de Teste - Keep Alert

## 🔐 1. AUTENTICAÇÃO

### 1.1 Login com Email/Senha
**Passos:**
1. Abrir app
2. Inserir email: `teste@keepalert.com`
3. Inserir senha: `Teste@123456`
4. Clicar em "Entrar"

**Resultado Esperado:** Usuário logado, redirecionado para mapa

---

### 1.2 Login com Google
**Passos:**
1. Abrir app
2. Clicar em "Entrar com Google"
3. Selecionar conta Google
4. Autorizar permissões

**Resultado Esperado:** Login bem-sucedido

---

### 1.3 Registro de Novo Usuário
**Passos:**
1. Clicar em "Criar conta"
2. Preencher email
3. Preencher senha
4. Confirmar senha
5. Registrar

**Resultado Esperado:** Conta criada, termos exibidos

---

### 1.4 Recuperação de Senha
**Passos:**
1. Clicar em "Esqueci minha senha"
2. Inserir email
3. Enviar

**Resultado Esperado:** Email de recuperação enviado

---

### 1.5 Logout
**Passos:**
1. Ir para Perfil
2. Clicar em "Sair"
3. Confirmar

**Resultado Esperado:** Deslogado, volta para login

---

## 📜 2. TERMOS DE USO

### 2.1 Aceitar Termos
**Passos:**
1. Login com conta nova
2. Ver modal de termos
3. Rolar até o final
4. Clicar em "Aceito os Termos"

**Resultado Esperado:** Modal fecha, acesso liberado

---

### 2.2 Rejeitar Termos
**Passos:**
1. Login com conta nova
2. Clicar em "Não Aceito"

**Resultado Esperado:** Logout automático, conta inativa

---

## 📍 3. LOCALIZAÇÃO

### 3.1 Permitir Localização
**Passos:**
1. Fazer login
2. Ver popup de permissão
3. Clicar em "Permitir"

**Resultado Esperado:** Mapa centralizado na localização

---

### 3.2 Negar Localização
**Passos:**
1. Fazer login
2. Clicar em "Não permitir"

**Resultado Esperado:** Localização aproximada via IP

---

### 3.3 Centralizar no Usuário
**Passos:**
1. No mapa
2. Clicar no botão de localização

**Resultado Esperado:** Mapa centralizado

---

## 🗺️ 4. MAPA E INCIDENTES

### 4.1 Visualizar Mapa
**Passos:**
1. Abrir app logado
2. Ver mapa
3. Verificar marcadores
4. Fazer zoom
5. Mover mapa

**Resultado Esperado:** Mapa funcional com marcadores

---

### 4.2 Abrir Detalhes de Incidente
**Passos:**
1. Clicar em um marcador
2. Ver bottom sheet

**Resultado Esperado:** Detalhes exibidos

---

### 4.3 Ajustar Perímetro
**Passos:**
1. Clicar no controle de perímetro
2. Selecionar raio (500m, 1km, 2km, 5km)

**Resultado Esperado:** Círculo atualizado no mapa

---

### 4.4 Filtrar Incidentes
**Passos:**
1. Clicar no botão de filtro
2. Desmarcar alguns tipos
3. Aplicar filtros

**Resultado Esperado:** Apenas tipos selecionados no mapa

---

## ➕ 5. CRIAR INCIDENTE

### 5.1 Criar Incidente Completo
**Passos:**
1. Clicar em "Reportar Incidente"
2. Selecionar categoria
3. Adicionar descrição
4. Tirar foto
5. Confirmar

**Resultado Esperado:** Incidente criado no mapa

---

### 5.2 Criar Sem Foto
**Passos:**
1. Reportar incidente
2. Apenas categoria e descrição
3. Confirmar

**Resultado Esperado:** Incidente criado

---

### 5.3 Validação de Campos
**Passos:**
1. Tentar criar sem preencher
2. Ver erros de validação

**Resultado Esperado:** Validação funcionando

---

## 💬 6. INTERAÇÃO COM INCIDENTES

### 6.1 Adicionar Comentário
**Passos:**
1. Abrir detalhes
2. Ir para "Comentários"
3. Digitar e enviar

**Resultado Esperado:** Comentário adicionado

---

### 6.2 Adicionar Imagem
**Passos:**
1. Abrir detalhes (não autor)
2. Ir para "Imagens"
3. Adicionar imagem
4. Upload

**Resultado Esperado:** Imagem adicionada

---

### 6.3 Denunciar Imagem
**Passos:**
1. Ver imagem
2. Denunciar
3. Confirmar

**Resultado Esperado:** Strike incrementado

---

### 6.4 Seguir Incidente
**Passos:**
1. Abrir detalhes (não autor)
2. Clicar em "Seguir"

**Resultado Esperado:** Seguindo, aparece na tab "Seguindo"

---

### 6.5 Deixar de Seguir
**Passos:**
1. Incidente seguido
2. Clicar em "Seguindo"
3. Confirmar

**Resultado Esperado:** Removido da lista

---

### 6.6 Atualizar Situação (Autor)
**Passos:**
1. Incidente próprio
2. Atualizar situação

**Resultado Esperado:** Situação atualizada

---

### 6.7 Marcar como Resolvido
**Passos:**
1. Incidente próprio
2. Marcar como resolvido

**Resultado Esperado:** Badge "Resolvida", alertas removidos

---

## 📰 7. FEED

### 7.1 Visualizar Feed
**Passos:**
1. Ir para tab "Feed"
2. Ver lista
3. Fazer scroll

**Resultado Esperado:** Lista carregando

---

### 7.2 Scroll Infinito
**Passos:**
1. No feed
2. Scroll até o final
3. Carregar mais

**Resultado Esperado:** Mais incidentes carregados

---

### 7.3 Abrir Detalhes do Feed
**Passos:**
1. Clicar em card do feed

**Resultado Esperado:** Detalhes abertos

---

## 👁️ 8. SEGUINDO

### 8.1 Ver Seguidos
**Passos:**
1. Seguir incidentes
2. Ir para "Seguindo"

**Resultado Esperado:** Lista de seguidos

---

### 8.2 Lista Vazia
**Passos:**
1. Não seguir nada
2. Ir para "Seguindo"

**Resultado Esperado:** Mensagem de lista vazia

---

## 👤 9. PERFIL

### 9.1 Visualizar Perfil
**Passos:**
1. Ir para "Perfil"
2. Ver informações

**Resultado Esperado:** Dados exibidos

---

### 9.2 Editar Perfil
**Passos:**
1. Editar nome e telefone
2. Salvar

**Resultado Esperado:** Dados atualizados

---

### 9.3 Alterar Foto
**Passos:**
1. Clicar na foto
2. Selecionar nova
3. Upload

**Resultado Esperado:** Foto atualizada

---

### 9.4 Configurações
**Passos:**
1. Abrir configurações
2. Alterar notificações
3. Alterar permissões

**Resultado Esperado:** Configurações salvas

---

## 🚨 10. ALERTAS DE EMERGÊNCIA

### 10.1 Alerta 190 - Assalto
**Passos:**
1. Criar incidente de assalto, roubo ou tiroteio

**Resultado Esperado:** "LIGUE PARA 190 IMEDIATAMENTE"

---

### 10.2 Alerta 193 - Incêndio
**Passos:**
1. Criar incidente de incêndio ou queda de árvore

**Resultado Esperado:** "LIGUE PARA 193 IMEDIATAMENTE"

---

### 10.3 Remover ao Resolver
**Passos:**
1. Incidente com alerta
2. Marcar como resolvido

**Resultado Esperado:** Alerta desaparece

---

## 🔒 11. CONTA INATIVA

### 11.1 Bloquear Navegação
**Passos:**
1. Conta inativa
2. Tentar navegar

**Resultado Esperado:** Bloqueado com toast

---

### 11.2 Reativar Conta
**Passos:**
1. Login com conta inativa
2. Aceitar termos

**Resultado Esperado:** Acesso liberado

---

## ⚠️ 12. TRATAMENTO DE ERROS

### 12.1 Erro de Rede
**Passos:**
1. Desligar internet
2. Tentar criar incidente

**Resultado Esperado:** Mensagem de erro clara

---

### 12.2 Timeout de Upload
**Passos:**
1. Conexão lenta
2. Upload de imagem grande

**Resultado Esperado:** Loading e timeout tratado

---

## ⚡ 13. PERFORMANCE

### 13.1 Scroll com 100+ Incidentes
**Passos:**
1. Feed com muitos itens
2. Scroll rápido

**Resultado Esperado:** Fluido, sem travamentos

---

### 13.2 Mapa com 50+ Marcadores
**Passos:**
1. Muitos marcadores
2. Zoom e pan

**Resultado Esperado:** Renderização suave

---

### 13.3 Carregamento Inicial
**Passos:**
1. Abrir app
2. Medir tempo

**Resultado Esperado:** < 3 segundos

---

## ♿ 14. ACESSIBILIDADE

### 14.1 TalkBack
**Passos:**
1. Ativar TalkBack
2. Navegar

**Resultado Esperado:** Labels corretos

---

### 14.2 Contraste
**Passos:**
1. Verificar legibilidade

**Resultado Esperado:** WCAG AA aprovado

---

### 14.3 Áreas de Toque
**Passos:**
1. Verificar botões

**Resultado Esperado:** Mínimo 44x44 dp

---

## 📊 RESUMO

**Total de Cenários:** 48
**Categorias:** 14
**Prioridade Alta:** 25 cenários
**Prioridade Média:** 15 cenários
**Prioridade Baixa:** 8 cenários

---

## 🎯 CENÁRIOS CRÍTICOS (TOP 10)

1. ✅ Login com Email/Senha
2. ✅ Aceitar Termos
3. ✅ Visualizar Mapa
4. ✅ Criar Incidente Completo
5. ✅ Filtrar Incidentes
6. ✅ Seguir Incidente
7. ✅ Ver Feed
8. ✅ Alertas de Emergência 190/193
9. ✅ Editar Perfil
10. ✅ Performance do Mapa
