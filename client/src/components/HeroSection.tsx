import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import dashboardImage from "@assets/generated_images/Laptop_and_phone_dashboard_mockup_9ae29bca.png";

export default function HeroSection() {
  return (
    <section id="para-voce" className="w-full px-4 py-12 md:px-6 md:py-20 lg:px-8 lg:py-32">
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex flex-col gap-6 md:gap-8 items-center">
            <div className="flex flex-col gap-4 items-center">
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl text-center">
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Organize suas finanças
                </span>{" "}
                de vez
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl max-w-2xl text-center">
                Simplifique o controle de receitas e despesas. Transforme sua rotina
                financeira pessoal e empresarial com clareza e inteligência.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="group" data-testid="button-cta-primary">
                Experimente Grátis por 7 Dias
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" data-testid="button-cta-secondary">
                Ver Planos
              </Button>
            </div>

            <div className="flex flex-wrap gap-8 pt-4 text-sm justify-center">
              <div className="flex flex-col gap-1 items-center">
                <span className="font-semibold text-foreground">Sem Cartão</span>
                <span className="text-muted-foreground">Para experimentar</span>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <span className="font-semibold text-foreground">18 Anos</span>
                <span className="text-muted-foreground">No mercado</span>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <span className="font-semibold text-foreground">97%</span>
                <span className="text-muted-foreground">Aprovação</span>
              </div>
            </div>

            <div className="w-full mt-8 md:mt-12">
              <img
                src={dashboardImage}
                alt="Dashboard Financeiro em Laptop e Celular"
                className="w-full h-auto max-w-4xl mx-auto"
                data-testid="img-dashboard-devices"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
