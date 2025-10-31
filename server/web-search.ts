/**
 * Web Search Module for discovering CNPJs
 * Hybrid 3-layer intelligent search system:
 * 1. Static cache (~30 well-known companies) - Instant, free
 * 2. PostgreSQL cache (previously discovered companies) - Fast, free
 * 3. Google Custom Search API (new discoveries) - Slower, costs API credits
 */

import { storage } from './storage';
import { searchCompanyCNPJ } from './google-search';

/**
 * Normalizes company name for matching
 * Removes accents, punctuation, stop words, and converts to uppercase
 */
export function normalizeCompanyName(name: string): string {
  // Common Portuguese stop words in company names
  const stopWords = ['DE', 'DA', 'DO', 'DAS', 'DOS', 'E', 'S A', 'SA', 'LTDA', 'ME', 'EPP'];
  
  let normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^\w\s]/g, " ") // Replace punctuation with space
    .replace(/\s+/g, " ") // Normalize spaces
    .trim()
    .toUpperCase();
  
  // Remove stop words
  for (const stopWord of stopWords) {
    const regex = new RegExp(`\\b${stopWord}\\b`, 'g');
    normalized = normalized.replace(regex, ' ');
  }
  
  // Clean up extra spaces after stop word removal
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Static cache of ~30 well-known Brazilian companies
 * Used as Layer 1 (fastest, always free)
 */
const STATIC_CACHE: Record<string, string> = {
      // Utilities & Infrastructure (Minas Gerais) - Multiple aliases per company
      "COPASA": "Companhia de Saneamento de Minas Gerais - COPASA MG - CNPJ: 17.281.106/0001-03",
      "COPASA MG": "Companhia de Saneamento de Minas Gerais - COPASA MG - CNPJ: 17.281.106/0001-03",
      "COMPANHIA SANEAMENTO MINAS GERAIS": "Companhia de Saneamento de Minas Gerais - COPASA MG - CNPJ: 17.281.106/0001-03",
      
      "CEMIG": "Companhia Energética de Minas Gerais - CEMIG - CNPJ: 17.155.730/0001-64",
      "COMPANHIA ENERGETICA MINAS GERAIS": "Companhia Energética de Minas Gerais - CEMIG - CNPJ: 17.155.730/0001-64",
      
      "CBTU": "Companhia Brasileira de Trens Urbanos - CBTU - CNPJ: 42.357.483/0001-26",
      "COMPANHIA BRASILEIRA TRENS URBANOS": "Companhia Brasileira de Trens Urbanos - CBTU - CNPJ: 42.357.483/0001-26",
      
      // Financial Institutions
      "BDMG": "Banco de Desenvolvimento de Minas Gerais S.A. - BDMG - CNPJ: 38.486.817/0001-94",
      "BANCO DO BRASIL": "Banco do Brasil S.A. - CNPJ: 00.000.000/0001-91",
      "CAIXA": "Caixa Econômica Federal - CNPJ: 00.360.305/0001-04",
      "BNDES": "Banco Nacional de Desenvolvimento Econômico e Social - BNDES - CNPJ: 33.657.248/0001-89",
      
      // Government (Minas Gerais)
      "PREFEITURA BELO HORIZONTE": "Município de Belo Horizonte - CNPJ: 18.715.383/0001-40",
      "PREFEITURA BH": "Município de Belo Horizonte - CNPJ: 18.715.383/0001-40",
      "PBH": "Município de Belo Horizonte - CNPJ: 18.715.383/0001-40",
      
      // Major Corporations
      "PETROBRAS": "Petróleo Brasileiro S.A. - Petrobras - CNPJ: 33.000.167/0001-01",
      "VALE": "Vale S.A. - CNPJ: 33.592.510/0001-54",
      "CORREIOS": "Empresa Brasileira de Correios e Telégrafos - CNPJ: 34.028.316/0001-03",
      "EMBRATEL": "Empresa Brasileira de Telecomunicações S.A. - Embratel - CNPJ: 33.530.486/0001-29",
      "TIM": "TIM S.A. - CNPJ: 02.421.421/0001-11",
      "CLARO": "Claro S.A. - CNPJ: 40.432.544/0001-47",
      "VIVO": "Telefônica Brasil S.A. - Vivo - CNPJ: 02.558.157/0001-62",
      "OI": "Oi S.A. - CNPJ: 76.535.764/0001-43",
      
      // Retailers
      "PAO DE ACUCAR": "Companhia Brasileira de Distribuição - Pão de Açúcar - CNPJ: 47.508.411/0001-56",
      "PAO ACUCAR": "Companhia Brasileira de Distribuição - Pão de Açúcar - CNPJ: 47.508.411/0001-56",
      "CARREFOUR": "Carrefour Comércio e Indústria Ltda - CNPJ: 45.543.915/0001-81",
      "AMERICANAS": "Americanas S.A. - CNPJ: 00.776.574/0001-56",
      "MAGAZINE LUIZA": "Magazine Luiza S.A. - CNPJ: 47.960.950/0001-21",
      
      // Transportation
      "LATAM": "LATAM Airlines Group S.A. - CNPJ: 02.012.862/0001-60",
      "GOL": "Gol Linhas Aéreas S.A. - CNPJ: 06.164.253/0001-87",
      "AZUL": "Azul Linhas Aéreas Brasileiras S.A. - CNPJ: 09.296.295/0001-60",
      
      // Tech & Services (using placeholder CNPJs - these should be verified)
      "GOOGLE BRASIL": "Google Brasil Internet Ltda - CNPJ: 06.990.590/0001-23",
      "MICROSOFT": "Microsoft Informática Ltda - CNPJ: 04.712.500/0001-07",
      
      // Additional variations for common searches (accents normalized)
      "COMPANHIA SANEAMENTO": "Companhia de Saneamento de Minas Gerais - COPASA MG - CNPJ: 17.281.106/0001-03",
      "COMPANHIA ENERGETICA": "Companhia Energética de Minas Gerais - CEMIG - CNPJ: 17.155.730/0001-64",
      "SANEAMENTO MINAS": "Companhia de Saneamento de Minas Gerais - COPASA MG - CNPJ: 17.281.106/0001-03",
      "ENERGIA MINAS": "Companhia Energética de Minas Gerais - CEMIG - CNPJ: 17.155.730/0001-64",
      "MUNICIPIO BELO HORIZONTE": "Município de Belo Horizonte - CNPJ: 18.715.383/0001-40",
      "PREFEITURA MUNICIPAL BELO HORIZONTE": "Município de Belo Horizonte - CNPJ: 18.715.383/0001-40"
};

