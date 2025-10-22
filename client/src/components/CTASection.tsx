import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section id="planos" className="w-full bg-gradient-to-r from-primary to-blue-600 px-4 py-16 md:px-6 md:py-24">
      <div className="container mx-auto">
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col gap-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              Pronto para transformar suas finanças?
            </h2>
            <p className="text-lg text-white/90 md:text-xl">
              Junte-se a milhares de pessoas e empresas que já organizam suas
              finanças com inteligência e simplicidade.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              variant="secondary"
              className="group bg-white text-primary hover:bg-white/90"
              data-testid="button-cta-start"
            >
              Começar Agora
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white bg-transparent text-white hover:bg-white/10"
              data-testid="button-cta-plans"
            >
              Ver Planos
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 pt-4 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>7 dias grátis</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Suporte em português</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
