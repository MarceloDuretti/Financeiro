import {
  TrendingUp,
  Building2,
  PieChart,
  Target,
  Shield,
  Smartphone,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: TrendingUp,
    title: "Controle de Receitas e Despesas",
    description:
      "Categorize e acompanhe todas as suas movimentações financeiras com precisão e facilidade.",
  },
  {
    icon: Building2,
    title: "Multi-Contas e Bancos",
    description:
      "Integre todas as suas contas bancárias e visualize seu patrimônio em um único lugar.",
  },
  {
    icon: PieChart,
    title: "Relatórios e Gráficos",
    description:
      "Transforme dados em insights visuais para decisões financeiras mais inteligentes.",
  },
  {
    icon: Target,
    title: "Metas Financeiras",
    description:
      "Defina objetivos e acompanhe seu progresso rumo à realização dos seus sonhos.",
  },
  {
    icon: Shield,
    title: "Segurança de Dados",
    description:
      "Criptografia de ponta e backups automáticos para proteger suas informações.",
  },
  {
    icon: Smartphone,
    title: "Acesso Multi-Plataforma",
    description:
      "Use em qualquer dispositivo - web, iOS ou Android - com sincronização automática.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="recursos" className="w-full bg-muted/30 px-4 py-16 md:px-6 md:py-24 lg:px-8">
      <div className="container mx-auto">
        <div className="mb-12 flex flex-col gap-4 text-center md:mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Recursos que fazem a diferença
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Tudo que você precisa para ter controle total das suas finanças
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
                data-testid={`card-feature-${index}`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <a
                    href="#"
                    className="inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    data-testid={`link-feature-${index}`}
                  >
                    Saiba Mais
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