/**
 * Hybrid 3-layer search for company CNPJs
 * Layer 1: Static cache (instant, free)
 * Layer 2: PostgreSQL cache (fast, free, grows over time)
 * Layer 3: Google Custom Search API (slower, costs credits, auto-cached)
 */
export async function webSearch(query: string): Promise<string> {
  console.log(`[Web Search] 🔍 Starting hybrid search for: "${query}"`);
  
  // Extract company name from query
  const companyMatch = query.match(/CNPJ da (.+?) site:/i);
  const companyName = companyMatch ? companyMatch[1].trim() : query;
  
  console.log(`[Web Search] 📝 Company name: "${companyName}"`);
  
  const normalizedName = normalizeCompanyName(companyName);
  console.log(`[Web Search] 🔧 Normalized: "${normalizedName}"`);
  
  // LAYER 1: Static cache (instant, free)
  console.log(`[Web Search] 🗄️  Layer 1: Searching static cache...`);
  for (const [key, value] of Object.entries(STATIC_CACHE)) {
    const normalizedKey = normalizeCompanyName(key);
    
    if (normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
      console.log(`[Web Search] ✅ Layer 1 HIT: Found in static cache - "${key}"`);
      console.log(`[Web Search] 💰 API credits saved: Using free static cache`);
      return value;
    }
  }
  console.log(`[Web Search] ⚠️  Layer 1 MISS: Not in static cache`);
  
  // LAYER 2: PostgreSQL cache (fast, free, growing)
  console.log(`[Web Search] 💾 Layer 2: Searching PostgreSQL cache...`);
  try {
    const cached = await storage.getDiscoveredCompanyByName(normalizedName);
    
    if (cached) {
      console.log(`[Web Search] ✅ Layer 2 HIT: Found in database cache`);
      console.log(`[Web Search] 📊 Usage count: ${cached.timesUsed + 1} times`);
      console.log(`[Web Search] 💰 API credits saved: Using database cache`);
      
      // Increment usage counter
      await storage.incrementDiscoveredCompanyUsage(cached.id);
      
      // Format result
      return `${cached.legalName} - CNPJ: ${cached.cnpj}`;
    }
    console.log(`[Web Search] ⚠️  Layer 2 MISS: Not in database cache`);
  } catch (error) {
    console.error(`[Web Search] ❌ Layer 2 ERROR:`, error);
  }
  
  // LAYER 3: Google Custom Search API (slower, costs credits, but finds anything)
  console.log(`[Web Search] 🌐 Layer 3: Searching via Google Custom Search API...`);
  console.log(`[Web Search] 💸 Using API credits (will be cached for future use)`);
  
  try {
    const googleResult = await searchCompanyCNPJ(companyName);
    
    if (googleResult.found && googleResult.cnpj) {
      console.log(`[Web Search] ✅ Layer 3 HIT: Found via Google API`);
      console.log(`[Web Search] 📥 Caching in PostgreSQL for future use...`);
      
      // Save to database for future use (auto-learning!)
      try {
        await storage.saveDiscoveredCompany({
          nameNormalized: normalizedName,
          cnpj: googleResult.cnpj,
          legalName: companyName, // Will be enriched by ReceitaWS later
          source: 'google_search',
          confidence: '0.7', // Google search confidence
          searchQuery: googleResult.query,
          googleSnippet: googleResult.snippet,
        });
        
        console.log(`[Web Search] ✅ Successfully cached in database`);
        console.log(`[Web Search] 🎯 Next search for "${companyName}" will use Layer 2 (free)`);
      } catch (cacheError) {
        console.error(`[Web Search] ⚠️  Failed to cache result:`, cacheError);
      }
      
      // Format result
      return `${companyName} - CNPJ: ${googleResult.cnpj}`;
    }
    
    console.log(`[Web Search] ⚠️  Layer 3 MISS: Google found no results`);
  } catch (error) {
    console.error(`[Web Search] ❌ Layer 3 ERROR:`, error);
  }
  
  // All layers failed
  console.log(`[Web Search] ❌ All 3 layers failed - no CNPJ found`);
  return '';
}
