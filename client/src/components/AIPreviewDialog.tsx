import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Building2, FileText, Phone, Mail, MapPin, Sparkles, RefreshCw } from "lucide-react";

interface ProcessedEntity {
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

interface AIPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ProcessedEntity | null;
  onConfirm: (data: ProcessedEntity) => void;
  onDiscard: () => void;
  onEnrich?: (cnpj: string) => Promise<void>;
}

function formatDocument(document: string, type?: string): string {
  if (!document) return "";
  
  const clean = document.replace(/\D/g, "");
  
  if (type === "cnpj" && clean.length === 14) {
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }
  
  if (type === "cpf" && clean.length === 11) {
    return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  
  return document;
}

function formatZipCode(zipCode: string): string {
  if (!zipCode) return "";
  const clean = zipCode.replace(/\D/g, "");
  if (clean.length === 8) {
    return clean.replace(/^(\d{5})(\d{3})$/, "$1-$2");
  }
  return zipCode;
}

function getSourceLabel(source: string): { label: string; color: string } {
  switch (source) {
    case "hybrid":
      return { label: "Dados da Receita Federal + IA", color: "bg-green-600" };
    case "cnpj_api":
      return { label: "Dados da Receita Federal", color: "bg-green-600" };
    case "ai":
      return { label: "Processado por IA", color: "bg-blue-600" };
    default:
      return { label: "Desconhecido", color: "bg-gray-600" };
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return "bg-green-600";
  if (confidence >= 0.7) return "bg-yellow-600";
  return "bg-orange-600";
}

export function AIPreviewDialog({ open, onOpenChange, data, onConfirm, onDiscard, onEnrich }: AIPreviewDialogProps) {
  const [manualCnpj, setManualCnpj] = useState("");
  const [isEnriching, setIsEnriching] = useState(false);

  if (!data) return null;

  // Guard against undefined values
  const confidence = data.confidence ?? 0.5;
  const source = getSourceLabel(data.source || "ai");
  const hasAddress = data.street || data.city || data.state;
  
  // Determine if we should show enrichment option
  // Only show enrichment if source is purely "ai" (not hybrid or cnpj_api) and no document
  const needsEnrichment = (!data.document || data.documentType === "none") && data.source === "ai";

  const handleEnrich = async () => {
    if (!onEnrich || !manualCnpj.trim()) return;
    
    setIsEnriching(true);
    try {
      await onEnrich(manualCnpj.trim());
      setManualCnpj(""); // Clear input after success
    } catch (error) {
      console.error("Erro ao enriquecer dados:", error);
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Dados Encontrados
              </DialogTitle>
              <DialogDescription>
                Confira as informações encontradas e confirme o cadastro
              </DialogDescription>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge className={`${source.color} text-white text-[10px] h-5 px-1.5`}>
                {source.label}
              </Badge>
              <Badge className={`${getConfidenceColor(confidence)} text-white text-[10px] h-5 px-1.5`}>
                {Math.round(confidence * 100)}% de confiança
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome e Documento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Nome
              </div>
              <div className="text-base font-semibold">{data.name}</div>
            </div>

            {data.document && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {data.documentType === "cnpj" ? "CNPJ" : data.documentType === "cpf" ? "CPF" : "Documento"}
                </div>
                <div className="text-base font-semibold">
                  {formatDocument(data.document, data.documentType)}
                </div>
              </div>
            )}
          </div>

          {/* Contato */}
          {(data.phone || data.email || data.website) && (
            <div className="space-y-2 pt-2 border-t">
              <div className="text-sm font-medium text-muted-foreground">Contato</div>
              <div className="grid grid-cols-2 gap-3">
                {data.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{data.phone}</span>
                  </div>
                )}
                {data.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{data.email}</span>
                  </div>
                )}
                {data.website && (
                  <div className="flex items-center gap-2 col-span-2">
                    <span className="text-sm text-muted-foreground">🌐</span>
                    <span className="text-sm">{data.website}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Endereço */}
          {hasAddress && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Endereço
              </div>
              <div className="space-y-1">
                {data.street && (
                  <div className="text-sm">
                    {data.street}
                    {data.number && `, ${data.number}`}
                    {data.complement && ` - ${data.complement}`}
                  </div>
                )}
                {data.neighborhood && (
                  <div className="text-sm text-muted-foreground">{data.neighborhood}</div>
                )}
                {(data.city || data.state) && (
                  <div className="text-sm">
                    {data.city && data.city}
                    {data.state && ` - ${data.state}`}
                  </div>
                )}
                {data.zipCode && (
                  <div className="text-sm text-muted-foreground">
                    CEP: {formatZipCode(data.zipCode)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CNPJ Enrichment Option */}
          {needsEnrichment && onEnrich && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Dados limitados detectados
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Forneça o CNPJ para buscar informações completas na Receita Federal
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o CNPJ (ex: 12.345.678/0001-90)"
                  value={manualCnpj}
                  onChange={(e) => setManualCnpj(e.target.value)}
                  className="flex-1"
                  disabled={isEnriching}
                  data-testid="input-manual-cnpj"
                />
                <Button
                  onClick={handleEnrich}
                  disabled={!manualCnpj.trim() || isEnriching}
                  className="rounded-xl px-4"
                  data-testid="button-enrich-cnpj"
                >
                  {isEnriching ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Enriquecer
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Warning if low confidence */}
          {confidence < 0.7 && !needsEnrichment && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Atenção:</strong> Alguns dados podem estar incompletos ou imprecisos. 
                Revise antes de confirmar.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onDiscard}
            className="rounded-xl px-6"
            data-testid="button-discard-ai"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Descartar
          </Button>
          <Button
            onClick={() => onConfirm(data)}
            className="rounded-xl px-6"
            data-testid="button-confirm-ai"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Confirmar e Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
