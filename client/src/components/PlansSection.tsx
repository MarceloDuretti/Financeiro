import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plans = [
  {
    name: "Pessoal",
    description: "Para controle financeiro individual",
    price: "17,75",
    priceMonthly: "24,90",
    popular: false,
    features: [
      "150 lançamentos/mês",
      "Controle de receitas e despesas",
      "Até 3 contas bancárias",
      "Relatórios básicos",
      "Aplicativo mobile",
      "Suporte por e-mail",
    ],
  },
  {
    name: "Profissional",
    description: "Para freelancers e MEI",
    price: "52,67",
    priceMonthly: "69,90",
    popular: true,
    features: [
      "500 lançamentos/mês",
      "Todas as funcionalidades do Pessoal",
      "Contas bancárias ilimitadas",
      "Relatórios avançados",
      "Metas financeiras",
      "Gestão de clientes",
      "Suporte prioritário",
      "Exportação de dados",
    ],
  },
  {
    name: "Empresarial",
    description: "Para pequenas e médias empresas",
    price: "124,58",
    priceMonthly: "159,90",
    popular: false,
    features: [
      "1.200 lançamentos/mês",
      "Todas as funcionalidades do Profissional",
      "Multi-usuários (até 5)",
      "Fluxo de caixa projetado",
      "Conciliação bancária",
      "API de integração",
      "Auditoria completa",
      "Suporte premium 24/7",
      "Gerente de conta dedicado",
    ],
  },
];

export default function PlansSection() {
  return (
    <section id="planos" className="w-full px-4 py-16 md:px-6 md:py-24 lg:px-8">
      <div className="container mx-auto">
        <div className="mb-12 flex flex-col gap-4 text-center md:mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Planos que cabem no seu bolso
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Escolha o plano ideal para suas necessidades. Todos com 7 dias grátis
            para testar.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative flex flex-col p-8 transition-all hover:-translate-y-2 hover:shadow-xl ${
                plan.popular ? "border-2 border-primary shadow-lg" : ""
              }`}
              data-testid={`card-plan-${index}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    <Sparkles className="h-3 w-3" />
                    Mais Popular
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 border-b pb-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">R$ {plan.price}</span>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">/mês</span>
                    <span className="text-xs text-muted-foreground">
                      (anual)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  ou R$ {plan.priceMonthly}/mês no plano mensal
                </p>
              </div>

              <div className="flex flex-1 flex-col gap-6 pt-6">
                <ul className="flex flex-col gap-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start gap-3 text-sm"
                    >
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    data-testid={`button-plan-${index}`}
                  >
                    Começar Agora
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Todos os planos incluem 7 dias de teste grátis. Sem cartão de crédito
            necessário.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Cancele quando quiser</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Dados seguros e criptografados</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Suporte em português</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
