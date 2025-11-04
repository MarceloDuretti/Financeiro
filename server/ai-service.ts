import { callOpenAI } from "./openai";

// Types for AI entity processing
export interface ProcessedEntity {
  name: string;
  documentType?: "cpf" | "cnpj" | "foreign" | "none";
  document?: string;
  phone?: string;
  email?: string;
  website?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  confidence: number;
  source: "ai" | "cnpj_api" | "hybrid";
}

/**
 * Validates CNPJ using official algorithm (check digits)
 * Returns true if CNPJ is mathematically valid
 */
function isValidCNPJ(cnpj: string): boolean {
  // Remove formatting
  const clean = cnpj.replace(/[^\d]/g, "");
  
  // Must be exactly 14 digits
  if (clean.length !== 14) {
    return false;
  }
  
  // Reject known invalid patterns (all same digit)
  if (/^(\d)\1{13}$/.test(clean)) {
    return false;
  }
  
  // Validate first check digit
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let checkDigit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (checkDigit1 !== parseInt(clean[12])) {
    return false;
  }
  
  // Validate second check digit
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(clean[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let checkDigit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (checkDigit2 !== parseInt(clean[13])) {
    return false;
  }
  
  return true;
}

interface ReceitaWSResponse {
  nome: string;
  fantasia: string;
  cnpj: string;
  telefone: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  situacao: string;
}

/**
 * Fetches company data from ReceitaWS public API
 */
async function fetchCNPJData(cnpj: string): Promise<ReceitaWSResponse | null> {
  try {
    // Clean CNPJ (remove formatting)
    const cleanCNPJ = cnpj.replace(/[^\d]/g, "");
    console.log(`[ReceitaWS] Fetching data for CNPJ: ${cleanCNPJ}`);
    
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`, {
      headers: {
        "User-Agent": "FinControl/1.0",
      },
    });

    console.log(`[ReceitaWS] Response status: ${response.status}`);

    if (!response.ok) {
      console.error(`[ReceitaWS] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`[ReceitaWS] Response data:`, JSON.stringify(data, null, 2));
    
    // Check if CNPJ is active
    if (data.status === "ERROR") {
      console.error(`[ReceitaWS] Returned error: ${data.message}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[ReceitaWS] Error fetching CNPJ data:", error);
    return null;
  }
}

/**
 * Discovers CNPJ for a company using web search + AI extraction
 * Uses real web search to find CNPJs from official Brazilian government sources
 */
async function discoverCNPJByName(companyName: string): Promise<string | null> {
  try {
    console.log(`[CNPJ Discovery] Starting web search for: "${companyName}"`);
    
    // Use web search to find CNPJ from official sources
    const searchQuery = `CNPJ da ${companyName} site:gov.br OR site:cnpj.biz OR site:portaldatransparencia.gov.br OR site:receitaws.com.br`;
    console.log(`[CNPJ Discovery] Search query: ${searchQuery}`);
    
    // Import web_search dynamically
    let searchResults: string;
    try {
      const { webSearch } = await import("./web-search");
      searchResults = await webSearch(searchQuery);
      console.log(`[CNPJ Discovery] Web search completed, ${searchResults.length} characters of results`);
    } catch (importError) {
      console.error(`[CNPJ Discovery] Could not import web-search module:`, importError);
      console.log(`[CNPJ Discovery] Falling back to AI knowledge...`);
      return null;
    }

    if (!searchResults || searchResults.length === 0) {
      console.log(`[CNPJ Discovery] No web search results found`);
      return null;
    }

    // Use AI to extract CNPJ from search results
    const extractionPrompt = `Você é um especialista em extrair CNPJs de textos. Analise os resultados de busca abaixo e extraia o CNPJ correto da empresa "${companyName}".

RESULTADOS DA BUSCA:
${searchResults.substring(0, 4000)}

INSTRUÇÕES CRÍTICAS:
1. Procure por CNPJs no formato XX.XXX.XXX/XXXX-XX ou XXXXXXXXXXXXXX (14 dígitos)
2. VERIFIQUE que o CNPJ está associado à empresa "${companyName}" no texto
3. CNPJs DEVEM ter EXATAMENTE 14 dígitos
4. Se houver múltiplos CNPJs, escolha o que está mais claramente associado à empresa
5. Se NÃO encontrar um CNPJ válido e confirmado nos resultados, retorne null

Retorne APENAS um JSON válido no formato:
{
  "cnpj": "CNPJ sem formatação (14 dígitos)" ou null,
  "confidence": número de 0 a 1,
  "source": "descrição breve de onde encontrou o CNPJ"
}

Exemplo de resposta válida:
{"cnpj": "17281106000103", "confidence": 0.95, "source": "Portal da Transparência"}

Exemplo se não encontrar:
{"cnpj": null, "confidence": 0, "source": "nenhum CNPJ encontrado nos resultados"}`;

    const aiResponse = await callOpenAI(
      [
        { role: "system", content: "Você extrai CNPJs de textos com precisão." },
        { role: "user", content: extractionPrompt }
      ],
      { jsonMode: true, maxTokens: 300 }
    );

    const result = JSON.parse(aiResponse);
    console.log(`[CNPJ Discovery] AI extraction result:`, result);

    if (!result.cnpj) {
      console.log(`[CNPJ Discovery] AI could not find CNPJ in search results`);
      return null;
    }

    const cleanCNPJ = result.cnpj.replace(/[^\d]/g, "");
    
    if (cleanCNPJ.length !== 14) {
      console.warn(`[CNPJ Discovery] ⚠️ Extracted CNPJ has invalid length: ${cleanCNPJ.length} digits`);
      return null;
    }

    // CRITICAL: Validate mathematically
    const isValid = isValidCNPJ(cleanCNPJ);
    if (!isValid) {
      console.warn(`[CNPJ Discovery] ⚠️ Extracted CNPJ failed validation: ${cleanCNPJ}`);
      console.warn(`[CNPJ Discovery] This is an invalid CNPJ - discarding`);
      return null;
    }

    console.log(`[CNPJ Discovery] ✓ Valid CNPJ extracted from web: ${cleanCNPJ}`);
    console.log(`[CNPJ Discovery] Source: ${result.source}`);
    console.log(`[CNPJ Discovery] Now validating with ReceitaWS to confirm...`);
    
    // CRITICAL: Always validate with ReceitaWS before trusting
    const receitaData = await fetchCNPJData(cleanCNPJ);
    if (!receitaData) {
      console.warn(`[CNPJ Discovery] ⚠️ ReceitaWS validation FAILED`);
      console.warn(`[CNPJ Discovery] CNPJ may be invalid or inactive - discarding`);
      return null;
    }

    // Verify the company name matches (safely handle null/undefined fantasia)
    const companyLower = companyName.toLowerCase();
    const nomeLower = (receitaData.nome || "").toLowerCase();
    const fantasiaLower = (receitaData.fantasia || "").toLowerCase();
    
    const nameMatches = 
      nomeLower.includes(companyLower) ||
      fantasiaLower.includes(companyLower) ||
      companyLower.includes(nomeLower) ||
      (fantasiaLower && companyLower.includes(fantasiaLower));

    if (!nameMatches) {
      console.warn(`[CNPJ Discovery] ⚠️ Company name mismatch!`);
      console.warn(`[CNPJ Discovery] Searched for: "${companyName}"`);
      console.warn(`[CNPJ Discovery] ReceitaWS returned: "${receitaData.nome}" / "${receitaData.fantasia}"`);
      console.warn(`[CNPJ Discovery] Discarding - names don't match`);
      return null;
    }

    console.log(`[CNPJ Discovery] ✅ SUCCESS! Discovered and validated CNPJ: ${cleanCNPJ}`);
    console.log(`[CNPJ Discovery] Company: ${receitaData.nome} / ${receitaData.fantasia}`);
    return cleanCNPJ;
  } catch (error) {
    console.error("[CNPJ Discovery] Error during discovery:", error);
    return null;
  }
}

/**
 * Processes user input (text or voice transcription) to extract entity information
 * Uses GPT-4o-mini for cost-effective processing
 */
export async function processEntityInput(input: string): Promise<ProcessedEntity> {
  // Step 0: Check if input is a pure CNPJ (before calling AI)
  const inputTrimmed = input.trim();
  const digitsOnly = inputTrimmed.replace(/\D/g, '');
  
  // If input contains 14 consecutive digits and looks like a CNPJ, treat it as such
  if (digitsOnly.length === 14 && /^[\d.\-\/\s]+$/.test(inputTrimmed)) {
    console.log("[AI Service] Pure CNPJ detected, validating and fetching from ReceitaWS:", digitsOnly);
    
    // Validate CNPJ mathematically
    const cnpjIsValid = isValidCNPJ(digitsOnly);
    
    if (!cnpjIsValid) {
      console.warn(`[AI Service] ⚠️ Invalid CNPJ provided: ${digitsOnly}`);
      return {
        name: "CNPJ inválido",
        documentType: "none",
        document: undefined,
        confidence: 0.1,
        source: "ai" as const,
      };
    }
    
    // Fetch from ReceitaWS
    const cnpjData = await fetchCNPJData(digitsOnly);
    
    if (cnpjData) {
      console.log("[AI Service] ✓ ReceitaWS data received for pure CNPJ:", cnpjData.nome);
      return {
        name: cnpjData.fantasia || cnpjData.nome,
        documentType: "cnpj",
        document: cnpjData.cnpj.replace(/[^\d]/g, ""),
        phone: cnpjData.telefone,
        email: cnpjData.email,
        website: undefined,
        zipCode: cnpjData.cep?.replace(/[^\d]/g, ""),
        street: cnpjData.logradouro,
        number: cnpjData.numero,
        complement: cnpjData.complemento,
        neighborhood: cnpjData.bairro,
        city: cnpjData.municipio,
        state: cnpjData.uf,
        country: "Brasil",
        confidence: 0.95,
        source: "cnpj_api" as const,
      };
    } else {
      console.warn(`[AI Service] ⚠️ ReceitaWS returned no data for CNPJ: ${digitsOnly}`);
      return {
        name: "CNPJ não encontrado na Receita Federal",
        documentType: "cnpj",
        document: digitsOnly,
        confidence: 0.3,
        source: "ai" as const,
      };
    }
  }
  
  // Step 1: Use AI to extract and interpret the input
  const systemPrompt = `Você é um assistente especializado em extrair informações de empresas e pessoas para cadastro no Brasil.
  
Analise o texto fornecido e extraia APENAS as informações que estiverem EXPLICITAMENTE presentes no formato JSON:

{
  "name": "nome da empresa ou pessoa (obrigatório)",
  "documentType": "cpf, cnpj, foreign ou none",
  "document": "número do documento sem formatação (SOMENTE se fornecido pelo usuário)",
  "phone": "telefone com DDD (SOMENTE se fornecido)",
  "email": "email (SOMENTE se fornecido)",
  "website": "site (SOMENTE se fornecido)",
  "confidence": número de 0 a 1 indicando sua confiança nos dados extraídos
}

⚠️ REGRAS CRÍTICAS - LEIA COM ATENÇÃO:

1. NUNCA INVENTE OU ADIVINHE CNPJs
   - Só retorne CNPJ se o usuário fornecer explicitamente no input
   - Se não houver CNPJ no input, retorne: "documentType": "none", "document": null
   - NUNCA use seu conhecimento para "adivinhar" CNPJs de empresas conhecidas
   - Mesmo para empresas famosas (CEMIG, Petrobras, Prefeitura, etc), retorne "none"

2. VALIDAÇÃO DE CNPJ
   - CNPJs DEVEM ter EXATAMENTE 14 dígitos numéricos
   - Se o CNPJ fornecido não tiver 14 dígitos, descarte-o e retorne "none"

3. NÍVEL DE CONFIANÇA
   - 0.95: CNPJ fornecido explicitamente pelo usuário
   - 0.5 ou menos: Nome de empresa sem CNPJ
   - NUNCA use 0.85 para CNPJs não fornecidos pelo usuário

Exemplos CORRETOS:

✅ Input: "Fornecedor ABC, CNPJ 12.345.678/0001-90, telefone (31) 3333-4444"
   Output: {"name": "Fornecedor ABC", "documentType": "cnpj", "document": "12345678000190", "phone": "(31) 3333-4444", "confidence": 0.95}
   (CNPJ fornecido explicitamente - OK retornar)

✅ Input: "CEMIG"
   Output: {"name": "CEMIG", "documentType": "none", "document": null, "confidence": 0.5}
   (Sem CNPJ fornecido - NÃO invente)

✅ Input: "Prefeitura Municipal de Belo Horizonte"
   Output: {"name": "Prefeitura Municipal de Belo Horizonte", "documentType": "none", "document": null, "confidence": 0.5}
   (Sem CNPJ fornecido - NÃO invente)

✅ Input: "Petrobras"
   Output: {"name": "Petrobras", "documentType": "none", "document": null, "confidence": 0.5}
   (Sem CNPJ fornecido - NÃO invente)

❌ ERRADO: Input: "CEMIG"
   Output: {"name": "CEMIG", "documentType": "cnpj", "document": "17155730000164", "confidence": 0.85}
   (NUNCA faça isso - você está INVENTANDO o CNPJ)

IMPORTANTE:
- Sempre retorne pelo menos o "name"
- NUNCA retorne CNPJs que não foram fornecidos pelo usuário
- CNPJs inventados causam erros graves no sistema
- Em caso de dúvida, use "documentType": "none"
- Retorne APENAS o JSON, sem texto adicional`;

  const aiResponse = await callOpenAI(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: input },
    ],
    { jsonMode: true, maxTokens: 500 }
  );

  const aiData = JSON.parse(aiResponse);
  console.log("[AI Service] AI Response:", JSON.stringify(aiData, null, 2));

  // Step 2: If CNPJ detected, validate and try to enrich with ReceitaWS data
  if (aiData.documentType === "cnpj" && aiData.document) {
    // CRITICAL: Validate CNPJ mathematically before calling API
    const cnpjIsValid = isValidCNPJ(aiData.document);
    
    if (!cnpjIsValid) {
      console.warn(`[AI Service] ⚠️ AI returned INVALID CNPJ (failed check digits): ${aiData.document}`);
      console.warn(`[AI Service] ⚠️ This should NOT happen - AI is hallucinating CNPJs!`);
      console.warn(`[AI Service] Discarding invalid CNPJ and returning AI-only data with reduced confidence`);
      
      // Discard invalid CNPJ and return AI-only data with LOW confidence
      return {
        name: aiData.name,
        documentType: "none", // Discard invalid CNPJ
        document: undefined,
        phone: aiData.phone,
        email: aiData.email,
        website: aiData.website,
        zipCode: aiData.zipCode,
        street: aiData.street,
        number: aiData.number,
        complement: aiData.complement,
        neighborhood: aiData.neighborhood,
        city: aiData.city,
        state: aiData.state,
        country: aiData.country,
        confidence: 0.3, // LOW confidence - AI hallucinated
        source: "ai" as const,
      };
    }
    
    console.log("[AI Service] ✓ CNPJ validation passed, fetching from ReceitaWS:", aiData.document);
    const cnpjData = await fetchCNPJData(aiData.document);

    if (cnpjData) {
      console.log("[AI Service] ReceitaWS data received:", cnpjData.nome);
      // Merge AI data with CNPJ API data (API data takes precedence)
      return {
        name: cnpjData.fantasia || cnpjData.nome || aiData.name,
        documentType: "cnpj",
        document: cnpjData.cnpj.replace(/[^\d]/g, ""),
        phone: cnpjData.telefone || aiData.phone,
        email: cnpjData.email || aiData.email,
        website: aiData.website,
        zipCode: cnpjData.cep?.replace(/[^\d]/g, ""),
        street: cnpjData.logradouro,
        number: cnpjData.numero,
        complement: cnpjData.complemento,
        neighborhood: cnpjData.bairro,
        city: cnpjData.municipio,
        state: cnpjData.uf,
        country: "Brasil",
        confidence: 0.95, // High confidence with official data
        source: "hybrid",
      };
    } else {
      console.warn("[AI Service] ⚠️ ReceitaWS returned no data for CNPJ:", aiData.document);
      console.warn("[AI Service] CNPJ may be valid but inactive/not found in ReceitaWS");
      console.warn("[AI Service] Returning AI-only data with reduced confidence");
      
      // ReceitaWS failed - return AI data with reduced confidence
      return {
        name: aiData.name,
        documentType: "cnpj", // Keep CNPJ since it's mathematically valid
        document: aiData.document,
        phone: aiData.phone,
        email: aiData.email,
        website: aiData.website,
        zipCode: aiData.zipCode,
        street: aiData.street,
        number: aiData.number,
        complement: aiData.complement,
        neighborhood: aiData.neighborhood,
        city: aiData.city,
        state: aiData.state,
        country: aiData.country,
        confidence: 0.4, // Reduced confidence - CNPJ valid but not enriched
        source: "ai" as const,
      };
    }
  }

  // Step 3: Return AI-only data if no CNPJ enrichment
  console.log("[AI Service] Returning AI-only data");
  return {
    name: aiData.name,
    documentType: aiData.documentType,
    document: aiData.document,
    phone: aiData.phone,
    email: aiData.email,
    website: aiData.website,
    zipCode: aiData.zipCode,
    street: aiData.street,
    number: aiData.number,
    complement: aiData.complement,
    neighborhood: aiData.neighborhood,
    city: aiData.city,
    state: aiData.state,
    country: aiData.country,
    confidence: aiData.confidence || 0.5, // Default confidence if not provided
    source: "ai" as const,
  };
}

