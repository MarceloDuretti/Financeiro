import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AITransactionInputProps {
  onProcess: (input: string) => void;
  isProcessing?: boolean;
  placeholder?: string;
}

export function AITransactionInput({ 
  onProcess, 
  isProcessing = false, 
  placeholder = "Digite ou fale seu comando..." 
}: AITransactionInputProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Continua gravando até parar manualmente
    recognition.interimResults = true; // Mostra resultados intermediários
    recognition.lang = "pt-BR";

    recognition.onresult = (event: any) => {
      // Concatena todos os resultados finais
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      
      if (finalTranscript) {
        const transcript = finalTranscript.trim();
        console.log("========================================");
        console.log("[VOZ] Texto transcrito:", transcript);
        console.log("========================================");
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        
        toast({
          title: "Texto reconhecido",
          description: transcript,
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      
      // Only show error for actual failures, not user cancellations
      if (event.error !== "no-speech" && event.error !== "aborted" && event.error !== "not-allowed") {
        toast({
          title: "Erro no reconhecimento de voz",
          description: "Digite manualmente no campo abaixo",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        // Limpa o campo de texto quando começar a gravar
        setInput("");
        recognitionRef.current.start();
        setIsListening(true);
        toast({
          title: "Microfone ativo",
          description: "Fale agora...",
        });
      } catch (error) {
        console.error("Error starting recognition:", error);
        toast({
          title: "Erro",
          description: "Não foi possível iniciar o microfone",
          variant: "destructive",
        });
      }
    }
  };

  const handleProcess = () => {
    if (!input.trim()) {
      toast({
        title: "Campo vazio",
        description: "Digite ou fale algo primeiro",
        variant: "destructive",
      });
      return;
    }

    console.log("========================================");
    console.log("[FRONTEND] Enviando para API:", input.trim());
    console.log("========================================");
    onProcess(input.trim());
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isProcessing || isListening}
          className={`min-h-[120px] resize-none ${isListening ? "ring-2 ring-primary" : ""}`}
          data-testid="input-ai-transaction"
        />
        {isListening && (
          <div className="absolute right-3 top-3">
            <div className="flex gap-1">
              <div className="w-1 h-3 bg-primary rounded-full animate-pulse" />
              <div className="w-1 h-3 bg-primary rounded-full animate-pulse delay-75" />
              <div className="w-1 h-3 bg-primary rounded-full animate-pulse delay-150" />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {isSupported && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleListening}
            disabled={isProcessing}
            className={isListening ? "bg-primary/10 border-primary" : ""}
            data-testid="button-voice-input"
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4 mr-2 text-primary" />
                Parar gravação
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Gravar áudio
              </>
            )}
          </Button>
        )}

        <Button
          onClick={handleProcess}
          disabled={isProcessing || !input.trim()}
          className="flex-1"
          data-testid="button-process-ai"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analisar com IA
            </>
          )}
        </Button>
      </div>

      {!isSupported && (
        <p className="text-xs text-muted-foreground">
          Reconhecimento de voz não disponível neste navegador. Use Chrome, Edge ou Safari.
        </p>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Exemplos de comandos:</p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>"Criar despesa de R$ 250 para Cemig no dia 10"</li>
          <li>"Clonar conta da AWS para o ano todo"</li>
          <li>"Receita de R$ 5000 do cliente XYZ para amanhã"</li>
          <li>"Baixar contas do fornecedor AWS que têm forma de pagamento"</li>
        </ul>
      </div>
    </div>
  );
}
