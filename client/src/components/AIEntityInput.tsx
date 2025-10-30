import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface AIEntityInputProps {
  onProcess: (input: string) => void;
  isProcessing?: boolean;
  placeholder?: string;
}

export function AIEntityInput({ onProcess, isProcessing = false, placeholder = "Digite ou fale o nome da empresa..." }: AIEntityInputProps) {
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
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "pt-BR";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      
      toast({
        title: "Texto reconhecido",
        description: transcript,
      });
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

    onProcess(input.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isProcessing) {
      handleProcess();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isProcessing || isListening}
            className={isListening ? "ring-2 ring-primary" : ""}
            data-testid="input-ai-entity"
          />
          {isListening && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="flex gap-1">
                <div className="w-1 h-3 bg-primary rounded-full animate-pulse" />
                <div className="w-1 h-3 bg-primary rounded-full animate-pulse delay-75" />
                <div className="w-1 h-3 bg-primary rounded-full animate-pulse delay-150" />
              </div>
            </div>
          )}
        </div>

        {isSupported && (
          <Button
            variant="outline"
            size="icon"
            onClick={toggleListening}
            disabled={isProcessing}
            className={isListening ? "bg-primary/10 border-primary" : ""}
            data-testid="button-voice-input"
          >
            {isListening ? (
              <MicOff className="h-4 w-4 text-primary" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}

        <Button
          onClick={handleProcess}
          disabled={isProcessing || !input.trim()}
          className="rounded-xl px-6"
          data-testid="button-process-ai"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Processar com IA
            </>
          )}
        </Button>
      </div>

      {!isSupported && (
        <p className="text-xs text-muted-foreground">
          ⚠️ Reconhecimento de voz não disponível neste navegador. Use Chrome, Edge ou Safari.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        💡 Dica: Digite "CEMIG" ou "Fornecedor ABC, CNPJ 12.345.678/0001-90"
      </p>
    </div>
  );
}
