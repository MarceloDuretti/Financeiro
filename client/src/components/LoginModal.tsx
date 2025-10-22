import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login submitted");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-login">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <span className="text-lg font-bold text-primary-foreground">F</span>
              </div>
              <DialogTitle>Acessar Conta</DialogTitle>
            </div>
          </div>
          <DialogDescription>
            Entre com suas credenciais para acessar sua conta
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              required
              data-testid="input-email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              data-testid="input-password"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-input"
                data-testid="checkbox-remember"
              />
              <span className="text-muted-foreground">Lembrar de mim</span>
            </label>
            <a
              href="#esqueci-senha"
              className="text-primary hover:underline"
              data-testid="link-forgot-password"
            >
              Esqueci minha senha
            </a>
          </div>

          <Button type="submit" className="w-full" data-testid="button-login-submit">
            Entrar
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <a href="#criar-conta" className="text-primary hover:underline" data-testid="link-signup">
              Criar conta grátis
            </a>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
