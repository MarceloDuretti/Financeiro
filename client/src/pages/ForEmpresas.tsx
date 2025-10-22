import { Building2, Users, TrendingUp, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ForEmpresas() {
  const benefits = [
    {
      icon: Building2,
      title: "Gestão Empresarial",
      description: "Controle completo das finanças da sua empresa",
    },
    {
      icon: Users,
      title: "Multi-Usuários",
      description: "Permissões personalizadas para sua equipe",
    },
    {
      icon: TrendingUp,
      title: "Análise Avançada",
      description: "Relatórios detalhados para decisões estratégicas",
    },
    {
      icon: Shield,
      title: "Segurança Enterprise",
      description: "Proteção de dados de nível corporativo",
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-semibold">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
