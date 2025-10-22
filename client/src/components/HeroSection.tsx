import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import dashboardImage from "@assets/generated_images/Opaque_white_background_dashboard_mockup_c2870e32.png";
import companyLogo from "@assets/image_1761138279350.png";

export default function HeroSection() {
  return (
    <section id="para-voce" className="w-full px-4 py-12 md:px-6 md:py-20 lg:px-8 lg:py-32">
      <div className="container mx-auto">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col gap-4">
              <img 
                src={companyLogo} 
                alt="SyncTime Logo" 
                className="w-96 h-auto mb-6"
                data-testid="img-company-logo"
              />
              <h1 className="font-semibold tracking-tight text-3xl md:text-4xl lg:text-5xl leading-tight">
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

            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="flex flex-col gap-2 p-5 rounded-xl bg-gradient-to-br from-card to-muted/30 border border-border/50 shadow-sm hover-elevate">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                  ✓
                </div>
                <span className="text-base font-semibold text-foreground">Sem Cartão</span>
                <span className="text-sm text-muted-foreground">Para experimentar</span>
              </div>
              <div className="flex flex-col gap-2 p-5 rounded-xl bg-gradient-to-br from-card to-muted/30 border border-border/50 shadow-sm hover-elevate">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  18
                </div>
                <span className="text-base font-semibold text-foreground">Anos</span>
                <span className="text-sm text-muted-foreground">No mercado</span>
              </div>
              <div className="flex flex-col gap-2 p-5 rounded-xl bg-gradient-to-br from-card to-muted/30 border border-border/50 shadow-sm hover-elevate">
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">
                  97%
                </div>
                <span className="text-base font-semibold text-foreground">Aprovação</span>
                <span className="text-sm text-muted-foreground">Dos usuários</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src={dashboardImage}
              alt="Dashboard Financeiro"
              className="w-full h-auto"
              data-testid="img-dashboard-devices"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