// Types for Chart of Accounts AI generation
export interface GeneratedAccount {
  code: string;
  name: string;
  type: string;
  description: string;
  parentCode: string | null;
}

/**
 * Generates a complete chart of accounts structure using AI
 * Based on business description
 */
export async function generateChartOfAccounts(businessDescription: string): Promise<GeneratedAccount[]> {
  console.log("[AI Chart] Generating chart of accounts for:", businessDescription);

  const systemPrompt = `Você é um especialista em contabilidade brasileira. Sua tarefa é gerar um plano de contas completo e hierárquico para uma empresa.

ANÁLISE EM DUAS CAMADAS - MUITO IMPORTANTE:
1. PRIMEIRA CAMADA - Detectar Pedidos Específicos:
   - Analise cuidadosamente o que o usuário disse
   - Identifique QUALQUER item específico mencionado (ex: "água", "luz", "AWS", "licenças de software")
   - Esses itens DEVEM ser incluídos OBRIGATORIAMENTE no plano
   
2. SEGUNDA CAMADA - Contexto Geral:
   - Identifique o ramo/tipo da empresa
   - Gere contas adicionais relevantes para esse ramo
   - Complete com contas padrão necessárias

REGRA DE OURO: Se o usuário mencionar algo específico (mesmo que seja só um exemplo), você DEVE criar uma conta para aquilo.

CRÍTICO - CONTAS RAÍZES OBRIGATÓRIAS:
- Você DEVE incluir SEMPRE as 5 contas raízes no INÍCIO do array:
  1. Código "1" - Receitas
  2. Código "2" - Despesas  
  3. Código "3" - Ativo
  4. Código "4" - Passivo
  5. Código "5" - Patrimônio Líquido
- Depois das raízes, gere as subcontas hierárquicas
- Use códigos numéricos hierárquicos: 1.1, 1.1.1, 1.1.1.01 (até 5 níveis)
- Siga as normas contábeis brasileiras
- Seja específico para o ramo de atividade informado

Estrutura de códigos:
- Nível 1: 1, 2, 3, 4, 5 (raízes - DEVEM ser incluídas)
- Nível 2: 1.1, 1.2, 2.1, 2.2, etc.
- Nível 3: 1.1.1, 1.1.2, etc.
- Nível 4: 1.1.1.01, 1.1.1.02, etc.
- Nível 5: 1.1.1.01.001, etc.

Types permitidos:
- receita (para código 1 e 1.x)
- despesa (para código 2 e 2.x)
- ativo (para código 3 e 3.x)
- passivo (para código 4 e 4.x)
- patrimonio_liquido (para código 5 e 5.x)`;

  const userPrompt = `Analise esta descrição e gere um plano de contas COMPLETO: "${businessDescription}"

PASSO 1 - ANÁLISE INTELIGENTE (faça mentalmente, não retorne):
- O usuário mencionou itens ESPECÍFICOS? (ex: "água", "luz", "AWS", "combustível")
- Qual é o RAMO/TIPO da empresa? (ex: tecnologia, restaurante, transporte)
- Que contas específicas do ramo são necessárias?

PASSO 2 - GARANTIR ITENS ESPECÍFICOS MENCIONADOS:
- Se o usuário falou "água" → DEVE ter conta "Água"
- Se falou "AWS" ou "nuvem" → DEVE ter conta "AWS" ou "Serviços de Nuvem"
- Se falou "combustível" → DEVE ter conta "Combustível"
- Se falou "licenças de software" → DEVE ter conta "Licenças de Software"

EXEMPLOS DE INTERPRETAÇÃO:
- "empresa de tecnologia que usa AWS e GitHub" → gerar contas AWS, GitHub, mais outras de tech
- "restaurante que precisa controlar gás e vale refeição" → gerar Gás, Vale Refeição, mais outras de restaurante
- "transportadora com frotas" → gerar Combustível, IPVA, Manutenção de Veículos, Seguro de Veículos, mais outras
- "só preciso de água, luz, telefone" → gerar Água, Luz, Telefone, mais outras contas essenciais

RETORNE UM ARRAY JSON COMEÇANDO COM AS 5 CONTAS RAÍZES, seguidas de todas as subcontas.
Cada conta deve ter:
- code: código hierárquico (ex: "1", "1.1", "1.1.1", "1.1.1.01")
- name: nome da conta (USE O NOME EXATO mencionado pelo usuário quando aplicável)
- type: tipo (receita|despesa|ativo|passivo|patrimonio_liquido)
- description: descrição breve
- parentCode: código da conta pai (null para raízes, ex: "1.1" é pai de "1.1.1")

IMPORTANTE - SEJA MUITO ANALÍTICO E DETALHADO:
1. Gere NO MÍNIMO 50-70 contas (quanto mais detalhadas, melhor)
2. Use TODOS os níveis hierárquicos disponíveis (até nível 5)
3. INCLUA OBRIGATORIAMENTE os itens específicos mencionados pelo usuário
4. Seja ESPECÍFICO: crie contas detalhadas como:
   - "Despesas de Consumo" → "Água", "Luz", "Telefone", "Internet", "Gás"
   - "Despesas com Pessoal" → "Salários", "FGTS", "INSS", "Vale Transporte", "Vale Alimentação", "Vale Refeição"
   - "Despesas Administrativas" → "Material de Escritório", "Material de Limpeza", "Manutenção"
   - "Despesas com TI" (se tech) → "AWS", "Google Cloud", "GitHub", "Licenças de Software"
   - "Despesas com Veículos" (se transporte) → "Combustível", "IPVA", "Seguro", "Manutenção"
5. Para RECEITAS, detalhe por tipo de produto/serviço específico do negócio
6. Para ATIVOS, inclua: caixa, bancos, contas a receber, estoques, imobilizado detalhado
7. Para PASSIVOS, inclua: fornecedores, impostos a pagar, salários a pagar, empréstimos
8. Crie contas PRONTAS PARA USO REAL, não genéricas

Estrutura hierárquica exemplo (SEMPRE comece com as 5 raízes):
[
  {
    "code": "1",
    "name": "Receitas",
    "type": "receita",
    "description": "Contas de receita da empresa",
    "parentCode": null
  },
  {
    "code": "2",
    "name": "Despesas",
    "type": "despesa",
    "description": "Contas de despesa da empresa",
    "parentCode": null
  },
  {
    "code": "3",
    "name": "Ativo",
    "type": "ativo",
    "description": "Bens e direitos da empresa",
    "parentCode": null
  },
  {
    "code": "4",
    "name": "Passivo",
    "type": "passivo",
    "description": "Obrigações da empresa",
    "parentCode": null
  },
  {
    "code": "5",
    "name": "Patrimônio Líquido",
    "type": "patrimonio_liquido",
    "description": "Recursos próprios da empresa",
    "parentCode": null
  },
  {
    "code": "1.1",
    "name": "Receita de Vendas",
    "type": "receita",
    "description": "Receitas com vendas de produtos/serviços",
    "parentCode": "1"
  },
  {
    "code": "2.1",
    "name": "Despesas Operacionais",
    "type": "despesa",
    "description": "Despesas da operação do negócio",
    "parentCode": "2"
  },
  {
    "code": "2.1.1",
    "name": "Despesas de Consumo",
    "type": "despesa",
    "description": "Despesas com consumo de utilidades",
    "parentCode": "2.1"
  },
  {
    "code": "2.1.1.01",
    "name": "Água",
    "type": "despesa",
    "description": "Consumo de água",
    "parentCode": "2.1.1"
  },
  {
    "code": "2.1.1.02",
    "name": "Luz",
    "type": "despesa",
    "description": "Energia elétrica",
    "parentCode": "2.1.1"
  },
  {
    "code": "2.1.1.03",
    "name": "Telefone",
    "type": "despesa",
    "description": "Telefonia fixa e móvel",
    "parentCode": "2.1.1"
  }
]

CAPRIXE NO DETALHAMENTO! Gere NO MÍNIMO 50 contas analíticas e específicas.`;

  try {
    const response = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        jsonMode: true,
        maxTokens: 4000,
      }
    );

    console.log("[AI Chart] Raw AI response:", response);

    // Parse response
    let parsed: any;
    try {
      parsed = JSON.parse(response);
    } catch (e) {
      console.error("[AI Chart] Failed to parse JSON:", e);
      throw new Error("IA retornou resposta inválida");
    }

    // Extract accounts array (handle different response formats)
    const accounts: GeneratedAccount[] = parsed.accounts || parsed.contas || (Array.isArray(parsed) ? parsed : []);

    if (!Array.isArray(accounts) || accounts.length === 0) {
      console.error("[AI Chart] No accounts in response:", parsed);
      throw new Error("IA não retornou contas válidas");
    }

    console.log(`[AI Chart] Generated ${accounts.length} accounts`);

    // Validate and clean accounts
    const validAccounts = accounts.filter((acc: any) => {
      return (
        acc.code &&
        acc.name &&
        acc.type &&
        typeof acc.code === "string" &&
        typeof acc.name === "string"
      );
    });

    if (validAccounts.length === 0) {
      throw new Error("Nenhuma conta válida foi gerada");
    }

    console.log(`[AI Chart] Validated ${validAccounts.length} accounts`);
    return validAccounts;
  } catch (error: any) {
    console.error("[AI Chart] Error generating chart:", error);
    throw new Error(error.message || "Erro ao gerar plano de contas com IA");
  }
}

