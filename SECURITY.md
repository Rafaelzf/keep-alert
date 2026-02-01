# Segurança - Keep Alert

## ⚠️ Variáveis de Ambiente

### Configuração

1. **Nunca commite o arquivo `.env`** - Ele já está no `.gitignore`
2. Copie `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
3. Preencha os valores reais do Firebase Console

### Sobre Firebase API Keys

As chaves Firebase (`EXPO_PUBLIC_FIREBASE_*`) são **configurações do cliente**, não segredos tradicionais. A documentação do Firebase explica:

> "Unlike how API keys are typically used, API keys for Firebase services are not used to control access to backend resources; that can only be done with Firebase Security Rules."

**Segurança real do Firebase:**
- ✅ Configure **Firebase Security Rules** para proteger dados
- ✅ Configure **Firebase Authentication** corretamente
- ✅ Use **App Check** para prevenir abuso
- ❌ Não confie apenas em "esconder" a API key

### Exposição ao Cliente

Todas as variáveis com prefixo `EXPO_PUBLIC_` são **visíveis no app compilado**. Isso é aceitável para Firebase porque:

1. A API key identifica seu projeto, mas não concede acesso
2. A segurança vem de Security Rules e Authentication
3. É impossível esconder completamente essas chaves em apps cliente

### Proteção Adicional

Para produção, configure:

1. **Firebase Security Rules** (obrigatório)
2. **Firebase App Check** (recomendado)
3. **Restrições de API key** no Google Cloud Console:
   - Restrinja por domínio (web)
   - Restrinja por bundle ID (mobile)

## 🔒 Boas Práticas

- ✅ `.env` está no `.gitignore`
- ✅ Use `.env.example` para documentar variáveis necessárias
- ✅ Configure Firebase Security Rules rigorosas
- ✅ Implemente Firebase App Check
- ❌ Nunca coloque chaves privadas/secretas em `EXPO_PUBLIC_*`
- ❌ Nunca commite arquivos `.env` com valores reais
