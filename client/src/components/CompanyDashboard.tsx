import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardData {
  today: {
    revenue: number;
    expense: number;
    balance: number;
  };
  month: {
    revenue: number;
    expense: number;
    balance: number;
  };
  year: {
    revenue: number;
    expense: number;
    balance: number;
  };
  cashFlow: Array<{
    date: string;
    revenue: number;
    expense: number;
    balance: number;
  }>;
}

interface CompanyDashboardProps {
  companyId: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
}

export function CompanyDashboard({ companyId }: CompanyDashboardProps) {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/companies", companyId, "dashboard"],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}/dashboard`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!data) return null;

  const KPICard = ({
    title,
    icon: Icon,
    data: cardData,
    accentColor,
  }: {
    title: string;
    icon: any;
    data: { revenue: number; expense: number; balance: number };
    accentColor: string;
  }) => (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${accentColor}`} />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {title}
            </h3>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">Receitas</span>
            <span className="text-xs font-semibold text-blue-600">{formatCurrency(cardData.revenue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">Despesas</span>
            <span className="text-xs font-semibold text-red-600">{formatCurrency(cardData.expense)}</span>
          </div>
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-medium text-muted-foreground">Saldo</span>
              <span
                className={`text-sm font-bold ${
                  cardData.balance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(cardData.balance)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 py-4 border-t">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-primary">Painel Executivo</h3>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPICard
          title="Hoje"
          icon={Wallet}
          data={data.today}
          accentColor="text-primary"
        />
        <KPICard
          title="Mês"
          icon={TrendingUp}
          data={data.month}
          accentColor="text-primary"
        />
        <KPICard
          title="Ano"
          icon={TrendingDown}
          data={data.year}
          accentColor="text-primary"
        />
      </div>

      {/* Cash Flow Chart */}
      {data.cashFlow && data.cashFlow.length > 0 && (
        <Card className="hover-elevate">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Fluxo de Caixa (Últimos 30 Dias)
              </h4>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.cashFlow}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 10 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-lg">
                            <p className="text-[10px] text-muted-foreground mb-2">
                              {formatDate(payload[0].payload.date)}
                            </p>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] text-blue-600">Receitas</span>
                                <span className="text-xs font-bold text-blue-600">
                                  {formatCurrency(payload[0].payload.revenue)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] text-red-600">Despesas</span>
                                <span className="text-xs font-bold text-red-600">
                                  {formatCurrency(payload[0].payload.expense)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4 pt-1 border-t">
                                <span className="text-[10px] font-medium">Saldo</span>
                                <span
                                  className={`text-xs font-bold ${
                                    payload[0].payload.balance >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {formatCurrency(payload[0].payload.balance)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
