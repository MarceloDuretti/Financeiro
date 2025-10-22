import { ArrowRight, ShieldCheck, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import dashboardImage from "@assets/generated_images/Opaque_white_background_dashboard_mockup_c2870e32.png";
import companyLogo from "@assets/image_1761141856415.png";

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
                className="w-80 h-auto mb-6"
                data-testid="img-company-logo"
              />
              <h1 className="font-semibold tracking-tight text-2xl md:text-3xl lg:text-4xl leading-tight">
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

            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="relative flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">Sem Cartão</span>
                  <span className="text-xs text-muted-foreground">Para experimentar</span>
                </div>
              </div>
              
              <div className="relative flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Award className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold text-foreground">18</span>
                  <span className="text-xs text-muted-foreground">Anos no mercado</span>
                </div>
              </div>
              
              <div className="relative flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold text-foreground">97%</span>
                  <span className="text-xs text-muted-foreground">Aprovação dos usuários</span>
                </div>
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
