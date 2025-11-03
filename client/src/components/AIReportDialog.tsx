import { useState, useRef } from "react";
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
import { Loader2, Sparkles, Mic, MicOff, FileText, Printer, Download } from "lucide-react";
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    recognitionInstance.continuous = true; // Continua gravando até parar manualmente
    recognitionInstance.interimResults = true; // Mostra resultados intermediários

    recognitionInstance.onstart = () => {
      setIsRecording(true);
    };

    recognitionInstance.onresult = (event: any) => {
      // Concatena todos os resultados finais
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      
      if (finalTranscript) {
        setPrompt((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript).trim());
      }
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

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePDF = () => {
    if (!reportData || !reportMetadata) return;

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(reportMetadata.reportTitle || 'Relatório', 14, 20);
    
    // Data de geração
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const now = new Date().toLocaleString('pt-BR');
    doc.text(`Gerado em: ${now}`, 14, 28);
    
    // Total de registros
    doc.text(`Total de registros: ${reportData.length}`, 14, 34);

    // Configurar colunas da tabela
    const columns = reportMetadata.selectedFields.map((field: string) => {
      const labels: Record<string, string> = {
        code: 'Código',
        name: 'Nome',
        type: 'Tipo',
        document: 'Documento',
        phone: 'Telefone',
        email: 'Email',
        city: 'Cidade',
        state: 'Estado',
        status: 'Status'
      };
      return labels[field] || field;
    });

    // Preparar dados da tabela
    const rows = reportData.map((entity: any) => {
      return reportMetadata.selectedFields.map((field: string) => {
        if (field === 'code') {
          return String(entity.code).padStart(3, '0');
        } else if (field === 'document') {
          return formatDocument(entity.document, entity.documentType);
        } else {
          return entity[field] || '-';
        }
      });
    });

    // Gerar tabela
    autoTable(doc, {
      startY: 40,
      head: [columns],
      body: rows,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Salvar PDF
    const filename = `${reportMetadata.reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    toast({
      title: "PDF gerado!",
      description: "O arquivo foi baixado com sucesso",
    });
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
                  <li>Lista com nome e telefone</li>
                  <li>Clientes de São Paulo com nome e email</li>
                  <li>Top 10 fornecedores ativos - apenas nome, documento e cidade</li>
                  <li>Clientes inativos</li>
                  <li>Fornecedores com nome, telefone e email</li>
                  <li>Todos de Minas Gerais ordenados por nome</li>
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
              <div className="space-y-2 border-b pb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {reportMetadata?.reportTitle || 'Relatório'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {reportData.length} registro(s) encontrado(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      data-testid="button-print"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGeneratePDF}
                      data-testid="button-generate-pdf"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Gerar PDF
                    </Button>
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
              </div>

              <ScrollArea className="h-[450px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {reportMetadata?.selectedFields?.map((field: string) => (
                        <TableHead key={field}>
                          {field === 'code' && 'Código'}
                          {field === 'name' && 'Nome'}
                          {field === 'type' && 'Tipo'}
                          {field === 'document' && 'Documento'}
                          {field === 'phone' && 'Telefone'}
                          {field === 'email' && 'Email'}
                          {field === 'city' && 'Cidade'}
                          {field === 'state' && 'Estado'}
                          {field === 'status' && 'Status'}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.length === 0 ? (
                      <TableRow>
                        <TableCell 
                          colSpan={reportMetadata?.selectedFields?.length || 1} 
                          className="text-center text-muted-foreground"
                        >
                          Nenhum registro encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportData.map((entity: any, idx: number) => (
                        <TableRow key={entity.id || idx} data-testid={`row-entity-${idx}`}>
                          {reportMetadata?.selectedFields?.map((field: string) => (
                            <TableCell key={field}>
                              {field === 'code' && (
                                <span className="font-mono text-sm">
                                  {String(entity.code).padStart(3, '0')}
                                </span>
                              )}
                              {field === 'name' && (
                                <span className="font-medium">{entity.name || '-'}</span>
                              )}
                              {field === 'type' && (
                                <span className="text-sm">{entity.type || '-'}</span>
                              )}
                              {field === 'document' && (
                                <span className="font-mono text-xs">
                                  {formatDocument(entity.document, entity.documentType)}
                                </span>
                              )}
                              {field === 'phone' && (
                                <span className="text-sm">{entity.phone || '-'}</span>
                              )}
                              {field === 'email' && (
                                <span className="text-sm">{entity.email || '-'}</span>
                              )}
                              {field === 'city' && (
                                <span className="text-sm">{entity.city || '-'}</span>
                              )}
                              {field === 'state' && (
                                <span className="text-sm">{entity.state || '-'}</span>
                              )}
                              {field === 'status' && (
                                <span className="text-sm">{entity.status || '-'}</span>
                              )}
                            </TableCell>
                          ))}
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