// Types for AI report generation
export interface ReportFilters {
  isCustomer?: boolean;
  isSupplier?: boolean;
  isActive?: boolean;
  city?: string;
  state?: string;
  documentType?: string;
  searchName?: string;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  selectedFields?: string[]; // Campos que o usuário quer visualizar
  reportTitle?: string; // Título descritivo do relatório gerado pela IA
}

export interface ReportMetadata {
  title: string;
  description: string;
  columns: string[];
  totalRecords: number;
}

/**
 * Processes user prompt to generate dynamic report filters
 * Uses GPT-4o-mini to interpret natural language and create SQL-like filters
 */
export async function generateReportFilters(prompt: string): Promise<ReportFilters> {
  try {
    console.log(`[AI Report] Processing prompt: "${prompt}"`);

    const systemPrompt = `Você é um assistente de relatórios financeiros especializado em gerar filtros dinâmicos e selecionar campos para visualização.

IMPORTANTE: Você deve interpretar o pedido do usuário e retornar APENAS filtros JSON válidos incluindo os campos que devem ser exibidos E um título descritivo.

CAMPOS OBRIGATÓRIOS NO JSON:
- reportTitle (string): Título descritivo e profissional para o relatório
- selectedFields (array): Campos a serem exibidos

CAMPOS DE FILTRO disponíveis em Clientes/Fornecedores:
- isCustomer (boolean): true se for cliente
- isSupplier (boolean): true se for fornecedor
- isActive (boolean): true se estiver ativo, false se inativo
- city (string): cidade (ex: "São Paulo", "Rio de Janeiro")
- state (string): estado com 2 letras (ex: "SP", "RJ", "MG")
- documentType (string): "cpf", "cnpj", "foreign", "none"
- searchName (string): busca parcial no nome
- limit (number): quantidade máxima de registros (padrão 100)
- orderBy (string): campo para ordenar - "name", "city", "state", "code"
- orderDirection (string): "asc" ou "desc"

CAMPOS PARA VISUALIZAÇÃO (selectedFields array de strings):
- code: Código
- name: Nome
- document: Documento (CPF/CNPJ)
- phone: Telefone
- email: Email
- city: Cidade
- state: Estado
- type: Tipo (Cliente/Fornecedor)
- status: Status (Ativo/Inativo)

REGRAS IMPORTANTES:
1. Quando o usuário mencionar EXPLICITAMENTE quais campos quer ver, use selectedFields
2. Se não mencionar, retorne todos os campos principais: ["code", "name", "type", "document", "city", "state", "status"]
3. SEMPRE crie um reportTitle profissional e descritivo

Exemplos de interpretação:

Prompt: "Lista com nome e telefone"
Filtros: { "reportTitle": "Relatório de Contatos - Nome e Telefone", "selectedFields": ["name", "phone"] }

Prompt: "Clientes de São Paulo com nome e email"
Filtros: { "reportTitle": "Relatório de Clientes - São Paulo", "isCustomer": true, "city": "São Paulo", "selectedFields": ["name", "email"] }

Prompt: "Top 10 fornecedores ativos - apenas nome, documento e cidade"
Filtros: { "reportTitle": "Top 10 Fornecedores Ativos", "isSupplier": true, "isActive": true, "limit": 10, "selectedFields": ["name", "document", "city"] }

Prompt: "Clientes inativos"
Filtros: { "reportTitle": "Relatório de Clientes Inativos", "isCustomer": true, "isActive": false, "selectedFields": ["code", "name", "type", "document", "city", "state", "status"] }

Prompt: "Todos de Minas Gerais"
Filtros: { "reportTitle": "Relatório de Clientes e Fornecedores - Minas Gerais", "state": "MG", "selectedFields": ["code", "name", "type", "document", "city", "state", "status"] }

Prompt: "Fornecedores com nome, telefone e email"
Filtros: { "reportTitle": "Relatório de Fornecedores - Dados de Contato", "isSupplier": true, "selectedFields": ["name", "phone", "email"] }

RETORNE APENAS O JSON, SEM EXPLICAÇÕES.`;

    const response = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      { jsonMode: true, maxTokens: 500 }
    );

    console.log(`[AI Report] Raw response:`, response);

    const filters: ReportFilters = JSON.parse(response);
    
    console.log(`[AI Report] Generated filters:`, filters);
    
    return filters;
  } catch (error: any) {
    console.error("[AI Report] Error generating filters:", error);
    throw new Error("Erro ao processar solicitação de relatório");
  }
}

