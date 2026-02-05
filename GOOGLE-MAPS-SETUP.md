# Configuração do Google Maps

## Por Que Você Precisa de uma API Key

Para usar `react-native-maps` com Google Maps no Android e iOS, você precisa de uma chave de API do Google Cloud Platform. Sem essa chave, o mapa não vai carregar corretamente.

## Passo 1: Criar Projeto no Google Cloud Platform

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. No canto superior esquerdo, clique no seletor de projetos
3. Clique em **"Novo Projeto"** (New Project)
4. Nomeie o projeto como `keep-alert` ou nome de sua preferência
5. Clique em **"Criar"** (Create)

## Passo 2: Ativar APIs Necessárias

Você precisa ativar as seguintes APIs:

### Para Android:
1. No menu lateral, vá em **APIs e Serviços** → **Biblioteca**
2. Procure por **"Maps SDK for Android"**
3. Clique nela e depois em **"Ativar"** (Enable)

### Para iOS:
1. Na mesma tela de biblioteca
2. Procure por **"Maps SDK for iOS"**
3. Clique nela e depois em **"Ativar"** (Enable)

### Para Web (opcional):
1. Procure por **"Maps JavaScript API"**
2. Clique nela e depois em **"Ativar"** (Enable)

## Passo 3: Criar Credenciais (API Key)

1. No menu lateral, vá em **APIs e Serviços** → **Credenciais**
2. Clique em **"Criar credenciais"** → **"Chave de API"**
3. Uma chave será criada. Copie essa chave!
4. **IMPORTANTE:** Clique em **"Restringir chave"** para configurar

## Passo 4: Configurar Restrições da API Key

### Para Android:
1. Em **"Restrições de aplicativo"**, selecione **"Aplicativos Android"**
2. Clique em **"Adicionar nome de pacote e impressão digital"**
3. Nome do pacote: `com.keepalert.android` (do seu app.json)
4. Impressão digital SHA-1:
   - Para desenvolvimento, você pode deixar em branco ou adicionar a SHA-1 de debug
   - Para obter a SHA-1 de debug, execute:
     ```bash
     # Windows
     keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android

     # Mac/Linux
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
     ```
   - Copie a linha que começa com `SHA1:` e cole no campo

### Para iOS:
1. Crie uma chave separada para iOS (repita o Passo 3)
2. Em **"Restrições de aplicativo"**, selecione **"Aplicativos iOS"**
3. Adicione o Bundle ID: `com.keepalert.ios`

### Restrições de API:
1. Role para baixo até **"Restrições de API"**
2. Selecione **"Restringir chave"**
3. Marque as APIs ativadas:
   - Maps SDK for Android (para chave Android)
   - Maps SDK for iOS (para chave iOS)

4. Clique em **"Salvar"**

## Passo 5: Adicionar Chaves ao Projeto

### Opção 1: Mesma Chave para Android e iOS (Desenvolvimento)

Se você não configurou restrições rigorosas, pode usar a mesma chave:

1. Abra o arquivo `.env` na raiz do projeto
2. Substitua `YOUR_API_KEY_HERE` pela sua chave:
   ```env
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...sua-chave-aqui
   ```

3. Abra `app.json` e substitua `YOUR_GOOGLE_MAPS_API_KEY` pela chave:
   ```json
   "android": {
     "config": {
       "googleMaps": {
         "apiKey": "AIzaSy...sua-chave-aqui"
       }
     }
   },
   "ios": {
     "config": {
       "googleMapsApiKey": "AIzaSy...sua-chave-aqui"
     }
   }
   ```

### Opção 2: Chaves Separadas (Produção - Recomendado)

Se você criou chaves separadas (mais seguro):

1. No `.env`:
   ```env
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID=AIzaSy...chave-android
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS=AIzaSy...chave-ios
   ```

2. No `app.json`:
   ```json
   "android": {
     "config": {
       "googleMaps": {
         "apiKey": "AIzaSy...chave-android"
       }
     }
   },
   "ios": {
     "config": {
       "googleMapsApiKey": "AIzaSy...chave-ios"
     }
   }
   ```

## Passo 6: Rebuild do Projeto

Depois de adicionar as chaves, você precisa fazer rebuild:

```bash
# Parar o servidor atual
# Ctrl+C

# Limpar cache e rebuild
npx expo start --clear

# Para rodar nativamente (recomendado para testar mapas):
npx expo run:android
# ou
npx expo run:ios
```

**IMPORTANTE:** Mudanças em `app.json` requerem rebuild nativo. Não funcionam em Expo Go!

## Passo 7: Testar

1. Rode o app em um dispositivo ou emulador
2. Navegue até a tela com o mapa
3. O mapa deve carregar mostrando São Francisco (coordenadas padrão)
4. Se aparecer um mapa cinza com marca d'água "For development purposes only", significa que a chave está funcionando mas precisa de billing ativo

## Problemas Comuns

### Mapa aparece em branco ou cinza

**Causa:** API Key não configurada ou inválida

**Solução:**
1. Verifique se a chave está correta no `app.json`
2. Verifique se as APIs estão ativadas no Google Cloud Console
3. Aguarde até 5 minutos para propagação das mudanças

### "For development purposes only"

**Causa:** Projeto do Google Cloud não tem billing ativo

**Solução:**
1. Acesse Google Cloud Console → Billing
2. Vincule uma forma de pagamento
3. O Google oferece $200 de créditos gratuitos
4. Maps API tem cota gratuita mensal generosa

### Erro de autenticação no Android

**Causa:** SHA-1 fingerprint não configurada ou incorreta

**Solução:**
1. Obtenha a SHA-1 do seu keystore de debug
2. Adicione no Google Cloud Console → Credenciais → sua chave
3. Aguarde 5 minutos e teste novamente

### Erro no iOS

**Causa:** Bundle ID incorreto nas restrições

**Solução:**
1. Verifique se o Bundle ID na chave do Google é `com.keepalert.ios`
2. Verifique se no `app.json` está o mesmo Bundle ID

## Links Úteis

- [Google Cloud Console](https://console.cloud.google.com/)
- [Documentação Maps SDK for Android](https://developers.google.com/maps/documentation/android-sdk)
- [Documentação Maps SDK for iOS](https://developers.google.com/maps/documentation/ios-sdk)
- [Documentação react-native-maps](https://github.com/react-native-maps/react-native-maps)
- [Expo Maps Documentation](https://docs.expo.dev/versions/latest/sdk/map-view/)

## Custo

- **Grátis:** Até $200 de créditos no primeiro ano
- **Depois:** $7 por 1000 carregamentos de mapa (acima da cota gratuita)
- **Cota gratuita mensal:** Muito generosa para desenvolvimento

Na prática, para desenvolvimento e apps pequenos, você provavelmente não vai pagar nada.

## Segurança

⚠️ **NUNCA** commit suas API keys no Git!

Certifique-se de que `.env` está no `.gitignore`:

```bash
# Verificar se .env está ignorado
cat .gitignore | grep ".env"
```

Se não estiver, adicione:
```bash
echo ".env" >> .gitignore
```

## Próximos Passos

Depois de configurar o Google Maps:

1. Teste o mapa básico
2. Adicione marcadores (markers)
3. Implemente geolocalização do usuário
4. Adicione funcionalidades de alerta no mapa

Boa sorte! 🗺️
