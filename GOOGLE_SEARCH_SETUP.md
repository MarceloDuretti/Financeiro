# Guia de Configuração - Google Custom Search API

Este guia explica como configurar corretamente a Google Custom Search API para o sistema de descoberta automática de CNPJs do FinControl.

## Pré-requisitos

- Conta Google
- Projeto no Google Cloud Console
- Cartão de crédito cadastrado (para ativar APIs, mas tem cota gratuita)

---

## Passo 1: Criar Programmable Search Engine

1. Acesse: https://programmablesearchengine.google.com/

2. Clique em **"Add"** ou **"Criar mecanismo de pesquisa"**

3. Configure:
   - **Sites to search**: Digite `*.br` (para buscar em todos os sites brasileiros)
   - **Language**: Portuguese
   - **Name**: `FinControl CNPJ Finder` (ou qualquer nome)

4. Clique em **"Create"**

5. **IMPORTANTE**: Copie o **Search Engine ID (cx parameter)**
   - Exemplo: `a1b2c3d4e5f6g7h8i`
   - Guarde este ID, você vai precisar dele!

6. Nas configurações do Search Engine:
   - Ative: **"Search the entire web"** (importante para encontrar qualquer site)
   - Você também pode adicionar sites específicos se quiser priorizar:
     - `*.gov.br`
     - `receita.economia.gov.br`
     - `cnpj.biz`
     - `receitaws.com.br`

---

## Passo 2: Criar API Key no Google Cloud Console

1. Acesse: https://console.cloud.google.com/

2. Selecione ou crie um projeto

3. No menu lateral, vá em: **APIs & Services > Credentials**

4. Clique em **"+ CREATE CREDENTIALS" > API key**

5. Uma API key será criada. **Copie e guarde com segurança!**
   - Exemplo: `AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q`

---

## Passo 3: Habilitar a Custom Search API

**ESTE É O PASSO MAIS IMPORTANTE!**

1. No Google Cloud Console, vá em: **APIs & Services > Library**

2. Busque por: **"Custom Search API"**

3. Clique na API que aparecer

4. Clique em **"ENABLE"** (Habilitar)

5. Aguarde a confirmação de que a API foi habilitada

---

## Passo 4: Configurar Restrições da API Key (Opcional, mas recomendado)

### Para DESENVOLVIMENTO (sem restrições):

1. Vá em: **APIs & Services > Credentials**

2. Clique na sua API key

3. Em **"Application restrictions"**: 
   - Selecione **"None"**

4. Em **"API restrictions"**:
   - Selecione **"Restrict key"**
   - Marque apenas **"Custom Search API"**

5. Clique em **"Save"**

### Para PRODUÇÃO (com restrições):

1. Em **"Application restrictions"**:
   - Selecione **"HTTP referrers (web sites)"**
   - Adicione: `*.replit.dev/*` e `*.replit.app/*`

2. Em **"API restrictions"**:
   - Selecione **"Restrict key"**
   - Marque apenas **"Custom Search API"**

3. Clique em **"Save"**

---

## Passo 5: Configurar Secrets no Replit

1. No Replit, abra a aba **"Secrets"** (ícone de cadeado)

2. Adicione os dois secrets:

   **Secret 1:**
   - Key: `GOOGLE_CUSTOM_SEARCH_API_KEY`
   - Value: Cole sua API key do Google (ex: `AIzaSyA1B2C3D4...`)

   **Secret 2:**
   - Key: `GOOGLE_SEARCH_ENGINE_ID`
   - Value: Cole seu Search Engine ID (ex: `a1b2c3d4e5f6g7h8i`)

3. Clique em **"Add secret"** para cada um

4. **Reinicie a aplicação** para carregar as novas credenciais

---

## Passo 6: Testar

1. No FinControl, vá em **Clientes/Fornecedores**

2. Clique em **"+ Novo"**

3. Use o **assistente de voz** ou digite um nome de empresa:
   - Exemplo: `"Petrobras"`
   - Exemplo: `"CEMIG"`
   - Exemplo: `"Vale do Rio Doce"`

4. O sistema deve:
   - Buscar automaticamente o CNPJ
   - Enriquecer com dados da Receita Federal
   - Pré-preencher o formulário

---

## Verificar Logs

Para confirmar que está funcionando, verifique os logs do servidor:

```
[Google Search] Searching for: "PETROBRAS"
[Google Search] Query: "CNPJ" "PETROBRAS" site:.br
[Google Search] API Key configured: AIzaSyA1...
[Google Search] Search Engine ID: a1b2c3d4e5f6g7h8i
[Google Search] Found CNPJ: 33.000.167/0001-01
[Google Search] Source: https://...
```

---

## Problemas Comuns

### Erro 401: "API keys are not supported by this API"

**Causa**: A Custom Search API não foi habilitada no projeto

**Solução**: 
1. Vá em https://console.cloud.google.com/apis/library
2. Busque "Custom Search API"
3. Clique em "ENABLE"

---

### Erro 403: "This API has not been used in project..."

**Causa**: Mesma do erro 401

**Solução**: Habilite a API (veja acima)

---

### Erro 400: "Invalid Value" ou "Required parameter: cx"

**Causa**: Search Engine ID (cx) está incorreto ou vazio

**Solução**:
1. Verifique o secret `GOOGLE_SEARCH_ENGINE_ID`
2. Confirme o ID em https://programmablesearchengine.google.com/

---

### Sem resultados, mas sem erro

**Causa**: Search Engine não está configurado para buscar na web inteira

**Solução**:
1. Acesse https://programmablesearchengine.google.com/
2. Edite seu Search Engine
3. Ative: "Search the entire web"

---

## Custos

### Cota Gratuita:
- **100 queries por dia** - GRÁTIS

### Acima da cota:
- **$5 por 1.000 queries** (acima de 100/dia)

### Sistema Híbrido do FinControl:
- **Layer 1**: Cache estático local (sempre grátis)
- **Layer 2**: Cache PostgreSQL (sempre grátis)  
- **Layer 3**: Google API (apenas quando necessário)

**Economia esperada**: 80-90% das buscas serão atendidas pelo cache (Layers 1 e 2), gastando API credits apenas para empresas novas.

---

## Documentação Oficial

- Custom Search JSON API: https://developers.google.com/custom-search/v1/overview
- Programmable Search Engine: https://programmablesearchengine.google.com/about
- Google Cloud Console: https://console.cloud.google.com/

---

## Checklist Final

- [ ] Programmable Search Engine criado
- [ ] Search Engine ID copiado
- [ ] API Key criada no Google Cloud Console
- [ ] Custom Search API habilitada no projeto
- [ ] Restrições da API Key configuradas (ou desabilitadas para teste)
- [ ] Secrets configurados no Replit
- [ ] Aplicação reiniciada
- [ ] Teste realizado com sucesso

---

**Pronto!** Seu sistema de descoberta automática de CNPJs está configurado e funcionando!
