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
 * Processes user input (text or voice transcription) to extract entity information
 * Uses GPT-4o-mini for cost-effective processing
 */
export async function processEntityInput(input: string): Promise<ProcessedEntity> {
  // Step 1: Use AI to extract and interpret the input
  const systemPrompt = `Você é um assistente especializado em extrair informações de empresas e pessoas para cadastro no Brasil.
  
Analise o texto fornecido e extraia TODAS as informações disponíveis no seguinte formato JSON:

{
  "name": "nome da empresa ou pessoa (obrigatório)",
  "documentType": "cpf, cnpj, foreign ou none",
  "document": "número do documento sem formatação (14 dígitos para CNPJ)",
  "phone": "telefone com DDD",
  "email": "email se mencionado",
  "website": "site se mencionado",
  "confidence": número de 0 a 1 indicando sua confiança nos dados extraídos
}

RECURSO ESPECIAL - DESCOBERTA INTELIGENTE DE CNPJ:
Se o usuário fornecer APENAS o nome de uma empresa brasileira conhecida (sem CNPJ), tente descobrir o CNPJ da empresa usando seu conhecimento.
- Se você conhece a empresa e tem alta confiança no CNPJ, retorne: "documentType": "cnpj", "document": "14 dígitos sem formatação"
- Se você não conhece ou não tem certeza, retorne: "documentType": "none", "document": null

Exemplos:
- Input: "CEMIG"
  Output: {"name": "CEMIG", "documentType": "cnpj", "document": "17155730000164", "confidence": 0.85}
  (Você conhece a CEMIG - Companhia Energética de Minas Gerais)

- Input: "Petrobras"
  Output: {"name": "Petrobras", "documentType": "cnpj", "document": "33000167000101", "confidence": 0.85}

- Input: "Padaria do João"
  Output: {"name": "Padaria do João", "documentType": "none", "confidence": 0.5}
  (Empresa pequena/local - você não conhece o CNPJ)

- Input: "Fornecedor ABC, CNPJ 12.345.678/0001-90, telefone (31) 3333-4444"
  Output: {"name": "Fornecedor ABC", "documentType": "cnpj", "document": "12345678000190", "phone": "(31) 3333-4444", "confidence": 0.95}
  (CNPJ fornecido explicitamente pelo usuário)

IMPORTANTE:
- Sempre retorne pelo menos o "name"
- CNPJs brasileiros têm EXATAMENTE 14 dígitos numéricos
- Para empresas conhecidas (grandes empresas, marcas famosas), tente fornecer o CNPJ
- Seja conservador com "confidence" - use 0.85 para empresas conhecidas, 0.95 quando CNPJ fornecido pelo usuário, 0.5 ou menos quando incerto
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

  // Step 2: If CNPJ detected, try to enrich with ReceitaWS data
  if (aiData.documentType === "cnpj" && aiData.document) {
    console.log("[AI Service] CNPJ detected, fetching from ReceitaWS:", aiData.document);
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
      console.log("[AI Service] ReceitaWS returned no data for CNPJ:", aiData.document);
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
