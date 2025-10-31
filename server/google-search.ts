/**
 * Google Custom Search API Service
 * Uses Google Custom Search API to find CNPJs of Brazilian companies
 */

interface GoogleSearchResult {
  items?: Array<{
    title: string;
    snippet: string;
    link: string;
  }>;
}

interface CNPJSearchResult {
  found: boolean;
  cnpj?: string;
  snippet?: string;
  query?: string;
}

/**
 * Searches for a company's CNPJ using Google Custom Search API
 * @param companyName - Name of the company to search for
 * @returns Search result with CNPJ if found
 */
export async function searchCompanyCNPJ(companyName: string): Promise<CNPJSearchResult> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    console.error('[Google Search] Missing API credentials');
    console.error('[Google Search] Please configure:');
    console.error('[Google Search] - GOOGLE_CUSTOM_SEARCH_API_KEY');
    console.error('[Google Search] - GOOGLE_SEARCH_ENGINE_ID');
    return { found: false };
  }

  try {
    // Construct search query
    // Focus on Brazilian sites and CNPJ-related content
    const query = `"CNPJ" "${companyName}" site:.br`;
    
    // Call Google Custom Search API
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=5`;
    
    console.log(`[Google Search] Searching for: "${companyName}"`);
    console.log(`[Google Search] Query: ${query}`);
    console.log(`[Google Search] API Key configured: ${apiKey.substring(0, 8)}...`);
    console.log(`[Google Search] Search Engine ID: ${searchEngineId}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      console.error('[Google Search] API error:', response.status);
      console.error('[Google Search] Error details:', JSON.stringify(errorData, null, 2));
      
      if (response.status === 401) {
        console.error('');
        console.error('╔════════════════════════════════════════════════════════════════════╗');
        console.error('║ GOOGLE CUSTOM SEARCH API - ERRO 401 (Não Autorizado)              ║');
        console.error('╠════════════════════════════════════════════════════════════════════╣');
        console.error('║ POSSÍVEIS CAUSAS:                                                  ║');
        console.error('║ 1. A API "Custom Search API" não foi habilitada no Google Cloud   ║');
        console.error('║ 2. A API Key tem restrições que bloqueiam esta requisição         ║');
        console.error('║ 3. O Search Engine ID (cx) está incorreto                         ║');
        console.error('╠════════════════════════════════════════════════════════════════════╣');
        console.error('║ SOLUÇÃO:                                                           ║');
        console.error('║                                                                    ║');
        console.error('║ [1] Habilite a API no Google Cloud Console:                       ║');
        console.error('║     https://console.cloud.google.com/apis/library                  ║');
        console.error('║     Busque por "Custom Search API" e clique em "Habilitar"        ║');
        console.error('║                                                                    ║');
        console.error('║ [2] Verifique restrições da API Key:                              ║');
        console.error('║     https://console.cloud.google.com/apis/credentials              ║');
        console.error('║     - Remova restrições de IP/HTTP referrer (para teste)          ║');
        console.error('║     - Em "API restrictions", permita "Custom Search API"          ║');
        console.error('║                                                                    ║');
        console.error('║ [3] Confirme o Search Engine ID:                                  ║');
        console.error('║     https://programmablesearchengine.google.com/                   ║');
        console.error('║     Copie o ID correto do seu Programmable Search Engine          ║');
        console.error('║                                                                    ║');
        console.error('║ Consulte GOOGLE_SEARCH_SETUP.md para guia completo                ║');
        console.error('╚════════════════════════════════════════════════════════════════════╝');
        console.error('');
      }
      
      return { found: false };
    }

    const data = await response.json() as GoogleSearchResult;
    
    if (!data.items || data.items.length === 0) {
      console.log('[Google Search] No results found');
      return { found: false };
    }

    // Try to extract CNPJ from search results
    for (const item of data.items) {
      const text = `${item.title} ${item.snippet}`;
      const cnpj = extractCNPJFromText(text);
      
      if (cnpj) {
        console.log(`[Google Search] Found CNPJ: ${cnpj}`);
        console.log(`[Google Search] Source: ${item.link}`);
        
        return {
          found: true,
          cnpj,
          snippet: item.snippet,
          query
        };
      }
    }

    console.log('[Google Search] No CNPJ found in results');
    return { found: false };

  } catch (error) {
    console.error('[Google Search] Error:', error);
    return { found: false };
  }
}

/**
 * Extracts CNPJ from text using regex patterns
 * Supports multiple formats: XX.XXX.XXX/XXXX-XX, XXXXXXXXXXXXXXXX
 */
function extractCNPJFromText(text: string): string | null {
  // Pattern 1: Formatted CNPJ (XX.XXX.XXX/XXXX-XX)
  const formattedPattern = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g;
  const formattedMatch = text.match(formattedPattern);
  
  if (formattedMatch && formattedMatch.length > 0) {
    return formattedMatch[0];
  }

  // Pattern 2: Unformatted CNPJ (14 digits)
  // Look for "CNPJ" or "CNPJ:" followed by 14 digits
  const unformattedPattern = /CNPJ[:\s]*(\d{14})\b/gi;
  const unformattedMatch = text.match(unformattedPattern);
  
  if (unformattedMatch && unformattedMatch.length > 0) {
    // Extract just the digits
    const digits = unformattedMatch[0].replace(/\D/g, '');
    if (digits.length === 14) {
      // Format as XX.XXX.XXX/XXXX-XX
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
    }
  }

  // Pattern 3: Look for 14 consecutive digits near the word "CNPJ"
  const contextPattern = /CNPJ.{0,20}?(\d{14})/gi;
  const contextMatch = text.match(contextPattern);
  
  if (contextMatch && contextMatch.length > 0) {
    const digits = contextMatch[0].replace(/\D/g, '');
    if (digits.length === 14) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
    }
  }

  return null;
}
