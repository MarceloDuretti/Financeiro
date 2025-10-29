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
  Target as TargetIcon,
  Activity,
  BarChart4,
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

const kpis = [
  {
    title: "Receita Recorrente Mensal",
    description: "Receitas mensais fixas",
    value: "R$ 45.231",
    change: "+20.1%",
    trend: "up",
    icon: DollarSign,
    gradient: "from-blue-500 to-blue-600",
    sparklineData: [32, 35, 38, 36, 40, 45],
    target: 50000,
    current: 45231,
  },
  {
    title: "Margem de Lucro",
    description: "Lucratividade operacional",
    value: "28.2%",
    change: "+3.5%",
    trend: "up",
    icon: BarChart4,
    gradient: "from-blue-500 to-indigo-600",
    sparklineData: [22, 24, 26, 25, 27, 28],
    target: 30,
    current: 28.2,
  },
  {
    title: "Tempo de Caixa",
    description: "Meses de reserva financeira",
    value: "18 meses",
    change: "+2 meses",
    trend: "up",
    icon: Clock,
    gradient: "from-purple-500 to-violet-600",
    sparklineData: [14, 15, 15, 16, 17, 18],
    target: 24,
    current: 18,
  },
  {
    title: "Prazo Médio de Recebimento",
    description: "Dias para receber vendas",
    value: "32 dias",
    change: "-5 dias",
    trend: "down",
    icon: Activity,
    gradient: "from-cyan-500 to-teal-600",
    sparklineData: [42, 40, 38, 35, 34, 32],
    target: 30,
    current: 32,
  },
];

const monthlyData = [
  { month: "Jan", receitas: 35000, despesas: 28000, forecast: 36000, margem: 20 },
  { month: "Fev", receitas: 38000, despesas: 30000, forecast: 39000, margem: 21 },
  { month: "Mar", receitas: 42000, despesas: 31000, forecast: 43000, margem: 26 },
  { month: "Abr", receitas: 39000, despesas: 29000, forecast: 41000, margem: 26 },
  { month: "Mai", receitas: 44000, despesas: 32000, forecast: 45000, margem: 27 },
  { month: "Jun", receitas: 45231, despesas: 32450, forecast: 47000, margem: 28 },
  { month: "Jul", receitas: null, despesas: null, forecast: 48000, margem: null },
  { month: "Ago", receitas: null, despesas: null, forecast: 50000, margem: null },
];

const categoryData = [
  { name: "Pessoal", value: 15000, color: "#3b82f6", percentage: 46 },
  { name: "Operacional", value: 8500, color: "#8b5cf6", percentage: 26 },
  { name: "Marketing", value: 5200, color: "#06b6d4", percentage: 16 },
  { name: "Tecnologia", value: 2500, color: "#10b981", percentage: 8 },
  { name: "Outros", value: 1250, color: "#f59e0b", percentage: 4 },
];

const departmentHeatmap = [
  { dept: "Vendas", jan: 12, fev: 15, mar: 18, abr: 16, mai: 20, jun: 22 },
  { dept: "Marketing", jan: 8, fev: 9, mar: 11, abr: 10, mai: 12, jun: 14 },
  { dept: "Operações", jan: 20, fev: 22, mar: 24, abr: 23, mai: 26, jun: 28 },
  { dept: "TI", jan: 6, fev: 7, mar: 8, abr: 7, mai: 9, jun: 10 },
];

const alerts = [
  { type: "warning", message: "Despesa com Marketing 15% acima da meta", time: "Há 2h" },
  { type: "success", message: "Meta de receita do mês atingida", time: "Há 5h" },
  { type: "info", message: "Novo cliente premium adicionado", time: "Há 1 dia" },
];

