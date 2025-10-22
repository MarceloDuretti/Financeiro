import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import dashboardImage from "@assets/generated_images/Dashboard_with_solid_white_background_61de71cf.png";

export default function HeroSection() {
  return (
    <section id="para-voce" className="w-full px-4 py-12 md:px-6 md:py-20 lg:px-8 lg:py-32">
      <div className="container mx-auto">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Organize suas finanças
                </span>{" "}
                de vez
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl max-w-2xl">
                Simplifique o controle de receitas e despesas. Transforme sua rotina
                financeira pessoal e empresarial com clareza e inteligência.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="group" data-testid="button-cta-primary">
                Experimente Grátis por 7 Dias
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" data-testid="button-cta-secondary">
                Ver Planos
              </Button>
            </div>

            <div className="flex flex-wrap gap-8 pt-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">Sem Cartão</span>
                <span className="text-muted-foreground">Para experimentar</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">18 Anos</span>
                <span className="text-muted-foreground">No mercado</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">97%</span>
                <span className="text-muted-foreground">Aprovação</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src={dashboardImage}
              alt="Dashboard Financeiro"
              className="w-full h-auto"
              data-testid="img-dashboard-mockup"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
