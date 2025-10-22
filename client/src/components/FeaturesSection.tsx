import {
  TrendingUp,
  Building2,
  PieChart,
  Activity,
  RefreshCw,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: TrendingUp,
    title: "Controle de Receitas e Despesas",
    description:
      "Categorize automaticamente suas movimentações financeiras com precisão. Acompanhe cada centavo com clareza total.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Building2,
    title: "Multi-Contas e Bancos",
    description:
      "Centralize todas as suas contas bancárias e cartões em um único painel. Visualização completa do seu patrimônio.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Activity,
    title: "Fluxo de Caixa",
    description:
      "Monitore entradas e saídas em tempo real. Projeções precisas para planejar seu futuro financeiro com segurança.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: BarChart3,
    title: "DRE - Demonstrativo de Resultados",
    description:
      "Relatórios contábeis profissionais gerados automaticamente. Visão estratégica da saúde financeira do negócio.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: RefreshCw,
    title: "Conciliação Bancária Automática",
    description:
      "Importação e reconciliação automática de extratos. Elimine erros e economize horas de trabalho manual.",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    icon: PieChart,
    title: "Relatórios e Gráficos",
    description:
      "Dashboards inteligentes com análises visuais poderosas. Transforme dados complexos em decisões claras.",
    gradient: "from-teal-500 to-green-500",
  },
];

export default function FeaturesSection() {
  return (
    <section id="recursos" className="w-full bg-muted/30 px-4 py-16 md:px-6 md:py-24 lg:px-8">
      <div className="container mx-auto">
        <div className="mb-12 flex flex-col gap-4 text-center md:mb-16">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
            Recursos que fazem a diferença
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Tudo que você precisa para ter controle total das suas finanças
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 p-8 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                data-testid={`card-feature-${index}`}
              >
                <div 
                  className={`absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition-all duration-300 group-hover:scale-150 group-hover:opacity-20 ${feature.gradient}`}
                />
                
                <div className="relative flex flex-col gap-5">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}>
                    <Icon className="h-8 w-8 text-white" strokeWidth={2.5} />
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xl font-semibold leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium text-primary transition-all group-hover:gap-3">
                    <span>Explorar</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

                <div 
                  className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r transition-all duration-300 group-hover:w-full ${feature.gradient}`}
                />
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
