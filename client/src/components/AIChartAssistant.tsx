import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIChartAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (accounts: any[]) => void;
}

export function AIChartAssistant({ open, onOpenChange, onGenerated }: AIChartAssistantProps) {
  const { toast } = useToast();
  const [businessDescription, setBusinessDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

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
      setBusinessDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
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
    if (!businessDescription.trim()) {
      toast({
        title: "Descrição obrigatória",
        description: "Por favor, descreva seu ramo de atividade",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/chart-of-accounts/generate-with-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessDescription }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao gerar plano de contas');
      }

      const data = await response.json();
      
      if (!data.accounts || data.accounts.length === 0) {
        throw new Error('Nenhuma conta foi gerada');
      }

      toast({
        title: "Plano gerado!",
        description: `${data.accounts.length} contas foram criadas pela IA`,
      });

      onGenerated(data.accounts);
      onOpenChange(false);
      setBusinessDescription("");
    } catch (error: any) {
      console.error('Error generating chart:', error);
      toast({
        title: "Erro ao gerar",
        description: error.message || "Não foi possível gerar o plano de contas",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Assistente IA - Plano de Contas
          </DialogTitle>
          <DialogDescription>
            Descreva seu ramo de atividade e a IA vai criar um plano de contas completo e personalizado para você.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business-description">Descrição do Negócio</Label>
            <div className="flex gap-2 items-start">
              <Input
                id="business-description"
                placeholder="Ex: oficina mecânica, restaurante, consultoria jurídica..."
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                disabled={isProcessing || isRecording}
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant={isRecording ? "destructive" : "outline"}
                className="h-10 w-10 flex-shrink-0"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                title={isRecording ? "Parar gravação" : "Gravar com voz"}
              >
                {isRecording ? (
                  <MicOff className="h-5 w-5 animate-pulse" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Digite ou clique no microfone para gravar sua descrição
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="text-sm font-medium">Como funciona:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Descreva seu negócio em poucas palavras</li>
              <li>A IA vai gerar um plano completo com 30-50 contas</li>
              <li>Você poderá visualizar e aprovar antes de confirmar</li>
              <li>As contas serão organizadas hierarquicamente</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isProcessing || !businessDescription.trim()}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Plano
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
