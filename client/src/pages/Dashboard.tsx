import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PiggyBank,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
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
} from "recharts";

const metrics = [
  {
    title: "Receitas",
    value: "R$ 45.231,00",
    change: "+20.1%",
    trend: "up",
    icon: ArrowUpCircle,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    title: "Despesas",
    value: "R$ 32.450,00",
    change: "+12.5%",
    trend: "up",
    icon: ArrowDownCircle,
    gradient: "from-red-500 to-rose-500",
  },
  {
    title: "Saldo",
    value: "R$ 12.781,00",
    change: "+8.2%",
    trend: "up",
    icon: Wallet,
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    title: "Investimentos",
    value: "R$ 28.940,00",
    change: "+15.3%",
    trend: "up",
    icon: PiggyBank,
    gradient: "from-purple-500 to-violet-500",
  },
];

const monthlyData = [
  { month: "Jan", receitas: 35000, despesas: 28000 },
  { month: "Fev", receitas: 38000, despesas: 30000 },
  { month: "Mar", receitas: 42000, despesas: 31000 },
  { month: "Abr", receitas: 39000, despesas: 29000 },
  { month: "Mai", receitas: 44000, despesas: 32000 },
  { month: "Jun", receitas: 45231, despesas: 32450 },
];

const categoryData = [
  { name: "Alimentação", value: 8500, color: "#3b82f6" },
  { name: "Transporte", value: 5200, color: "#8b5cf6" },
  { name: "Moradia", value: 12000, color: "#06b6d4" },
  { name: "Lazer", value: 3800, color: "#10b981" },
  { name: "Saúde", value: 2950, color: "#f59e0b" },
];

const recentTransactions = [
  { id: 1, description: "Salário", category: "Receita", date: "15/06/2025", amount: 8500, type: "receita" },
  { id: 2, description: "Aluguel", category: "Moradia", date: "10/06/2025", amount: -2800, type: "despesa" },
  { id: 3, description: "Supermercado", category: "Alimentação", date: "08/06/2025", amount: -450, type: "despesa" },
  { id: 4, description: "Freelance", category: "Receita", date: "05/06/2025", amount: 1200, type: "receita" },
  { id: 5, description: "Academia", category: "Saúde", date: "03/06/2025", amount: -150, type: "despesa" },
];

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das suas finanças em tempo real
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card
              key={index}
              className="relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 shadow-md hover-elevate"
              data-testid={`card-metric-${index}`}
            >
              <div
                className={`absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br opacity-10 blur-2xl ${metric.gradient}`}
              />
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="text-2xl font-semibold">{metric.value}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {metric.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={metric.trend === "up" ? "text-green-500" : "text-red-500"}>
                      {metric.change}
                    </span>
                    <span className="text-muted-foreground">vs mês anterior</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Line Chart */}
        <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Evolução Mensal</CardTitle>
            <p className="text-sm text-muted-foreground">
              Receitas vs Despesas nos últimos 6 meses
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="receitas"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorReceitas)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorDespesas)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Despesas por Categoria</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribuição dos gastos do mês
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Últimas Transações</CardTitle>
          <p className="text-sm text-muted-foreground">
            Movimentações mais recentes da sua conta
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Descrição
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Categoria
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Data
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b last:border-0 hover-elevate"
                    data-testid={`row-transaction-${transaction.id}`}
                  >
                    <td className="py-4 text-sm font-medium">{transaction.description}</td>
                    <td className="py-4 text-sm text-muted-foreground">
                      {transaction.category}
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {transaction.date}
                      </div>
                    </td>
                    <td
                      className={`py-4 text-right text-sm font-semibold ${
                        transaction.type === "receita" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {transaction.type === "receita" ? "+" : ""}
                      {transaction.amount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
