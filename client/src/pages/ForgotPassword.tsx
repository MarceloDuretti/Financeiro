import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import headerLogo from "@assets/image_1761139734810.png";
import { useState } from "react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ForgotPasswordData) => {
    // TODO: Implement password reset logic
    console.log("Password reset requested for:", data.email);
    
    toast({
      title: "Email enviado!",
      description: "Se este email estiver cadastrado, você receberá instruções para redefinir sua senha.",
    });
    
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="p-4 md:p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2" data-testid="link-back-home">
              <img 
                src={headerLogo} 
                alt="SyncTime Logo" 
                className="h-8 w-auto"
                data-testid="img-logo"
              />
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = "/login"}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao login
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-card border shadow-lg rounded-2xl p-8 md:p-10">
            {!submitted ? (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-title">
                    Esqueceu sua senha?
                  </h1>
                  <p className="text-muted-foreground" data-testid="text-subtitle">
                    Digite seu email e enviaremos instruções para redefinir sua senha
                  </p>
                </div>

                {/* Form */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="seu@email.com"
                              autoComplete="email"
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      data-testid="button-submit"
                    >
                      Enviar instruções
                    </Button>
                  </form>
                </Form>
              </>
            ) : (
              <>
                {/* Success Message */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                    <Mail className="h-8 w-8 text-green-600 dark:text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2" data-testid="text-success-title">
                    Verifique seu email
                  </h2>
                  <p className="text-muted-foreground mb-6" data-testid="text-success-message">
                    Se este email estiver cadastrado, você receberá instruções para redefinir sua senha em alguns minutos.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = "/login"}
                    data-testid="button-back-to-login"
                  >
                    Voltar ao login
                  </Button>
                </div>
              </>
            )}

            {/* Footer */}
            {!submitted && (
              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Lembrou sua senha?{" "}
                  <a
                    href="/login"
                    className="text-primary font-medium hover:underline"
                    data-testid="link-login"
                  >
                    Fazer login
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
