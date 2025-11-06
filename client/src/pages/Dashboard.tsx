import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PiggyBank,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  BarChart4,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { Separator } from "@/components/ui/separator";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import type { Transaction, CostCenter, ChartAccount } from "@shared/schema";
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// Alertas mockados (em desenvolvimento)
const alerts = [
  { type: "warning", message: "Despesa com Marketing 15% acima da meta", time: "Há 2h" },
  { type: "success", message: "Meta de receita do mês atingida", time: "Há 5h" },
  { type: "info", message: "Novo cliente premium adicionado", time: "Há 1 dia" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card p-3 shadow-xl">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold">
              {typeof entry.value === 'number' && entry.value > 1000 
                ? `R$ ${(entry.value / 1000).toFixed(1)}k`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const selectedCompanyId = localStorage.getItem('fincontrol_selected_company_id');

  // Fetch data
  const { data: transactions = [], isLoading: loadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', { companyId: selectedCompanyId }],
    enabled: !!selectedCompanyId,
  });

  const { data: costCenters = [], isLoading: loadingCostCenters } = useQuery<CostCenter[]>({
    queryKey: ['/api/cost-centers'],
  });

  const { data: chartAccounts = [], isLoading: loadingChartAccounts } = useQuery<ChartAccount[]>({
    queryKey: ['/api/chart-of-accounts'],
  });

  const isLoading = loadingTransactions || loadingCostCenters || loadingChartAccounts;

  // Process data
  const currentMonth = new Date();
  const currentMonthStart = startOfMonth(currentMonth);
  const currentMonthEnd = endOfMonth(currentMonth);

  // Filter current month transactions
  const currentMonthTransactions = transactions.filter(t => {
    const dueDate = new Date(t.dueDate);
    return dueDate >= currentMonthStart && dueDate <= currentMonthEnd;
  });

  // Calculate KPIs
  const totalRevenues = currentMonthTransactions
    .filter(t => t.type === 'revenue')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const profitMargin = totalRevenues > 0 ? ((totalRevenues - totalExpenses) / totalRevenues) * 100 : 0;

  // Calculate average receivable days (issueDate to paidDate for paid transactions)
  const paidRevenues = transactions.filter(t => t.type === 'revenue' && t.status === 'paid' && t.paidDate && t.issueDate);
  const averageReceivableDays = paidRevenues.length > 0
    ? paidRevenues.reduce((sum, t) => {
        const days = differenceInDays(new Date(t.paidDate!), new Date(t.issueDate!));
        return sum + days;
      }, 0) / paidRevenues.length
    : 0;

  // Generate last 6 months data (including current month)
  const last6Months: Array<{ date: Date; shortName: string; fullName: string }> = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(currentMonth, i);
    last6Months.push({
      date: monthDate,
      shortName: format(monthDate, 'MMM', { locale: ptBR }),
      fullName: format(monthDate, 'MMMM', { locale: ptBR }),
    });
  }

  // Generate monthly data (last 6 months)
  const monthlyData = last6Months.map(({ date, shortName }) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthTransactions = transactions.filter(t => {
      const dueDate = new Date(t.dueDate);
      return dueDate >= monthStart && dueDate <= monthEnd;
    });

    const receitas = monthTransactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const despesas = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      month: shortName,
      receitas,
      despesas,
      lucro: receitas - despesas,
    };
  });

  // Category distribution (expenses by chart account)
  const categoryMap = new Map<string, number>();
  currentMonthTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const account = chartAccounts.find(a => a.id === t.chartAccountId);
      if (account) {
        const current = categoryMap.get(account.name) || 0;
        categoryMap.set(account.name, current + parseFloat(t.amount));
      }
    });

  const categoryData = Array.from(categoryMap.entries()).length > 0
    ? Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5) // Top 5
        .map((item, index) => ({
          name: item.name,
          value: item.value,
          percentage: totalExpenses > 0 ? Math.round((item.value / totalExpenses) * 100) : 0,
          color: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][index],
        }))
    : [];

  // Cost Center Performance heatmap (expenses by cost center per month with distributions)
  const departmentHeatmap: any[] = [];
  
  // Check if any transaction has cost center distributions
  const transactionsWithCostCenter = transactions.filter(t => 
    (t as any).costCenterDistributions?.length > 0 || t.costCenterId
  );
  
  // Only show heatmap if there are transactions with cost centers
  if (transactionsWithCostCenter.length > 0 && costCenters.length > 0) {
    costCenters.slice(0, 4).forEach(cc => {
      const deptData: any = { dept: cc.name, months: [] };
      
      last6Months.forEach(({ date }) => {
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        
        const monthExpenses = transactions
          .filter(t => {
            const dueDate = new Date(t.dueDate);
            return t.type === 'expense' && dueDate >= monthStart && dueDate <= monthEnd;
          })
          .reduce((sum, t) => {
            const amount = parseFloat(t.amount);
            const distributions = (t as any).costCenterDistributions;
            
            // Check if transaction has cost center distributions
            if (distributions && distributions.length > 0) {
              const distribution = distributions.find((d: any) => d.costCenterId === cc.id);
              if (distribution) {
                return sum + (amount * distribution.percentage / 100);
              }
            } else if (t.costCenterId === cc.id) {
              // Fallback to single cost center (100%)
              return sum + amount;
            }
            
            return sum;
          }, 0);
        
        deptData.months.push(Math.round(monthExpenses / 1000)); // In thousands
      });
      
      departmentHeatmap.push(deptData);
    });
  }

  // Recent transactions
  const recentTransactions = transactions
    .slice()
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 10)
    .map(t => {
      const account = chartAccounts.find(a => a.id === t.chartAccountId);
      return {
        id: t.id,
        description: t.title,
        category: account?.name || 'Sem categoria',
        date: format(new Date(t.dueDate), 'dd/MM/yyyy'),
        amount: parseFloat(t.amount) * (t.type === 'expense' ? -1 : 1),
        type: t.type === 'revenue' ? 'receita' : 'despesa',
        status: t.status === 'paid' ? 'confirmed' : 'pending',
      };
    });

  // KPIs data
  const kpis = [
    {
      title: "Receita Recorrente Mensal",
      description: "Receitas mensais fixas",
      value: "R$ 0,00",
      change: "+0%",
      trend: "up" as const,
      icon: DollarSign,
      gradient: "from-blue-500 to-blue-600",
      disabled: true, // Em desenvolvimento
      tooltipMessage: "Em desenvolvimento - Requer identificação de receitas recorrentes",
    },
    {
      title: "Margem de Lucro",
      description: "Lucratividade operacional",
      value: `${profitMargin.toFixed(1)}%`,
      change: profitMargin > 25 ? "+positivo" : "neutro",
      trend: profitMargin > 25 ? "up" as const : "down" as const,
      icon: BarChart4,
      gradient: "from-blue-500 to-indigo-600",
      disabled: false,
    },
    {
      title: "Tempo de Caixa",
      description: "Meses de reserva financeira",
      value: "0 meses",
      change: "+0 meses",
      trend: "up" as const,
      icon: Clock,
      gradient: "from-purple-500 to-violet-600",
      disabled: true, // Em desenvolvimento
      tooltipMessage: "Em desenvolvimento - Requer saldo de contas e projeção de queima",
    },
    {
      title: "Prazo Médio de Recebimento",
      description: "Dias para receber vendas",
      value: averageReceivableDays > 0 ? `${Math.round(averageReceivableDays)} dias` : "0 dias",
      change: averageReceivableDays < 30 ? "bom" : "médio",
      trend: averageReceivableDays < 30 ? "up" as const : "down" as const,
      icon: Activity,
      gradient: "from-cyan-500 to-teal-600",
      disabled: false,
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-3 md:p-4 lg:p-6 bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-light tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Análise
          </h1>
          <p className="text-muted-foreground text-sm">
            Visão estratégica em tempo real da sua operação financeira
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-filter">
            <Calendar className="h-4 w-4 mr-2" />
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </Button>
          <Button size="sm" data-testid="button-export">
            <BarChart4 className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Hero KPIs Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const isDisabled = 'disabled' in kpi && kpi.disabled;
          
          const cardContent = (
            <Card
              key={index}
              className={`group/kpi relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20 shadow-lg transition-all duration-300 ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover-elevate'
              }`}
              data-testid={`card-kpi-${index}`}
            >
              <div
                className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${kpi.gradient} opacity-10 blur-3xl`}
              />
              <CardHeader className="pb-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <CardDescription className="text-xs font-medium">
                        {kpi.title}
                      </CardDescription>
                      {isDisabled && (
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <CardTitle className="text-lg font-semibold tracking-tight tabular-nums truncate">{kpi.value}</CardTitle>
                  </div>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.gradient} shadow-lg transition-all duration-300 ${!isDisabled && 'group-hover/kpi:scale-110 group-hover/kpi:shadow-2xl'}`}>
                    <Icon className={`h-3.5 w-3.5 text-white transition-transform duration-300 ${!isDisabled && 'group-hover/kpi:scale-110'}`} strokeWidth={2.5} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{kpi.change}</span>
                </div>
              </CardContent>
            </Card>
          );

          if (isDisabled && 'tooltipMessage' in kpi) {
            return (
              <UITooltip key={index}>
                <TooltipTrigger asChild>
                  {cardContent}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{kpi.tooltipMessage}</p>
                </TooltipContent>
              </UITooltip>
            );
          }

          return cardContent;
        })}
      </div>

      {/* Receitas x Despesas e Performance por Departamento */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Modern Line Chart - Revenue & Expenses */}
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg font-bold">Receitas e Despesas</CardTitle>
                <CardDescription className="text-xs">
                  Evolução mensal dos últimos 6 meses
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Crescimento Positivo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="receitas" stroke="#22c55e" name="Receitas" strokeWidth={2} />
                  <Line type="monotone" dataKey="despesas" stroke="#ef4444" name="Despesas" strokeWidth={2} />
                  <Line type="monotone" dataKey="lucro" stroke="#3b82f6" name="Lucro" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[220px] text-center">
                <BarChart4 className="h-12 w-12 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
                <p className="text-xs text-muted-foreground/70">Adicione transações para ver a evolução</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance por Centro de Custo */}
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Performance por Centro de Custo</CardTitle>
            <CardDescription className="text-xs">Despesas rateadas por centro nos últimos 6 meses (em milhares R$)</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            {departmentHeatmap.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="px-1 py-1.5 text-left text-xs font-semibold text-muted-foreground border-b border-muted/30">
                          Centro
                        </th>
                        {last6Months.map(({ shortName }) => (
                          <th
                            key={shortName}
                            className="px-1 py-1.5 text-center text-xs font-semibold text-muted-foreground border-b border-muted/30"
                          >
                            {shortName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Precompute min/max once for all cells
                        const allValues = departmentHeatmap.flatMap(d => d.months);
                        const minValue = Math.min(...allValues);
                        const maxValue = Math.max(...allValues);
                        const range = maxValue - minValue;
                        
                        const getHeatColor = (value: number) => {
                          // Handle case where all values are equal (max === min)
                          if (range === 0 || value === 0) {
                            return { bg: "bg-blue-500/50", text: "text-white" };
                          }
                          
                          const normalized = (value - minValue) / range;
                          
                          if (normalized >= 0.8) return { bg: "bg-red-500/90", text: "text-white" };
                          if (normalized >= 0.6) return { bg: "bg-orange-500/80", text: "text-white" };
                          if (normalized >= 0.4) return { bg: "bg-amber-500/70", text: "text-white" };
                          if (normalized >= 0.2) return { bg: "bg-emerald-500/60", text: "text-white" };
                          return { bg: "bg-blue-500/50", text: "text-white" };
                        };

                        return departmentHeatmap.map((dept, deptIdx) => {
                          return (
                            <tr key={deptIdx} className="border-b border-muted/20 last:border-0">
                              <td className="px-1 py-0.5 text-xs font-medium">{dept.dept}</td>
                              {dept.months.map((value: number, idx: number) => {
                                const colors = getHeatColor(value);
                                return (
                                  <td
                                    key={idx}
                                    className="p-0"
                                    data-testid={`heatmap-${dept.dept}-${idx}`}
                                  >
                                    <div
                                      className={`${colors.bg} ${colors.text} rounded-md m-0.5 p-1.5 text-center text-xs font-bold transition-all hover:scale-105 hover:shadow-md cursor-default`}
                                      title={`${dept.dept} - ${last6Months[idx].fullName}: R$ ${value}k`}
                                    >
                                      {value}k
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
                
                {/* Compact Color Legend */}
                <div className="mt-2 flex items-center justify-center gap-2 text-[10px]">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-sm bg-blue-500/50" />
                    <span className="text-muted-foreground">Baixo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-sm bg-amber-500/70" />
                    <span className="text-muted-foreground">Médio</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-sm bg-red-500/90" />
                    <span className="text-muted-foreground">Alto</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center px-4">
                <BarChart4 className="h-12 w-12 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma transação com centro de custo</p>
                <p className="text-xs text-muted-foreground/70">Associe centros de custo às transações para visualizar a performance</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Despesas e Alertas & Insights */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Category Breakdown */}
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Distribuição de Despesas</CardTitle>
            <CardDescription className="text-xs">Análise por categoria operacional</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  {categoryData.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: cat.color }} />
                      <div className="flex items-baseline gap-1 min-w-0">
                        <span className="text-[10px] font-medium truncate">{cat.name}</span>
                        <span className="text-[10px] text-muted-foreground">{cat.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[180px] text-center">
                <PiggyBank className="h-12 w-12 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma despesa registrada</p>
                <p className="text-xs text-muted-foreground/70">Adicione transações para visualizar a distribuição</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts Feed */}
        <UITooltip>
          <TooltipTrigger asChild>
            <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg opacity-50 cursor-not-allowed">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-lg font-bold">Alertas & Insights</CardTitle>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription className="text-xs">Notificações importantes do sistema</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-col gap-2">
                  {alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 p-2 rounded-lg border ${
                        alert.type === "warning"
                          ? "bg-orange-500/5 border-orange-500/20"
                          : alert.type === "success"
                          ? "bg-green-500/5 border-green-500/20"
                          : "bg-blue-500/5 border-blue-500/20"
                      }`}
                      data-testid={`alert-${idx}`}
                    >
                      {alert.type === "warning" ? (
                        <AlertCircle className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                      ) : alert.type === "success" ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <Activity className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <p className="text-xs font-medium leading-tight">{alert.message}</p>
                        <span className="text-xs text-muted-foreground">{alert.time}</span>
                      </div>
                    </div>
                  ))}
                  
                  <Separator className="my-1.5" />
                  
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Ver Todos os Alertas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Em desenvolvimento - Requer regras de negócio para alertas automáticos</p>
          </TooltipContent>
        </UITooltip>
      </div>

      {/* Últimas Transações */}
      <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Últimas Transações</CardTitle>
            <CardDescription className="text-xs">Movimentações recentes com status de confirmação</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            {recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-muted/30">
                      <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Descrição</th>
                      <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Categoria</th>
                      <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Data</th>
                      <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Valor</th>
                      <th className="pb-2 text-center text-xs font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-muted/20 last:border-0 hover-elevate transition-colors"
                        data-testid={`row-transaction-${transaction.id}`}
                      >
                        <td className="py-2.5 text-sm font-medium">{transaction.description}</td>
                        <td className="py-2.5">
                          <Badge variant="secondary" className="text-xs">
                            {transaction.category}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {transaction.date}
                          </div>
                        </td>
                        <td
                          className={`py-2.5 text-right text-sm font-bold ${
                            transaction.type === "receita" ? "text-blue-600" : "text-red-600"
                          }`}
                        >
                          {transaction.type === "receita" ? "+" : ""}
                          {transaction.amount.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                        <td className="py-2.5 text-center">
                          {transaction.status === "confirmed" ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Confirmado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <Wallet className="h-12 w-12 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma transação encontrada</p>
                <p className="text-xs text-muted-foreground/70">Adicione suas primeiras transações para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
