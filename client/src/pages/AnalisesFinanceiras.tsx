import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Percent,
  Target,
  Sparkles,
  ArrowLeft,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  Lightbulb,
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function AnalisesFinanceiras() {
  const { toast } = useToast();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [aiInsights, setAIInsights] = useState<any[]>([]);

  // Get active company from localStorage
  const activeCompanyId = localStorage.getItem('activeCompanyId') || '';

  // Clear AI insights when period changes
  useEffect(() => {
    setAIInsights([]);
  }, [selectedMonth, selectedYear, activeCompanyId]);

  // Fetch indicators
  const { data: indicators, isLoading: isLoadingIndicators } = useQuery({
    queryKey: ['/api/analytics/indicators', activeCompanyId, selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics/indicators?companyId=${activeCompanyId}&month=${selectedMonth}&year=${selectedYear}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch indicators');
      }
      return response.json();
    },
    enabled: !!activeCompanyId,
  });

  // Fetch DRE
  const { data: dre, isLoading: isLoadingDRE } = useQuery({
    queryKey: ['/api/analytics/dre', activeCompanyId, selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics/dre?companyId=${activeCompanyId}&month=${selectedMonth}&year=${selectedYear}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch DRE');
      }
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

  const isLoading = isLoadingIndicators || isLoadingDRE;

  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/plano-de-contas">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
                  Análises Financeiras
                </h1>
                <p className="text-muted-foreground text-xs" data-testid="text-page-subtitle">
                  DRE, indicadores e insights inteligentes
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[140px]" data-testid="select-month">
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
              <SelectTrigger className="w-[100px]" data-testid="select-year">
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
        </div>

        {/* Indicadores Principais */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Indicadores Principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Receitas */}
            <Card className="p-4 border-t-2 border-t-green-500">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-md bg-green-100 dark:bg-green-950">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                {indicators?.growth?.revenues !== undefined && (
                  <Badge 
                    variant="outline" 
                    className={indicators.growth.revenues >= 0 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-red-600 dark:text-red-400"}
                  >
                    {indicators.growth.revenues >= 0 ? '+' : ''}{indicators.growth.revenues.toFixed(1)}%
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="text-2xl font-bold">
                  R$ {indicators?.current?.revenues?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </p>
                <p className="text-xs text-muted-foreground">vs mês anterior</p>
              </div>
            </Card>

            {/* Despesas */}
            <Card className="p-4 border-t-2 border-t-red-500">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-md bg-red-100 dark:bg-red-950">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                {indicators?.growth?.expenses !== undefined && (
                  <Badge 
                    variant="outline" 
                    className={indicators.growth.expenses >= 0 
                      ? "text-red-600 dark:text-red-400" 
                      : "text-green-600 dark:text-green-400"}
                  >
                    {indicators.growth.expenses >= 0 ? '+' : ''}{indicators.growth.expenses.toFixed(1)}%
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-2xl font-bold">
                  R$ {indicators?.current?.expenses?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </p>
                <p className="text-xs text-muted-foreground">vs mês anterior</p>
              </div>
            </Card>

            {/* Lucro */}
            <Card className="p-4 border-t-2 border-t-blue-500">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-950">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                {indicators?.growth?.profit !== undefined && (
                  <Badge 
                    variant="outline" 
                    className={indicators.growth.profit >= 0 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-red-600 dark:text-red-400"}
                  >
                    {indicators.growth.profit >= 0 ? '+' : ''}{indicators.growth.profit.toFixed(1)}%
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                <p className="text-2xl font-bold">
                  R$ {indicators?.current?.profit?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </p>
                <p className="text-xs text-muted-foreground">vs mês anterior</p>
              </div>
            </Card>

            {/* Margem Bruta */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-md bg-violet-100 dark:bg-violet-950">
                  <Percent className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Margem Bruta</p>
                <p className="text-2xl font-bold">
                  {indicators?.indicators?.grossMargin?.toFixed(1) || '0,0'}%
                </p>
                <p className="text-xs text-muted-foreground">Receita - Custo</p>
              </div>
            </Card>

            {/* Margem Líquida */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-950">
                  <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Margem Líquida</p>
                <p className="text-2xl font-bold">
                  {indicators?.indicators?.netMargin?.toFixed(1) || '0,0'}%
                </p>
                <p className="text-xs text-muted-foreground">Lucro / Receita</p>
              </div>
            </Card>

            {/* ROI */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-md bg-cyan-100 dark:bg-cyan-950">
                  <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ROI</p>
                <p className="text-2xl font-bold">
                  {indicators?.indicators?.roi?.toFixed(1) || '0,0'}%
                </p>
                <p className="text-xs text-muted-foreground">Retorno sobre investimento</p>
              </div>
            </Card>
          </div>
        </div>

        {/* DRE */}
        <div>
          <h2 className="text-lg font-semibold mb-3">DRE - Demonstração do Resultado</h2>
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-semibold">Receitas Operacionais</span>
                </div>
                <span className="font-bold text-green-700 dark:text-green-300">
                  R$ {dre?.totalRevenues?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </span>
              </div>

              {dre?.revenues && dre.revenues.length > 0 && (
                <div className="pl-6 space-y-2">
                  {dre.revenues.map((account: any) => (
                    <div key={account.accountId} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {account.accountCode} - {account.accountName}
                      </span>
                      <span className="font-medium">
                        R$ {account.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="font-semibold">Despesas Operacionais</span>
                </div>
                <span className="font-bold text-red-700 dark:text-red-300">
                  R$ {dre?.totalExpenses?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </span>
              </div>

              {dre?.expenses && dre.expenses.length > 0 && (
                <div className="pl-6 space-y-2">
                  {dre.expenses.map((account: any) => (
                    <div key={account.accountId} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {account.accountCode} - {account.accountName}
                      </span>
                      <span className="font-medium">
                        R$ {account.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-3 flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-lg">Resultado Líquido</span>
                </div>
                <span className={`font-bold text-2xl ${
                  (dre?.netResult || 0) >= 0 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  R$ {dre?.netResult?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* IA Insights */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Insights Inteligentes
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              data-testid="button-generate-insights"
              onClick={() => generateInsightsMutation.mutate()}
              disabled={generateInsightsMutation.isPending}
            >
              {generateInsightsMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {generateInsightsMutation.isPending ? 'Gerando...' : 'Gerar Análise'}
            </Button>
          </div>
          <Card className="p-4">
            {aiInsights.length > 0 ? (
              <div className="space-y-3">
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
                    <div key={index} className={`p-3 rounded-md ${bgClass}`}>
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 ${colorClass} mt-0.5`} />
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  Clique em "Gerar Análise" para obter insights inteligentes sobre sua situação financeira
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
