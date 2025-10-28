import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Search, 
  TrendingDown, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  LayoutGrid,
  List,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { format, startOfMonth, endOfMonth, getMonth, getYear, getDate, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Transaction } from "@shared/schema";
import { TransactionDialog } from "@/components/TransactionDialog";

const SELECTED_COMPANY_KEY = "fincontrol_selected_company_id";

const MONTHS = [
  { index: 0, short: "Jan", full: "Janeiro" },
  { index: 1, short: "Fev", full: "Fevereiro" },
  { index: 2, short: "Mar", full: "Março" },
  { index: 3, short: "Abr", full: "Abril" },
  { index: 4, short: "Mai", full: "Maio" },
  { index: 5, short: "Jun", full: "Junho" },
  { index: 6, short: "Jul", full: "Julho" },
  { index: 7, short: "Ago", full: "Agosto" },
  { index: 8, short: "Set", full: "Setembro" },
  { index: 9, short: "Out", full: "Outubro" },
  { index: 10, short: "Nov", full: "Novembro" },
  { index: 11, short: "Dez", full: "Dezembro" },
];

export default function Lancamentos() {
  const selectedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(now));
  const [selectedYear, setSelectedYear] = useState<number>(getYear(now));
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(() => {
    const saved = localStorage.getItem('fincontrol_transactions_view_mode');
    return (saved === 'list' ? 'list' : 'cards') as 'cards' | 'list';
  });
  const parentRef = useRef<HTMLDivElement>(null);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('fincontrol_transactions_view_mode', viewMode);
  }, [viewMode]);

  // Calculate date range from selected month/year
  const startDate = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth, 1);
    return format(startOfMonth(date), 'yyyy-MM-dd');
  }, [selectedMonth, selectedYear]);

  const endDate = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth, 1);
    return format(endOfMonth(date), 'yyyy-MM-dd');
  }, [selectedMonth, selectedYear]);

  // Navigation functions
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToPreviousYear = () => {
    setSelectedYear(selectedYear - 1);
  };

  const goToNextYear = () => {
    setSelectedYear(selectedYear + 1);
  };

  const goToToday = () => {
    setSelectedMonth(getMonth(now));
    setSelectedYear(getYear(now));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft' && e.ctrlKey) {
        e.preventDefault();
        goToPreviousYear();
      } else if (e.key === 'ArrowRight' && e.ctrlKey) {
        e.preventDefault();
        goToNextYear();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousMonth();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextMonth();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setSelectedMonth(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setSelectedMonth(11);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        goToToday();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMonth, selectedYear]);

  // Fetch transactions for selected month
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", { 
      companyId: selectedCompanyId,
      startDate, 
      endDate, 
      type: typeFilter === 'all' ? undefined : typeFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      query: searchQuery
    }],
    enabled: !!selectedCompanyId,
  });

  // Fetch all transactions for the year to show counts per month
  const yearStart = useMemo(() => format(new Date(selectedYear, 0, 1), 'yyyy-MM-dd'), [selectedYear]);
  const yearEnd = useMemo(() => format(new Date(selectedYear, 11, 31), 'yyyy-MM-dd'), [selectedYear]);

  const { data: yearTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", { 
      companyId: selectedCompanyId,
      startDate: yearStart, 
      endDate: yearEnd,
    }],
    enabled: !!selectedCompanyId,
  });

  // Fetch all transactions for the previous year for YoY comparison
  const previousYearStart = useMemo(() => format(new Date(selectedYear - 1, 0, 1), 'yyyy-MM-dd'), [selectedYear]);
  const previousYearEnd = useMemo(() => format(new Date(selectedYear - 1, 11, 31), 'yyyy-MM-dd'), [selectedYear]);

  const { data: previousYearTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", { 
      companyId: selectedCompanyId,
      startDate: previousYearStart, 
      endDate: previousYearEnd,
    }],
    enabled: !!selectedCompanyId,
  });

  // Calculate transaction count per month
  const transactionCountsByMonth = useMemo(() => {
    const counts: Record<number, number> = {};
    yearTransactions.forEach(t => {
      if (t.dueDate) {
        const month = getMonth(new Date(t.dueDate));
        counts[month] = (counts[month] || 0) + 1;
      }
    });
    return counts;
  }, [yearTransactions]);

  // Calculate transaction count per month for previous year
  const previousYearCountsByMonth = useMemo(() => {
    const counts: Record<number, number> = {};
    previousYearTransactions.forEach(t => {
      if (t.dueDate) {
        const month = getMonth(new Date(t.dueDate));
        counts[month] = (counts[month] || 0) + 1;
      }
    });
    return counts;
  }, [previousYearTransactions]);

  // Calculate YoY percentage change per month
  const yoyChangeByMonth = useMemo(() => {
    const changes: Record<number, number | null> = {};
    for (let i = 0; i < 12; i++) {
      const currentCount = transactionCountsByMonth[i] || 0;
      const previousCount = previousYearCountsByMonth[i] || 0;
      
      if (previousCount === 0) {
        changes[i] = currentCount > 0 ? 100 : null;
      } else {
        changes[i] = ((currentCount - previousCount) / previousCount) * 100;
      }
    }
    return changes;
  }, [transactionCountsByMonth, previousYearCountsByMonth]);

  // Calculate date range for previous month
  const previousMonthStart = useMemo(() => {
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    return format(startOfMonth(new Date(prevYear, prevMonth, 1)), 'yyyy-MM-dd');
  }, [selectedMonth, selectedYear]);

  const previousMonthEnd = useMemo(() => {
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    return format(endOfMonth(new Date(prevYear, prevMonth, 1)), 'yyyy-MM-dd');
  }, [selectedMonth, selectedYear]);

  // Fetch previous month transactions for comparison
  const { data: previousMonthTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", { 
      companyId: selectedCompanyId,
      startDate: previousMonthStart, 
      endDate: previousMonthEnd,
    }],
    enabled: !!selectedCompanyId,
  });

  // Calculate KPIs (exclude cancelled transactions)
  const kpis = {
    openExpenses: transactions
      .filter(t => t.type === 'expense' && t.status === 'pending')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0),
    openRevenues: transactions
      .filter(t => t.type === 'revenue' && t.status === 'pending')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0),
    overdue: transactions
      .filter(t => t.status === 'pending' && t.dueDate && new Date(t.dueDate) < new Date())
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0),
    result: transactions
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => {
        const amount = parseFloat(t.paidAmount || t.amount || '0');
        return sum + (t.type === 'revenue' ? amount : -amount);
      }, 0),
  };

  // Calculate previous month KPIs for comparison
  const previousKpis = {
    result: previousMonthTransactions
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => {
        const amount = parseFloat(t.paidAmount || t.amount || '0');
        return sum + (t.type === 'revenue' ? amount : -amount);
      }, 0),
  };

  // Calculate percentage change
  const resultChange = previousKpis.result !== 0 
    ? ((kpis.result - previousKpis.result) / Math.abs(previousKpis.result)) * 100 
    : kpis.result !== 0 ? 100 : 0;

  // Calculate monthly totals for percentage calculation
  const monthlyTotals = useMemo(() => {
    const totalRevenues = transactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    
    return { totalRevenues, totalExpenses };
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;
    if (statusFilter !== 'all' && transaction.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = transaction.title?.toLowerCase().includes(query);
      const matchesDescription = transaction.description?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDescription) return false;
    }
    return true;
  });

  // Group transactions by day of due date (with fallback for missing dates)
  const transactionsByDay = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    const noDueDateKey = 'no-date';
    
    filteredTransactions.forEach(transaction => {
      let key: string;
      
      if (transaction.dueDate && isValid(new Date(transaction.dueDate))) {
        const day = getDate(new Date(transaction.dueDate));
        key = `day-${day}`;
      } else {
        // Fallback for transactions without dueDate
        key = noDueDateKey;
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(transaction);
    });
    
    // Sort: numeric days first, then "no-date" section last
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (a === noDueDateKey) return 1;
      if (b === noDueDateKey) return -1;
      const dayA = parseInt(a.replace('day-', ''));
      const dayB = parseInt(b.replace('day-', ''));
      return dayA - dayB;
    });
    
    return sortedKeys.reduce((acc, key) => {
      acc[key] = grouped[key];
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [filteredTransactions]);

  // Fetch customers/suppliers for display
  const { data: customersSuppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers-suppliers", { companyId: selectedCompanyId }],
    enabled: !!selectedCompanyId,
  });

  // Fetch chart of accounts for display
  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ["/api/chart-of-accounts", { companyId: selectedCompanyId }],
    enabled: !!selectedCompanyId,
  });

  const handleCardClick = (transaction: Transaction) => {
    setDetailTransaction(transaction);
    setDetailSheetOpen(true);
  };

  if (!selectedCompanyId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Selecione uma empresa para gerenciar lançamentos
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generate year options (5 years back, 2 years forward)
  const yearOptions = useMemo(() => {
    const currentYear = getYear(now);
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  }, []);

  const isCurrentMonth = selectedMonth === getMonth(now) && selectedYear === getYear(now);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-3 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Lançamentos</h1>
            <p className="text-xs text-muted-foreground">
              {MONTHS[selectedMonth].full} de {selectedYear}
            </p>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={() => {
            setSelectedTransaction(null);
            setDialogOpen(true);
          }}
          data-testid="button-new-transaction"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo</span>
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Month Navigation Sidebar - Desktop Only */}
        <div className="hidden lg:flex flex-col w-32 border-r bg-background">
          {/* Year selector - compact */}
          <div className="p-2 border-b bg-muted/10">
            <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
              <SelectTrigger className="h-8 text-xs" data-testid="select-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1 mt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousYear}
                className="flex-1 h-7 text-xs px-1"
                data-testid="button-prev-year"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextYear}
                className="flex-1 h-7 text-xs px-1"
                data-testid="button-next-year"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Months vertical list - scrollable */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0">
            {MONTHS.map((month) => {
              const isSelected = selectedMonth === month.index;
              const isCurrent = getMonth(now) === month.index && getYear(now) === selectedYear;
              const count = transactionCountsByMonth[month.index] || 0;
              const yoyChange = yoyChangeByMonth[month.index];
              
              // Determine trend indicator
              const hasTrend = yoyChange !== null && yoyChange !== undefined;
              const displayYoy = hasTrend ? yoyChange : 0;
              const isPositive = hasTrend && yoyChange > 0;
              const isNegative = hasTrend && yoyChange < 0;
              const yoyColor = isPositive ? 'text-blue-600 dark:text-blue-500' : 
                               isNegative ? 'text-red-600 dark:text-red-500' : 
                               'text-muted-foreground';
              
              return (
                <div key={month.index} className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMonth(month.index)}
                    className={`w-full h-9 flex items-center justify-between px-3 transition-all duration-200 ${
                      !isSelected ? 'opacity-60 hover:opacity-100' : ''
                    }`}
                    data-testid={`button-month-${month.index}`}
                  >
                    <div className="flex items-center gap-1">
                      {isCurrent && !isSelected && (
                        <ChevronRight className="w-3 h-3 text-primary" />
                      )}
                      <span className={`font-semibold transition-all duration-200 ${
                        isSelected ? 'text-base text-primary' : 'text-sm'
                      }`}>
                        {month.short}
                      </span>
                    </div>
                    <div className={`flex items-center gap-0.5 font-medium transition-all duration-200 ${
                      isSelected ? 'text-xs' : 'text-[10px]'
                    } ${yoyColor}`}>
                      {displayYoy !== 0 && (
                        displayYoy > 0 ? (
                          <ArrowUp className={`${isSelected ? 'w-2.5 h-2.5' : 'w-2 h-2'}`} />
                        ) : (
                          <ArrowDown className={`${isSelected ? 'w-2.5 h-2.5' : 'w-2 h-2'}`} />
                        )
                      )}
                      <span>{Math.abs(displayYoy).toFixed(0)}%</span>
                    </div>
                  </Button>
                  {isSelected && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                  {month.index < 11 && (
                    <div className="h-px bg-border/50 mx-2" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Hoje button at bottom */}
          <div className="p-2 border-t">
            <Button
              variant={isCurrentMonth ? "default" : "outline"}
              size="sm"
              onClick={goToToday}
              className="w-full h-8 text-xs"
              data-testid="button-today"
            >
              Hoje
            </Button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Month Navigation - Horizontal Scroll */}
          <div className="lg:hidden border-b bg-muted/20">
            <div className="p-2 flex items-center gap-2 overflow-x-auto">
              <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                <SelectTrigger className="h-8 w-20 text-xs" data-testid="select-year-mobile">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousYear}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>

              {MONTHS.map((month) => {
                const isSelected = selectedMonth === month.index;
                const isCurrent = getMonth(now) === month.index && getYear(now) === selectedYear;
                const count = transactionCountsByMonth[month.index] || 0;
                const yoyChange = yoyChangeByMonth[month.index];
                const hasTrend = yoyChange !== null && yoyChange !== undefined;
                const displayYoy = hasTrend ? yoyChange : 0;
                const isPositive = hasTrend && yoyChange > 0;
                const isNegative = hasTrend && yoyChange < 0;
                const yoyColor = isPositive ? 'text-blue-600 dark:text-blue-500' : 
                                 isNegative ? 'text-red-600 dark:text-red-500' : 
                                 'text-muted-foreground';
                
                return (
                  <div key={month.index} className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMonth(month.index)}
                      className={`h-8 px-3 text-xs flex-shrink-0 flex items-center gap-2 ${
                        isCurrent && !isSelected ? 'border-primary border-2' : ''
                      } ${!isSelected ? 'opacity-60 hover:opacity-100' : ''}`}
                      data-testid={`button-month-mobile-${month.index}`}
                    >
                      <span className={`font-semibold transition-all duration-200 ${
                        isSelected ? 'text-sm text-primary' : 'text-xs'
                      }`}>
                        {month.short}
                      </span>
                      <div className={`flex items-center gap-0.5 font-medium transition-all duration-200 ${
                        isSelected ? 'text-xs' : 'text-[10px]'
                      } ${yoyColor}`}>
                        {displayYoy !== 0 && (
                          displayYoy > 0 ? (
                            <ArrowUp className={`${isSelected ? 'w-2.5 h-2.5' : 'w-2 h-2'}`} />
                          ) : (
                            <ArrowDown className={`${isSelected ? 'w-2.5 h-2.5' : 'w-2 h-2'}`} />
                          )
                        )}
                        <span>{Math.abs(displayYoy).toFixed(0)}%</span>
                      </div>
                    </Button>
                    {isSelected && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-b" />
                    )}
                  </div>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextYear}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>

              <Button
                variant={isCurrentMonth ? "default" : "outline"}
                size="sm"
                onClick={goToToday}
                className="h-8 px-2 text-xs flex-shrink-0"
              >
                Hoje
              </Button>
            </div>
          </div>

          {/* Compact KPI Cards */}
          <div className="p-2 border-b bg-muted/30">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {/* Open Expenses */}
              <Card className="border-l-2 border-l-destructive">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Despesas Abertas</p>
                    <TrendingDown className="w-3 h-3 text-destructive" />
                  </div>
                  <div className="text-base font-bold text-destructive">
                    R$ {kpis.openExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {transactions.filter(t => t.type === 'expense' && t.status === 'pending').length} lançamentos
                  </p>
                </CardContent>
              </Card>

              {/* Open Revenues */}
              <Card className="border-l-2 border-l-blue-600">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Receitas Abertas</p>
                    <TrendingUp className="w-3 h-3 text-blue-600" />
                  </div>
                  <div className="text-base font-bold text-blue-600">
                    R$ {kpis.openRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {transactions.filter(t => t.type === 'revenue' && t.status === 'pending').length} lançamentos
                  </p>
                </CardContent>
              </Card>

              {/* Overdue */}
              <Card className="border-l-2 border-l-orange-600">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Em Atraso</p>
                    <AlertCircle className="w-3 h-3 text-orange-600" />
                  </div>
                  <div className="text-base font-bold text-orange-600">
                    R$ {kpis.overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {transactions.filter(t => t.status === 'pending' && t.dueDate && new Date(t.dueDate) < new Date()).length} lançamentos
                  </p>
                </CardContent>
              </Card>

              {/* Result */}
              <Card className="border-l-2 border-l-primary">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Resultado</p>
                    <Calendar className="w-3 h-3 text-primary" />
                  </div>
                  <div className={`text-base font-bold ${kpis.result >= 0 ? 'text-blue-600' : 'text-destructive'}`}>
                    R$ {kpis.result.toLocaleString('pt-BR', { minimumFractionDigits: 2, signDisplay: 'always' })}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">
                      {transactions.filter(t => t.status === 'paid').length} pagos
                    </p>
                    {resultChange !== 0 && (
                      <div className={`flex items-center gap-0.5 text-[10px] font-medium ${
                        resultChange > 0 ? 'text-blue-600' : 'text-destructive'
                      }`}>
                        {resultChange > 0 ? (
                          <TrendingUp className="w-2.5 h-2.5" />
                        ) : (
                          <TrendingDown className="w-2.5 h-2.5" />
                        )}
                        <span>{Math.abs(resultChange).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Compact Filters */}
          <div className="p-2 border-b bg-muted/10">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                <Search className="w-3 h-3 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs"
                  data-testid="input-search-transaction"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[100px] h-8 text-xs" data-testid="select-type-filter">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                  <SelectItem value="revenue">Receitas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[100px] h-8 text-xs" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="h-8" data-testid="button-more-filters">
                <Filter className="w-3 h-3" />
              </Button>

              <div className="flex items-center gap-1 ml-auto">
                <Button 
                  variant={viewMode === 'cards' ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode('cards')}
                  data-testid="button-view-cards"
                >
                  <LayoutGrid className="w-3 h-3" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode('list')}
                  data-testid="button-view-list"
                >
                  <List className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Transactions List - Grid Layout Grouped by Day */}
          <div className="flex-1 overflow-auto p-3" ref={parentRef}>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                        ? "Nenhum lançamento encontrado com os filtros aplicados"
                        : "Nenhum lançamento cadastrado ainda"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(transactionsByDay).map(([dayKey, dayTransactions]) => {
                  const isNoDate = dayKey === 'no-date';
                  const day = isNoDate ? null : dayKey.replace('day-', '');
                  
                  return (
                    <div key={dayKey}>
                      {/* Day Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold text-muted-foreground">
                          {isNoDate ? 'Sem data de vencimento' : `Dia ${day} de ${MONTHS[selectedMonth].full}`}
                        </h2>
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">
                          {dayTransactions.length} {dayTransactions.length === 1 ? 'lançamento' : 'lançamentos'}
                        </span>
                      </div>

                    {viewMode === 'cards' ? (
                      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                      {dayTransactions.map((transaction) => {
                        const isOverdue = transaction.status !== 'paid' && transaction.dueDate && new Date(transaction.dueDate) < new Date();
                        const isPaid = transaction.status === 'paid';
                        const amount = parseFloat(transaction.amount || '0');
                        const total = transaction.type === 'revenue' ? monthlyTotals.totalRevenues : monthlyTotals.totalExpenses;
                        const percentage = total > 0 ? (amount / total) * 100 : 0;
                        const person = customersSuppliers.find(p => p.id === transaction.personId);

                        return (
                          <Card
                            key={transaction.id}
                            className="hover-elevate cursor-pointer bg-white/75 dark:bg-gray-900/75"
                            onClick={() => handleCardClick(transaction)}
                            data-testid={`card-transaction-${transaction.id}`}
                          >
                            <CardContent className="p-2 space-y-1">
                              {/* Type Badge and Overdue */}
                              <div className="flex items-center gap-1 flex-wrap">
                                <Badge 
                                  variant={transaction.type === 'expense' ? 'destructive' : 'default'}
                                  className={`text-[10px] h-5 px-1.5 ${transaction.type === 'revenue' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                >
                                  {transaction.type === 'expense' ? 'Despesa' : 'Receita'}
                                </Badge>
                                {isOverdue && (
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-orange-600 text-orange-600">
                                    Atraso
                                  </Badge>
                                )}
                              </div>

                              {/* Person */}
                              {person && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <User className="w-2.5 h-2.5" />
                                  <span className="truncate">{person.name}</span>
                                </div>
                              )}

                              {/* Payment Date (only if paid) */}
                              {isPaid && transaction.paidDate && (
                                <div className="flex items-center justify-between text-[10px] text-blue-600">
                                  <span>Pago em:</span>
                                  <span className="font-medium">
                                    {format(new Date(transaction.paidDate), "dd/MM/yy")}
                                  </span>
                                </div>
                              )}

                              {/* Amount and Status */}
                              <div className="flex items-center justify-between gap-1">
                                <div className={`text-sm font-bold ${
                                  transaction.type === 'expense' ? 'text-destructive' : 'text-blue-600'
                                }`}>
                                  {transaction.type === 'expense' ? '-' : '+'} R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={`text-[10px] h-5 px-1.5 flex-shrink-0 ${
                                    isPaid ? 'border-blue-600 text-blue-600' : 
                                    isOverdue ? 'border-orange-600 text-orange-600' : 
                                    'border-gray-400 text-gray-600'
                                  }`}
                                >
                                  {isPaid ? 'Pago' : transaction.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                                </Badge>
                              </div>

                              {/* Progress Bar with Percentage */}
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-muted-foreground">% do mês</span>
                                  <span className="font-semibold">{percentage.toFixed(1)}%</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      transaction.type === 'expense' 
                                        ? 'bg-destructive' 
                                        : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    ) : (
                      <div className="space-y-2">
                        {dayTransactions.map((transaction) => {
                          const isOverdue = transaction.status !== 'paid' && transaction.dueDate && new Date(transaction.dueDate) < new Date();
                          const isPaid = transaction.status === 'paid';
                          const amount = parseFloat(transaction.amount || '0');
                          const total = transaction.type === 'revenue' ? monthlyTotals.totalRevenues : monthlyTotals.totalExpenses;
                          const percentage = total > 0 ? (amount / total) * 100 : 0;
                          const person = customersSuppliers.find(p => p.id === transaction.personId);
                          const account = accounts.find(a => a.id === transaction.chartAccountId);

                          return (
                            <div
                              key={transaction.id}
                              className="flex items-center gap-2 p-2 border rounded-md hover-elevate cursor-pointer text-xs"
                              onClick={() => handleCardClick(transaction)}
                              data-testid={`row-transaction-${transaction.id}`}
                            >
                              {/* Type */}
                              <div className="w-16 flex-shrink-0">
                                <Badge 
                                  variant={transaction.type === 'expense' ? 'destructive' : 'default'}
                                  className={`text-[10px] h-5 px-1.5 ${transaction.type === 'revenue' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                >
                                  {transaction.type === 'expense' ? 'Despesa' : 'Receita'}
                                </Badge>
                              </div>

                              {/* Description */}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{transaction.title || 'Sem título'}</p>
                              </div>

                              {/* Person */}
                              <div className="w-32 flex-shrink-0 hidden md:block">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <User className="w-2.5 h-2.5" />
                                  <span className="truncate">{person?.name || '-'}</span>
                                </div>
                              </div>

                              {/* Account */}
                              <div className="w-40 flex-shrink-0 hidden lg:block">
                                <span className="text-muted-foreground truncate">{account?.description || '-'}</span>
                              </div>

                              {/* Payment Date */}
                              <div className="w-20 flex-shrink-0 hidden lg:block">
                                {isPaid && transaction.paidDate ? (
                                  <span className="text-blue-600 font-medium">
                                    {format(new Date(transaction.paidDate), "dd/MM/yy")}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </div>

                              {/* Amount */}
                              <div className="w-28 flex-shrink-0 text-right">
                                <span className={`font-bold ${
                                  transaction.type === 'expense' ? 'text-destructive' : 'text-blue-600'
                                }`}>
                                  {transaction.type === 'expense' ? '-' : '+'} R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              {/* Status */}
                              <div className="w-20 flex-shrink-0 hidden sm:block">
                                <Badge 
                                  variant="outline" 
                                  className={`text-[10px] h-5 px-1.5 ${
                                    isPaid ? 'border-blue-600 text-blue-600' : 
                                    isOverdue ? 'border-orange-600 text-orange-600' : 
                                    'border-gray-400 text-gray-600'
                                  }`}
                                >
                                  {isPaid ? 'Pago' : transaction.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                                </Badge>
                              </div>

                              {/* Percentage */}
                              <div className="w-16 flex-shrink-0 hidden xl:block text-right">
                                <span className="font-semibold">{percentage.toFixed(1)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Sheet - Opens when clicking a card */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {detailTransaction && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span>Detalhes do Lançamento</span>
                  <Badge 
                    variant={detailTransaction.type === 'expense' ? 'destructive' : 'default'}
                    className={detailTransaction.type === 'revenue' ? 'bg-blue-600' : ''}
                  >
                    {detailTransaction.type === 'expense' ? 'Despesa' : 'Receita'}
                  </Badge>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Amount Card */}
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-2">Valor</p>
                    <div className={`text-3xl font-bold ${
                      detailTransaction.type === 'expense' ? 'text-destructive' : 'text-blue-600'
                    }`}>
                      {detailTransaction.type === 'expense' ? '-' : '+'} R$ {parseFloat(detailTransaction.amount || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    {(() => {
                      const amount = parseFloat(detailTransaction.amount || '0');
                      const total = detailTransaction.type === 'revenue' ? monthlyTotals.totalRevenues : monthlyTotals.totalExpenses;
                      const percentage = total > 0 ? (amount / total) * 100 : 0;
                      return (
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Representa {percentage.toFixed(1)}% do total de {detailTransaction.type === 'revenue' ? 'receitas' : 'despesas'} do mês</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                detailTransaction.type === 'expense' 
                                  ? 'bg-destructive' 
                                  : 'bg-blue-600'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Information Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge variant="outline">
                      {detailTransaction.status === 'paid' ? 'Pago' : 
                       detailTransaction.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Vencimento</p>
                    <p className="text-sm font-medium">
                      {detailTransaction.dueDate ? format(new Date(detailTransaction.dueDate), "dd/MM/yyyy") : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Emissão</p>
                    <p className="text-sm">
                      {detailTransaction.issueDate ? format(new Date(detailTransaction.issueDate), "dd/MM/yyyy") : '-'}
                    </p>
                  </div>
                  {detailTransaction.paidDate && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Pagamento</p>
                      <p className="text-sm font-medium text-blue-600">
                        {format(new Date(detailTransaction.paidDate), "dd/MM/yyyy")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Título</p>
                  <p className="font-semibold">{detailTransaction.title || 'Sem título'}</p>
                </div>

                {detailTransaction.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                    <p className="text-sm">{detailTransaction.description}</p>
                  </div>
                )}

                {/* Person */}
                {(() => {
                  const person = customersSuppliers.find(p => p.id === detailTransaction.personId);
                  return person ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {detailTransaction.type === 'revenue' ? 'Cliente' : 'Fornecedor'}
                      </p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">{person.name}</p>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Additional values */}
                {(parseFloat(detailTransaction.discount || '0') > 0 || 
                  parseFloat(detailTransaction.interest || '0') > 0 || 
                  parseFloat(detailTransaction.fees || '0') > 0) && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Valores Adicionais</p>
                    {parseFloat(detailTransaction.discount || '0') > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Desconto</span>
                        <span className="font-medium">- R$ {parseFloat(detailTransaction.discount || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {parseFloat(detailTransaction.interest || '0') > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Juros</span>
                        <span className="font-medium">+ R$ {parseFloat(detailTransaction.interest || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {parseFloat(detailTransaction.fees || '0') > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Taxas</span>
                        <span className="font-medium">+ R$ {parseFloat(detailTransaction.fees || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setDetailSheetOpen(false);
                      setSelectedTransaction(detailTransaction);
                      setDialogOpen(true);
                    }}
                    data-testid="button-edit-detail"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDetailSheetOpen(false)}
                    data-testid="button-close-detail"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Transaction Dialog */}
      <TransactionDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={selectedTransaction}
      />
    </div>
  );
}
