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
 * Discovers CNPJ for a company using AI knowledge + validation
 * Uses GPT-4o-mini's knowledge of well-known Brazilian companies, but ALWAYS validates
 */
async function discoverCNPJByName(companyName: string): Promise<string | null> {
  try {
    console.log(`[CNPJ Discovery] Attempting to discover CNPJ for: "${companyName}"`);
    
    const discoveryPrompt = `Você tem conhecimento sobre empresas brasileiras. Se você conhece o CNPJ da empresa "${companyName}", forneça-o.

EMPRESA: "${companyName}"

⚠️ REGRAS CRÍTICAS:
1. APENAS retorne o CNPJ se você tem CERTEZA ABSOLUTA que conhece esta empresa
2. O CNPJ deve ser de uma empresa MUITO CONHECIDA nacionalmente (CEMIG, Petrobras, Copasa, Correios, etc)
3. Se você NÃO tem certeza ou não conhece, retorne null
4. CNPJs DEVEM ter EXATAMENTE 14 dígitos
5. NÃO invente ou adivinhe - se não tem certeza, retorne null

Retorne APENAS um JSON válido:
{
  "cnpj": "CNPJ sem formatação (14 dígitos)" ou null,
  "confidence": número de 0 a 1,
  "companyFullName": "nome jurídico completo da empresa" ou null
}

Exemplos de empresas MUITO CONHECIDAS que você pode retornar:
- CEMIG (Companhia Energética de Minas Gerais)
- Petrobras
- Copasa (Companhia de Saneamento de Minas Gerais)
- Banco do Brasil
- Caixa Econômica Federal
- Correios
- Oi S.A.
- Vale S.A.

Se a empresa NÃO está nesta lista de empresas nacionalmente famosas, retorne:
{"cnpj": null, "confidence": 0, "companyFullName": null}`;

    const aiResponse = await callOpenAI(
      [
        { role: "system", content: "Você conhece CNPJs de grandes empresas brasileiras, mas só retorna quando tem certeza absoluta." },
        { role: "user", content: discoveryPrompt }
      ],
      { jsonMode: true, maxTokens: 300 }
    );

    const result = JSON.parse(aiResponse);
    console.log(`[CNPJ Discovery] AI result:`, result);

    if (!result.cnpj) {
      console.log(`[CNPJ Discovery] AI doesn't know CNPJ for this company`);
      return null;
    }

    const cleanCNPJ = result.cnpj.replace(/[^\d]/g, "");
    
    if (cleanCNPJ.length !== 14) {
      console.warn(`[CNPJ Discovery] ⚠️ AI returned CNPJ with invalid length: ${cleanCNPJ.length} digits`);
      return null;
    }

    // CRITICAL: Validate mathematically
    const isValid = isValidCNPJ(cleanCNPJ);
    if (!isValid) {
      console.warn(`[CNPJ Discovery] ⚠️ AI returned INVALID CNPJ (failed check digits): ${cleanCNPJ}`);
      console.warn(`[CNPJ Discovery] This is a hallucination - discarding`);
      return null;
    }

    console.log(`[CNPJ Discovery] ✓ AI provided valid CNPJ: ${cleanCNPJ}`);
    console.log(`[CNPJ Discovery] Now validating with ReceitaWS to confirm...`);
    
    // CRITICAL: Always validate with ReceitaWS before trusting
    const receitaData = await fetchCNPJData(cleanCNPJ);
    if (!receitaData) {
      console.warn(`[CNPJ Discovery] ⚠️ ReceitaWS validation FAILED for AI-provided CNPJ`);
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

  // Step 3: Try to discover CNPJ automatically if not provided
  if (!aiData.document || aiData.documentType === "none") {
    console.log("[AI Service] No CNPJ provided by user - attempting automatic discovery...");
    const discoveredCNPJ = await discoverCNPJByName(aiData.name);
    
    if (discoveredCNPJ) {
      console.log("[AI Service] 🎉 Auto-discovery SUCCESS! Found CNPJ:", discoveredCNPJ);
      console.log("[AI Service] Fetching complete data from ReceitaWS...");
      
      const cnpjData = await fetchCNPJData(discoveredCNPJ);
      if (cnpjData) {
        console.log("[AI Service] ✅ Complete! Returning enriched data from auto-discovery");
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
          confidence: 0.95, // High confidence - validated with ReceitaWS
          source: "hybrid",
        };
      }
    } else {
      console.log("[AI Service] Auto-discovery failed - company not recognized or not well-known");
    }
  }

  // Step 4: Return AI-only data if no CNPJ enrichment
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
