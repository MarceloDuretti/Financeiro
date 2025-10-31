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

export function AIEntityInput({ onProcess, isProcessing = false, placeholder = "Digite o CNPJ (ex: 12.345.678/0001-90) ou nome + CNPJ..." }: AIEntityInputProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Normalize text to ensure no more than 14 total digits
  // Truncates after the 14th digit regardless of separators
  const normalizeDigits = (text: string): string => {
    let digitCount = 0;
    let result = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (/\d/.test(char)) {
        digitCount++;
        if (digitCount > 14) {
          // Stop adding characters after 14th digit
          break;
        }
      }
      result += char;
    }
    
    return result;
  };

  // Format CNPJ as user types: XX.XXX.XXX/XXXX-XX
  const formatCNPJ = (value: string): string => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, '');
    
    // Return empty if no numbers
    if (numbers.length === 0) return '';
    
    // Limit to maximum 14 digits (CNPJ length)
    const limitedNumbers = numbers.slice(0, 14);
    
    // Apply CNPJ mask: XX.XXX.XXX/XXXX-XX
    let formatted = limitedNumbers;
    
    if (limitedNumbers.length > 2) {
      formatted = limitedNumbers.slice(0, 2) + '.' + limitedNumbers.slice(2);
    }
    if (limitedNumbers.length > 5) {
      formatted = limitedNumbers.slice(0, 2) + '.' + limitedNumbers.slice(2, 5) + '.' + limitedNumbers.slice(5);
    }
    if (limitedNumbers.length > 8) {
      formatted = limitedNumbers.slice(0, 2) + '.' + limitedNumbers.slice(2, 5) + '.' + limitedNumbers.slice(5, 8) + '/' + limitedNumbers.slice(8);
    }
    if (limitedNumbers.length > 12) {
      formatted = limitedNumbers.slice(0, 2) + '.' + limitedNumbers.slice(2, 5) + '.' + limitedNumbers.slice(5, 8) + '/' + limitedNumbers.slice(8, 12) + '-' + limitedNumbers.slice(12);
    }
    
    return formatted;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // If input starts with digit or dot - treat as pure CNPJ and format
    if (/^[\d.]/.test(value)) {
      setInput(formatCNPJ(value));
      return;
    }
    
    // For free text, ensure total digits don't exceed 14
    setInput(normalizeDigits(value));
  };

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
      
      // Apply the same formatting logic as manual input
      if (/^[\d.]/.test(transcript)) {
        // Starts with digit or dot - treat as pure CNPJ and format
        setInput(formatCNPJ(transcript));
      } else {
        // Free text - ensure total digits don't exceed 14
        setInput(normalizeDigits(transcript));
      }
      
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
            onChange={handleInputChange}
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
          Reconhecimento de voz não disponível neste navegador. Use Chrome, Edge ou Safari.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Forneça o CNPJ para buscar os dados completos na Receita Federal. Exemplo: "12.345.678/0001-90" ou "Fornecedor ABC, CNPJ 12.345.678/0001-90"
      </p>
    </div>
  );
}
