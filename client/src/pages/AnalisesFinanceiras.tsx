import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Sparkles,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  Lightbulb,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
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
} from "recharts";

// Hierarchical account node interface
interface AccountNode {
  id: string;
  code: string;
  name: string;
  depth: number;
  total: number;
  percentOfParent: number;
  percentOfRoot: number;
  hasChildren: boolean;
  children?: AccountNode[];
}

export default function AnalisesFinanceiras() {
  const { toast } = useToast();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [aiInsights, setAIInsights] = useState<any[]>([]);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("mensal");
  const [regime, setRegime] = useState<'caixa' | 'competencia'>('caixa');

  const activeCompanyId = localStorage.getItem('fincontrol_selected_company_id') || '';

  // Auto-collapse sidebar on mount (like Lancamentos)
  useEffect(() => {
    const sidebar = document.querySelector('[data-sidebar="sidebar"]');
    if (sidebar) {
      const collapseButton = document.querySelector('[data-testid="button-sidebar-toggle"]') as HTMLButtonElement;
      if (collapseButton && !sidebar.hasAttribute('data-state')) {
        collapseButton.click();
      }
    }
  }, []);

  useEffect(() => {
    setAIInsights([]);
  }, [selectedMonth, selectedYear, activeCompanyId]);

  // Fetch hierarchical DRE
  const { data: dreHierarchical, isLoading: isLoadingDRE } = useQuery({
    queryKey: ['/api/analytics/dre-hierarchical', activeCompanyId, selectedMonth, selectedYear, regime],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics/dre-hierarchical?companyId=${activeCompanyId}&month=${selectedMonth}&year=${selectedYear}&regime=${regime}`
      );
      if (!response.ok) throw new Error('Failed to fetch hierarchical DRE');
      return response.json();
    },
    enabled: !!activeCompanyId,
  });

  // Fetch yearly evolution
  const { data: yearlyEvolution, isLoading: isLoadingYearly } = useQuery({
    queryKey: ['/api/analytics/yearly-evolution', activeCompanyId, selectedYear, regime],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics/yearly-evolution?companyId=${activeCompanyId}&year=${selectedYear}&regime=${regime}`
      );
      if (!response.ok) throw new Error('Failed to fetch yearly evolution');
      return response.json();
    },
    enabled: !!activeCompanyId,
  });

  // AI Insights mutation
  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/analytics/ai-insights', {
        companyId: activeCompanyId,
        month: selectedMonth,
        year: selectedYear,
      });
    },
    onSuccess: (data) => {
      setAIInsights(data.insights || []);
      toast({
        title: "Insights gerados com sucesso",
        description: "A análise foi concluída.",
      });
    },
    onError: (err) => {
      toast({
        title: "Erro ao gerar insights",
        description: (err as Error).message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingDRE || isLoadingYearly;

  const months = [
    { value: 1, label: "Janeiro" }, { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" }, { value: 4, label: "Abril" },
    { value: 5, label: "Maio" }, { value: 6, label: "Junho" },
    { value: 7, label: "Julho" }, { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" }, { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" }, { value: 12, label: "Dezembro" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const renderHierarchicalRow = (account: AccountNode, type: 'revenue' | 'expense') => {
    const isExpanded = expandedAccounts.has(account.id);
    const hasChildren = account.hasChildren;
    const indent = account.depth * 24;
    const colorClass = type === 'revenue' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300';

    return (
      <div key={account.id} className="border-b border-border/40 last:border-0">
        <div
          className={`flex items-center py-2 px-3 hover:bg-muted/50 transition-colors ${hasChildren ? 'cursor-pointer' : ''}`}
          onClick={() => hasChildren && toggleAccount(account.id)}
          style={{ paddingLeft: `${indent + 12}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              )
            ) : (
              <div className="w-4 flex-shrink-0" />
            )}
            <span className={`text-xs font-mono text-muted-foreground flex-shrink-0`}>
              {account.code}
            </span>
            <span className={`text-sm truncate ${account.depth === 0 ? 'font-bold' : 'font-medium'}`}>
              {account.name}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className={`text-sm font-semibold ${colorClass} w-32 text-right`}>
              R$ {account.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-muted-foreground w-16 text-right">
              {account.percentOfRoot.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground w-16 text-right">
              {account.percentOfParent.toFixed(1)}%
            </span>
          </div>
        </div>
        {hasChildren && isExpanded && account.children && (
          <div>
            {account.children.map(child => renderHierarchicalRow(child, type))}
          </div>
        )}
      </div>
    );
  };

  // Prepare pie chart data (top 5 expense categories)
  // Get first-level children (depth 1) or if root has children, use those
  const getExpenseCategories = (): any[] => {
    if (!dreHierarchical?.expenses) return [];
    
    // Collect all first-level expense categories (children of root)
    const categories: any[] = [];
    dreHierarchical.expenses.forEach((rootAccount: AccountNode) => {
      if (rootAccount.children) {
        rootAccount.children.forEach((child: AccountNode) => {
          categories.push({
            name: child.name,
            value: child.total,
          });
        });
      } else if (rootAccount.total > 0) {
        // If no children, use the account itself
        categories.push({
          name: rootAccount.name,
          value: rootAccount.total,
        });
      }
    });
    
    return categories
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };
  
  const pieChartData = getExpenseCategories();

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16'];

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-full mx-auto space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight" data-testid="text-page-title">
              Análises Financeiras
            </h1>
            <p className="text-muted-foreground text-xs" data-testid="text-page-subtitle">
              DRE hierárquico, evolução anual e insights inteligentes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-[130px]" data-testid="select-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[90px]" data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="h-6 w-px bg-border" />
            
            <Select value={regime} onValueChange={(v: 'caixa' | 'competencia') => setRegime(v)}>
              <SelectTrigger className="w-[140px]" data-testid="select-regime">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="caixa">Regime de Caixa</SelectItem>
                <SelectItem value="competencia">Competência</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
            <TabsTrigger value="acumulado">Acumulado (em breve)</TabsTrigger>
          </TabsList>

          <TabsContent value="mensal" className="space-y-0">
            {/* Two Column Layout: 50% charts, 50% table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* LEFT COLUMN: Charts & Cards */}
              <div className="space-y-4">
                {/* Compact Cards with Month Indicator */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-3 border-t-2 border-t-green-500">
                    <div className="flex items-center justify-between mb-1">
                      <div className="p-1.5 rounded bg-green-100 dark:bg-green-950">
                        <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        {months.find(m => m.value === selectedMonth)?.label.slice(0, 3)}/{selectedYear}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-0.5">Receitas</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      R$ {(dreHierarchical?.totalRevenues || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </Card>

                  <Card className="p-3 border-t-2 border-t-red-500">
                    <div className="flex items-center justify-between mb-1">
                      <div className="p-1.5 rounded bg-red-100 dark:bg-red-950">
                        <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        {months.find(m => m.value === selectedMonth)?.label.slice(0, 3)}/{selectedYear}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-0.5">Despesas</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-300">
                      R$ {(dreHierarchical?.totalExpenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </Card>

                  <Card className="p-3 border-t-2 border-t-blue-500">
                    <div className="flex items-center justify-between mb-1">
                      <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-950">
                        <DollarSign className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        {months.find(m => m.value === selectedMonth)?.label.slice(0, 3)}/{selectedYear}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-0.5">Lucro</p>
                    <p className={`text-lg font-bold ${(dreHierarchical?.netResult || 0) >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                      R$ {(dreHierarchical?.netResult || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </Card>
                </div>

                {/* Line Chart - Yearly Evolution */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3">Evolução Anual {selectedYear}</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={yearlyEvolution?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="monthName"
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
                      <Line type="monotone" dataKey="revenues" stroke="#22c55e" name="Receitas" strokeWidth={2} />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Despesas" strokeWidth={2} />
                      <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Lucro" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                {/* Pie Chart - Expense Composition */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3">Composição das Despesas</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                        formatter={(value: any) => `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                {/* AI Insights */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Insights Inteligentes
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      data-testid="button-generate-insights"
                      onClick={() => generateInsightsMutation.mutate()}
                      disabled={generateInsightsMutation.isPending}
                    >
                      {generateInsightsMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {generateInsightsMutation.isPending ? 'Gerando...' : 'Gerar'}
                    </Button>
                  </div>
                  {aiInsights.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {aiInsights.map((insight: any, index: number) => {
                        const Icon = insight.type === 'warning' ? AlertCircle
                          : insight.type === 'success' ? CheckCircle
                          : insight.type === 'tip' ? Lightbulb
                          : Info;
                        
                        const colorClass = insight.type === 'warning' ? 'text-red-600 dark:text-red-400'
                          : insight.type === 'success' ? 'text-green-600 dark:text-green-400'
                          : insight.type === 'tip' ? 'text-amber-600 dark:text-amber-400'
                          : 'text-blue-600 dark:text-blue-400';
                        
                        const bgClass = insight.type === 'warning' ? 'bg-red-50 dark:bg-red-950/20'
                          : insight.type === 'success' ? 'bg-green-50 dark:bg-green-950/20'
                          : insight.type === 'tip' ? 'bg-amber-50 dark:bg-amber-950/20'
                          : 'bg-blue-50 dark:bg-blue-950/20';
                        
                        return (
                          <div key={index} className={`p-2 rounded-md ${bgClass}`}>
                            <div className="flex items-start gap-2">
                              <Icon className={`h-4 w-4 ${colorClass} mt-0.5 flex-shrink-0`} />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-xs mb-0.5">{insight.title}</h4>
                                <p className="text-xs text-muted-foreground">{insight.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Sparkles className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">
                        Clique em "Gerar" para obter insights inteligentes
                      </p>
                    </div>
                  )}
                </Card>
              </div>

              {/* RIGHT COLUMN: Hierarchical Table */}
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3">DRE Hierárquico Detalhado</h3>
                  
                  {/* Table Header */}
                  <div className="flex items-center gap-4 py-2 px-3 bg-muted/50 rounded-md mb-2 text-xs font-semibold text-muted-foreground">
                    <div className="flex-1">Conta</div>
                    <div className="w-32 text-right">Valor</div>
                    <div className="w-16 text-right">% Total</div>
                    <div className="w-16 text-right">% Pai</div>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {/* Revenues Section */}
                    <div>
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-md mb-1">
                        <span className="text-sm font-bold text-green-700 dark:text-green-300">
                          RECEITAS
                        </span>
                        <span className="text-sm font-bold text-green-700 dark:text-green-300">
                          R$ {(dreHierarchical?.totalRevenues || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {dreHierarchical?.revenues?.map((account: AccountNode) => 
                        renderHierarchicalRow(account, 'revenue')
                      )}
                    </div>

                    {/* Expenses Section */}
                    <div>
                      <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded-md mb-1">
                        <span className="text-sm font-bold text-red-700 dark:text-red-300">
                          DESPESAS
                        </span>
                        <span className="text-sm font-bold text-red-700 dark:text-red-300">
                          R$ {(dreHierarchical?.totalExpenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {dreHierarchical?.expenses?.map((account: AccountNode) => 
                        renderHierarchicalRow(account, 'expense')
                      )}
                    </div>

                    {/* Net Result */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border-t-2 border-blue-500">
                      <span className="text-sm font-bold">RESULTADO LÍQUIDO</span>
                      <span className={`text-lg font-bold ${(dreHierarchical?.netResult || 0) >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                        R$ {(dreHierarchical?.netResult || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="acumulado">
            <Card className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Análise Acumulada</h3>
              <p className="text-sm text-muted-foreground">
                Em breve: análise horizontal com comparação entre períodos
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
