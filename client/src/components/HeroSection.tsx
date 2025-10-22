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

            <div className="grid grid-cols-3 gap-12 pt-10">
              <div className="relative flex flex-col gap-3 pl-4 group cursor-default">
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                <div className="text-5xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
                  ✓
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-semibold text-foreground">Sem Cartão</span>
                  <span className="text-sm text-muted-foreground">Para experimentar</span>
                </div>
                <div className="absolute bottom-0 left-4 h-0.5 w-12 bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-300 group-hover:w-[calc(100%-1rem)]"></div>
              </div>
              
              <div className="relative flex flex-col gap-3 pl-4 group cursor-default">
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-xl">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-blue-600 rounded-full"></div>
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
                  18
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-semibold text-foreground">Anos</span>
                  <span className="text-sm text-muted-foreground">No mercado</span>
                </div>
                <div className="absolute bottom-0 left-4 h-0.5 w-12 bg-gradient-to-r from-primary to-blue-600 transition-all duration-300 group-hover:w-[calc(100%-1rem)]"></div>
              </div>
              
              <div className="relative flex flex-col gap-3 pl-4 group cursor-default">
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-xl">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-600 rounded-full"></div>
                <div className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
                  97%
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-semibold text-foreground">Aprovação</span>
                  <span className="text-sm text-muted-foreground">Dos usuários</span>
                </div>
                <div className="absolute bottom-0 left-4 h-0.5 w-12 bg-gradient-to-r from-orange-500 to-amber-600 transition-all duration-300 group-hover:w-[calc(100%-1rem)]"></div>
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