const recentTransactions = [
  { id: 1, description: "Pagamento Cliente A", category: "Receita", date: "15/06/2025", amount: 8500, type: "receita", status: "confirmed" },
  { id: 2, description: "Folha de Pagamento", category: "Pessoal", date: "10/06/2025", amount: -15000, type: "despesa", status: "confirmed" },
  { id: 3, description: "Campanha Google Ads", category: "Marketing", date: "08/06/2025", amount: -2450, type: "despesa", status: "pending" },
  { id: 4, description: "Serviços Consultoria", category: "Receita", date: "05/06/2025", amount: 12000, type: "receita", status: "confirmed" },
  { id: 5, description: "Infraestrutura Cloud", category: "Tecnologia", date: "03/06/2025", amount: -890, type: "despesa", status: "confirmed" },
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
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Análise
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão estratégica em tempo real da sua operação financeira
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" data-testid="button-filter">
              <Calendar className="h-4 w-4 mr-2" />
              Junho 2025
            </Button>
            <Button size="sm" data-testid="button-export">
              <BarChart4 className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Hero KPIs Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const progressPercent = (kpi.current / kpi.target) * 100;
          
          return (
            <Card
              key={index}
              className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20 shadow-lg hover-elevate transition-all duration-300"
              data-testid={`card-kpi-${index}`}
            >
              <div
                className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${kpi.gradient} opacity-10 blur-3xl`}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <CardDescription className="text-xs font-medium">
                      {kpi.title}
                    </CardDescription>
                    <CardTitle className="text-xl font-bold truncate">{kpi.value}</CardTitle>
                  </div>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.gradient} shadow-lg`}>
                    <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  {kpi.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs font-semibold ${kpi.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                    {kpi.change}
                  </span>
                  <span className="text-xs text-muted-foreground">vs meta</span>
                </div>
                
                {/* Mini Sparkline */}
                <div className="h-6 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kpi.sparklineData.map((v, i) => ({ value: v }))}>
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={kpi.gradient.includes('green') ? '#10b981' : kpi.gradient.includes('blue') ? '#3b82f6' : kpi.gradient.includes('orange') ? '#f59e0b' : kpi.gradient.includes('purple') ? '#8b5cf6' : kpi.gradient.includes('cyan') ? '#06b6d4' : '#ec4899'} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={kpi.gradient.includes('green') ? '#10b981' : kpi.gradient.includes('blue') ? '#3b82f6' : kpi.gradient.includes('orange') ? '#f59e0b' : kpi.gradient.includes('purple') ? '#8b5cf6' : kpi.gradient.includes('cyan') ? '#06b6d4' : '#ec4899'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={kpi.gradient.includes('green') ? '#10b981' : kpi.gradient.includes('blue') ? '#3b82f6' : kpi.gradient.includes('orange') ? '#f59e0b' : kpi.gradient.includes('purple') ? '#8b5cf6' : kpi.gradient.includes('cyan') ? '#06b6d4' : '#ec4899'}
                        fill={`url(#gradient-${index})`}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Advanced Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Modern Line Chart - Revenue & Expenses */}
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg col-span-full">
          <CardHeader>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-xl font-bold">Receitas e Despesas</CardTitle>
                <CardDescription className="mt-1">
                  Evolução mensal dos últimos 6 meses
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Crescimento Positivo
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyData}>
                <defs>
                  <linearGradient id="lineGradientReceitas" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                  <linearGradient id="lineGradientDespesas" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#f87171" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  className="text-xs" 
                  stroke="hsl(var(--muted-foreground))" 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  className="text-xs" 
                  stroke="hsl(var(--muted-foreground))" 
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: "16px" }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="receitas"
                  name="Receitas"
                  stroke="url(#lineGradientReceitas)"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", r: 5, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="despesas"
                  name="Despesas"
                  stroke="url(#lineGradientDespesas)"
                  strokeWidth={3}
                  dot={{ fill: "#ef4444", r: 5, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Distribuição de Despesas</CardTitle>
            <CardDescription>Análise por categoria operacional</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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
            <div className="mt-4 grid grid-cols-2 gap-3">
              {categoryData.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: cat.color }} />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">{cat.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Performance Heatmap */}
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Performance por Departamento</CardTitle>
            <CardDescription>Gastos mensais em milhares (R$) - Heatmap visual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-xs font-semibold text-muted-foreground border-b border-muted/30">
                      Departamento
                    </th>
                    {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"].map((month) => (
                      <th
                        key={month}
                        className="p-2 text-center text-xs font-semibold text-muted-foreground border-b border-muted/30"
                      >
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Precompute min/max once for all cells
                    const allValues = departmentHeatmap.flatMap(d => [d.jan, d.fev, d.mar, d.abr, d.mai, d.jun]);
                    const minValue = Math.min(...allValues);
                    const maxValue = Math.max(...allValues);
                    const range = maxValue - minValue;
                    
                    const getHeatColor = (value: number) => {
                      // Handle case where all values are equal (max === min)
                      if (range === 0) {
                        return { bg: "bg-amber-500/70", text: "text-white" };
                      }
                      
                      const normalized = (value - minValue) / range;
                      
                      if (normalized >= 0.8) return { bg: "bg-red-500/90", text: "text-white" };
                      if (normalized >= 0.6) return { bg: "bg-orange-500/80", text: "text-white" };
                      if (normalized >= 0.4) return { bg: "bg-amber-500/70", text: "text-white" };
                      if (normalized >= 0.2) return { bg: "bg-emerald-500/60", text: "text-white" };
                      return { bg: "bg-blue-500/50", text: "text-white" };
                    };

                    return departmentHeatmap.map((dept, deptIdx) => {
                      const months = [dept.jan, dept.fev, dept.mar, dept.abr, dept.mai, dept.jun];
                      
                      return (
                        <tr key={deptIdx} className="border-b border-muted/20 last:border-0">
                          <td className="p-2 text-sm font-medium">{dept.dept}</td>
                          {months.map((value, idx) => {
                            const colors = getHeatColor(value);
                            return (
                              <td
                                key={idx}
                                className="p-0"
                                data-testid={`heatmap-${dept.dept}-${idx}`}
                              >
                                <div
                                  className={`${colors.bg} ${colors.text} rounded-md m-1 p-2.5 text-center text-sm font-bold transition-all hover:scale-105 hover:shadow-md cursor-default`}
                                  title={`${dept.dept} - ${["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"][idx]}: R$ ${value}k`}
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
            
            {/* Color Legend */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs">
              <span className="text-muted-foreground font-medium">Escala de gastos:</span>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-blue-500/50" />
                <span className="text-muted-foreground">Muito Baixo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-emerald-500/60" />
                <span className="text-muted-foreground">Baixo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-amber-500/70" />
                <span className="text-muted-foreground">Médio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-orange-500/80" />
                <span className="text-muted-foreground">Alto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-red-500/90" />
                <span className="text-muted-foreground">Muito Alto</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Workspace */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transactions Table */}
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Últimas Transações</CardTitle>
            <CardDescription>Movimentações recentes com status de confirmação</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Alerts Feed */}
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Alertas & Insights</CardTitle>
            <CardDescription>Notificações importantes do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    alert.type === "warning"
                      ? "bg-orange-500/5 border-orange-500/20"
                      : alert.type === "success"
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-blue-500/5 border-blue-500/20"
                  }`}
                  data-testid={`alert-${idx}`}
                >
                  {alert.type === "warning" ? (
                    <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  ) : alert.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <Activity className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{alert.message}</p>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                </div>
              ))}
              
              <Separator className="my-2" />
              
              <Button variant="outline" size="sm" className="w-full">
                Ver Todos os Alertas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
