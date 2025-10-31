import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Mic, MicOff, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CustomerSupplier } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AIReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIReportDialog({ open, onOpenChange }: AIReportDialogProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [reportData, setReportData] = useState<CustomerSupplier[] | null>(null);
  const [reportMetadata, setReportMetadata] = useState<any>(null);

  // Initialize speech recognition
  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta reconhecimento de voz",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.lang = 'pt-BR';
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;

    recognitionInstance.onstart = () => {
      setIsRecording(true);
    };

    recognitionInstance.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      toast({
        title: "Erro no reconhecimento",
        description: "Não foi possível capturar a voz. Tente novamente.",
        variant: "destructive",
      });
    };

    recognitionInstance.onend = () => {
      setIsRecording(false);
    };

    recognitionInstance.start();
    setRecognition(recognitionInstance);
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsRecording(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Descrição obrigatória",
        description: "Por favor, descreva o relatório que você quer gerar",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setReportData(null);
    setReportMetadata(null);

    try {
      const response = await fetch('/api/ai-report/customers-suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao gerar relatório');
      }

      const result = await response.json();
      
      if (!result.data) {
        throw new Error('Nenhum dado foi retornado');
      }

      setReportData(result.data);
      setReportMetadata(result.metadata);

      toast({
        title: "Relatório gerado!",
        description: `${result.data.length} registro(s) encontrado(s)`,
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: "Erro ao gerar",
        description: error.message || "Não foi possível gerar o relatório",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setPrompt("");
    setReportData(null);
    setReportMetadata(null);
    onOpenChange(false);
  };

  const formatDocument = (doc: string | null, type: string | null) => {
    if (!doc) return '-';
    
    if (type === 'cnpj') {
      return doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } else if (type === 'cpf') {
      return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    
    return doc;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Relatório com IA - Clientes e Fornecedores
          </DialogTitle>
          <DialogDescription>
            Descreva o relatório que você deseja e a IA vai buscar os dados para você.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input Section */}
          {!reportData && (
            <>
              <div className="space-y-2">
                <Label htmlFor="report-prompt">O que você quer saber?</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="report-prompt"
                    placeholder="Ex: clientes de São Paulo, fornecedores ativos..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isProcessing || isRecording}
                    className="flex-1"
                    data-testid="input-report-prompt"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant={isRecording ? "destructive" : "outline"}
                    className="h-10 w-10 flex-shrink-0"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    title={isRecording ? "Parar gravação" : "Gravar com voz"}
                    data-testid="button-voice"
                  >
                    {isRecording ? (
                      <MicOff className="h-5 w-5 animate-pulse" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite ou clique no microfone para gravar sua solicitação
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Exemplos de comandos
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Clientes de São Paulo</li>
                  <li>Top 10 fornecedores ativos</li>
                  <li>Clientes inativos</li>
                  <li>Todos de Minas Gerais ordenados por nome</li>
                  <li>Fornecedores com CNPJ do Rio de Janeiro</li>
                  <li>Clientes que são também fornecedores</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isProcessing}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isProcessing || !prompt.trim()}
                  data-testid="button-generate"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Relatório
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Results Section */}
          {reportData && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Solicitação: <span className="text-muted-foreground">{reportMetadata?.prompt}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reportData.length} registro(s) encontrado(s)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReportData(null);
                      setReportMetadata(null);
                    }}
                    data-testid="button-new-report"
                  >
                    Nova Consulta
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[450px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Cidade/UF</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhum registro encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportData.map((entity) => (
                        <TableRow key={entity.id} data-testid={`row-entity-${entity.id}`}>
                          <TableCell className="font-mono text-sm">
                            {String(entity.code).padStart(3, '0')}
                          </TableCell>
                          <TableCell className="font-medium">{entity.name}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {entity.isCustomer && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Cliente
                                </Badge>
                              )}
                              {entity.isSupplier && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Fornecedor
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {formatDocument(entity.document, entity.documentType)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {entity.city && entity.state
                              ? `${entity.city}/${entity.state}`
                              : entity.city || entity.state || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={entity.isActive ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {entity.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="flex justify-end pt-4">
                <Button onClick={handleClose} data-testid="button-close">
                  Fechar
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