// Types for AI transaction command processing
export interface TransactionCommand {
  operation: "create" | "clone" | "pay" | "unknown";
  type?: "revenue" | "expense";
  amount?: string;
  title?: string;
  description?: string;
  personName?: string;
  dueDate?: string;
  clonePeriod?: {
    type: "month" | "semester" | "year" | "custom";
    count?: number;
  };
  missingFields: string[];
  suggestions?: {
    personId?: string;
    chartAccountId?: string;
    costCenterId?: string;
    paymentMethodId?: string;
  };
  confidence: number;
}

/**
 * Transaction data after form completion
 */
export interface CompletedTransactionData {
  type: "revenue" | "expense";
  amount: string;
  title: string;
  description?: string;
  personName?: string;
  dueDate: string;
  personId?: string;
  chartAccountId?: string;
  costCenterId?: string;
  paymentMethodId?: string;
}

/**
 * Generates multiple transactions based on clone period
 * Maintains the same day of month, adjusting when necessary (e.g., 31 → 30 in April)
 */
export function generateClonedTransactions(
  baseTransaction: CompletedTransactionData,
  clonePeriod: NonNullable<TransactionCommand["clonePeriod"]>
): CompletedTransactionData[] {
  const transactions: CompletedTransactionData[] = [];
  
  // Parse base date
  const baseDate = new Date(baseTransaction.dueDate);
  if (isNaN(baseDate.getTime())) {
    console.error("[Clone] Invalid base date:", baseTransaction.dueDate);
    return [baseTransaction];
  }

  const baseDayOfMonth = baseDate.getDate();
  const baseYear = baseDate.getFullYear();
  const baseMonth = baseDate.getMonth();
  
  // Calculate how many transactions to generate
  let monthsToAdd: number;
  switch (clonePeriod.type) {
    case "month":
      monthsToAdd = clonePeriod.count || 1;
      break;
    case "semester":
      monthsToAdd = 6;
      break;
    case "year":
      monthsToAdd = 12;
      break;
    case "custom":
      monthsToAdd = clonePeriod.count || 1;
      break;
    default:
      monthsToAdd = 1;
  }

  console.log(`[Clone] Generating ${monthsToAdd} transactions starting from ${baseTransaction.dueDate}`);

  // Generate transactions for each month
  for (let i = 0; i < monthsToAdd; i++) {
    // Create target date starting from day 1 to avoid month overflow
    const targetDate = new Date(baseYear, baseMonth + i, 1);
    
    // Get last day of target month
    const lastDayOfTargetMonth = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      0
    ).getDate();
    
    // Set day to minimum between desired day and last day of month
    const adjustedDay = Math.min(baseDayOfMonth, lastDayOfTargetMonth);
    targetDate.setDate(adjustedDay);

    // Format as YYYY-MM-DD
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    transactions.push({
      ...baseTransaction,
      dueDate: formattedDate,
    });
  }

  console.log(`[Clone] Generated ${transactions.length} transactions`);
  return transactions;
}

