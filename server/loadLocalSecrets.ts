import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Carrega variáveis de ambiente de um arquivo JSON local (apenas se existir)
// - Não sobrescreve variáveis já definidas no ambiente
// - Seguro para Replit: se as variáveis existirem lá, nada é alterado
// - Projetado para desenvolvimento/local, mas não impede produção
(() => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.resolve(__dirname, "..");
    const secretsPath = path.join(projectRoot, "secrets.local.json");

    if (!fs.existsSync(secretsPath)) return; // nada a fazer

    const raw = fs.readFileSync(secretsPath, "utf8");
    const data = JSON.parse(raw) as Record<string, unknown>;

    let loaded = 0;
    for (const [key, value] of Object.entries(data)) {
      if (typeof value !== "string") continue;
      if (process.env[key] && process.env[key]!.length > 0) continue; // não sobrescreve
      process.env[key] = value;
      loaded++;
    }

    // Log discreto para desenvolvimento
    if (process.env.NODE_ENV !== "production") {
      console.log(`🔐 Segredos locais carregados de secrets.local.json (${loaded} vars)`);
    }
  } catch (err) {
    console.warn("Não foi possível carregar secrets.local.json:", err);
  }
})();