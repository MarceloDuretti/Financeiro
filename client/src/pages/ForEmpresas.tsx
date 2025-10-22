import { Building2, Users, TrendingUp, Shield, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ForEmpresas() {
  const benefits = [
    {
      icon: Building2,
      title: "Gestão Empresarial",
      description: "Controle completo das finanças com dashboards executivos e análises em tempo real.",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      icon: Users,
      title: "Multi-Usuários",
      description: "Permissões personalizadas por função. Controle total de acesso da sua equipe.",
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      icon: TrendingUp,
      title: "Análise Avançada",
      description: "Relatórios estratégicos e projeções inteligentes para decisões assertivas.",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: Shield,
      title: "Segurança Enterprise",
      description: "Proteção de nível corporativo com criptografia avançada e auditoria completa.",
      gradient: "from-orange-500 to-amber-500",
    },
  ];

  return (
    <section id="para-empresas" className="w-full bg-muted/30 px-4 py-16 md:px-6 md:py-24 lg:px-8">
      <div className="container mx-auto">
        <div className="mb-12 flex flex-col gap-4 text-center md:mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Soluções para Empresas
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Ferramentas profissionais para gestão financeira empresarial
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card 
                key={index} 
                className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 p-8 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div 
                  className={`absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition-all duration-300 group-hover:scale-150 group-hover:opacity-20 ${benefit.gradient}`}
                />
                
                <div className="relative flex flex-col items-center gap-5 text-center">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${benefit.gradient} shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}>
                    <Icon className="h-8 w-8 text-white" strokeWidth={2.5} />
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <h3 className="text-lg font-bold leading-tight">
                      {benefit.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-primary transition-all group-hover:gap-3">
                    <span>Saiba Mais</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

                <div 
                  className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r transition-all duration-300 group-hover:w-full ${benefit.gradient}`}
                />
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