/**
 * Analyzes user command for transaction operations
 * Uses GPT-4o-mini for cost-effective processing
 */
export async function analyzeTransactionCommand(
  input: string,
  companyId: string,
  availablePersons: Array<{ id: string; name: string; }>,
  availableAccounts: Array<{ id: string; code: string; name: string; }>,
  availableCostCenters: Array<{ id: string; code: string; name: string; }>
): Promise<TransactionCommand> {
  try {
    console.log("[AI Transaction] Analyzing command:", input);
    
    // Get current date for AI context
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const todayFormatted = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
    
    const systemPrompt = `Você é um assistente especializado em analisar comandos para criar lançamentos financeiros.

DATA ATUAL: ${todayFormatted} (ano: ${currentYear})

Analise o comando fornecido e extraia as informações no formato JSON:

{
  "operation": "create | clone | pay | unknown",
  "type": "revenue ou expense (se identificado)",
  "amount": "valor numérico sem formatação",
  "title": "título/descrição do lançamento",
  "description": "descrição adicional",
  "personName": "nome do cliente/fornecedor mencionado",
  "dueDate": "data no formato YYYY-MM-DD (se mencionada)",
  "clonePeriod": {
    "type": "month | semester | year | custom",
    "count": número de vezes para clonar
  },
  "missingFields": ["lista", "de", "campos", "faltantes"],
  "confidence": número de 0 a 1
}

REGRAS DE ANÁLISE:

1. OPERAÇÕES:
   - "create": Criar novo lançamento ("criar", "registrar", "adicionar", "lançar")
   - "clone": Clonar lançamento existente ("copiar", "clonar", "igual ao", "repetir")
   - "pay": Baixar/marcar como pago ("baixar", "pagar", "quitar")
   - "unknown": Não conseguiu identificar

2. TIPO:
   - "revenue": Receita ("receita", "venda", "entrada", "receber")
   - "expense": Despesa ("despesa", "pagamento", "gasto", "pagar")

3. VALOR:
   - Extrair apenas números (ex: "R$ 1.500,00" → "1500.00")
   - Se não mencionado, deixar null

4. DATAS (REGRAS CRÍTICAS):
   - ANO VIGENTE É ${currentYear} - SEMPRE priorize este ano
   - Anos de 2 dígitos (ex: "25", "26") → interpretar como 20XX (2025, 2026), NUNCA 19XX
   - Se mencionar ano que já passou (2015, 2020, 2023) → usar ${currentYear}
   - Sem ano especificado: "05/11" → "${currentYear}-11-05", "dia 10" → "${currentYear}-${String(currentMonth).padStart(2, '0')}-10"
   - Datas relativas: "amanhã", "hoje", "próxima semana" → calcular baseado em ${todayFormatted}
   - Formato de saída SEMPRE YYYY-MM-DD (ano com 4 dígitos)
   
   EXEMPLOS DE INTERPRETAÇÃO CORRETA:
   - "05/11" → "${currentYear}-11-05"
   - "05/11/25" → "2025-11-05" (NÃO "2015-11-05"!)
   - "dia 10 de dezembro de 2025" → "2025-12-10"
   - "próximo mês" → considerar ${currentYear} ou ${currentYear + 1} conforme o mês atual

5. PERÍODO DE CLONAGEM:
   - "ano todo" / "12 meses" → {"type": "year", "count": 12}
   - "semestre" / "6 meses" → {"type": "semester", "count": 6}
   - "próximos 3 meses" → {"type": "custom", "count": 3}

6. CAMPOS FALTANTES:
   Sempre incluir campos que NÃO foram mencionados:
   - "dueDate" (se não mencionou data)
   - "chartAccountId" (se não mencionou conta contábil)
   - "costCenterId" (se não mencionou centro de custo)
   - "paymentMethodId" (se não mencionou forma de pagamento)
   - "bankAccountId" (se não mencionou conta bancária)

Exemplos:

Input: "Criar despesa de R$ 250 para Cemig no dia 10"
Output: {
  "operation": "create",
  "type": "expense",
  "amount": "250.00",
  "title": null,
  "personName": "Cemig",
  "dueDate": null,
  "missingFields": ["chartAccountId", "costCenterId", "title", "dueDate"],
  "confidence": 0.85
}

Input: "Clonar conta da AWS para o ano todo"
Output: {
  "operation": "clone",
  "personName": "AWS",
  "clonePeriod": {"type": "year", "count": 12},
  "missingFields": [],
  "confidence": 0.9
}

Input: "Receita de R$ 5000 do cliente XYZ para amanhã"
Output: {
  "operation": "create",
  "type": "revenue",
  "amount": "5000.00",
  "personName": "XYZ",
  "dueDate": "[tomorrow's date]",
  "missingFields": ["chartAccountId", "title"],
  "confidence": 0.9
}

RETORNE APENAS O JSON, SEM EXPLICAÇÕES.`;

    const response = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ],
      { jsonMode: true, maxTokens: 500 }
    );

    console.log(`[AI Transaction] Raw response:`, response);

    const command: TransactionCommand = JSON.parse(response);
    
    // Try to match person name to existing persons
    if (command.personName && availablePersons.length > 0) {
      const personNameLower = command.personName.toLowerCase();
      const matchedPerson = availablePersons.find(p => 
        p.name.toLowerCase().includes(personNameLower) || 
        personNameLower.includes(p.name.toLowerCase())
      );
      
      if (matchedPerson) {
        command.suggestions = command.suggestions || {};
        command.suggestions.personId = matchedPerson.id;
        console.log(`[AI Transaction] Matched person: ${matchedPerson.name} (${matchedPerson.id})`);
      }
    }
    
    console.log(`[AI Transaction] Processed command:`, command);
    
    return command;
  } catch (error: any) {
    console.error("[AI Transaction] Error analyzing command:", error);
    throw new Error("Erro ao processar comando de lançamento");
  }
}
