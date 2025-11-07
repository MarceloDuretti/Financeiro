import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  ArrowDown,
  CalendarDays,
  Sparkles,
  CheckCircle,
  Clock,
  AlertTriangle,
  CalendarCheck
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  getMonth, 
  getYear, 
  getDate, 
  isValid,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
  isToday
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Transaction } from "@shared/schema";
import { TransactionDialog } from "@/components/TransactionDialog";
import { TransactionDetailSheet } from "@/components/TransactionDetailSheet";
import { AITransactionInput } from "@/components/AITransactionInput";
import { AITransactionForm } from "@/components/AITransactionForm";
import { AITransactionPreview } from "@/components/AITransactionPreview";
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const SELECTED_COMPANY_KEY = "fincontrol_selected_company_id";

// Format transaction code for display (e.g., REC001, DES045)
function formatTransactionCode(transaction: Transaction): string {
  const prefix = transaction.type === 'revenue' ? 'REC' : 'DES';
  const paddedCode = String(transaction.code || 0).padStart(3, '0');
  return `${prefix}${paddedCode}`;
}

// Format currency in compact form (e.g., R$ 15k, R$ 1,5M)
function formatCompactCurrency(value: number, showSign: boolean = false): string {
  const absValue = Math.abs(value);
  const sign = showSign ? (value >= 0 ? '+' : '−') : '';
  
  if (absValue < 1000) {
    return `${sign} R$ ${absValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  } else if (absValue < 1000000) {
    const kValue = absValue / 1000;
    return `${sign}${kValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}k`;
  } else {
    const mValue = absValue / 1000000;
    return `${sign}${mValue.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}M`;
  }
}

// Draggable Transaction Card Component
function DraggableTransactionCard({ transaction, children, onClick }: { transaction: Transaction, children: React.ReactNode, onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `transaction-${transaction.id}`,
    data: { transaction }
  });

  const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
  const [hasMoved, setHasMoved] = useState(false);

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'pointer',
  };

  const enhancedListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      listeners?.onPointerDown?.(e as any);
      setStartPos({ x: e.clientX, y: e.clientY });
      setHasMoved(false);
    },
    onPointerMove: (e: React.PointerEvent) => {
      listeners?.onPointerMove?.(e as any);
      if (startPos) {
        const dx = Math.abs(e.clientX - startPos.x);
        const dy = Math.abs(e.clientY - startPos.y);
        if (dx > 5 || dy > 5) {
          setHasMoved(true);
        }
      }
    },
    onPointerUp: (e: React.PointerEvent) => {
      listeners?.onPointerUp?.(e as any);
      
      // CRITICAL: Detect click here (not in onClick which never fires due to DnD listeners)
      // If pointer went down and up without significant movement, it's a click
      if (!hasMoved && startPos) {
        onClick();
      }
      
      setStartPos(null);
      setHasMoved(false);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      listeners?.onPointerCancel?.(e as any);
      setStartPos(null);
      setHasMoved(false);
    },
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...enhancedListeners}
    >
      {children}
    </div>
  );
}

// Droppable Day Column Component  
function DroppableDayColumn({ dayDate, children }: { dayDate: Date, children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${format(dayDate, 'yyyy-MM-dd')}`,
    data: { date: format(dayDate, 'yyyy-MM-dd') }
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 overflow-y-auto scrollbar-hidden p-1.5 space-y-1 transition-colors ${
        isOver ? 'bg-primary/10' : ''
      }`}
    >
      {children}
    </div>
  );
}

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
  const { toast } = useToast();
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
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'week'>(() => {
    const saved = localStorage.getItem('fincontrol_transactions_view_mode');
    return (saved === 'week' || saved === 'list' ? saved : 'cards') as 'cards' | 'list' | 'week';
  });
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    return startOfWeek(now, { locale: ptBR });
  });
  const [aiAssistOpen, setAiAssistOpen] = useState(false);
  const [aiCommandResult, setAiCommandResult] = useState<any>(null);
  const [showAiForm, setShowAiForm] = useState(false);
  const [showAiPreview, setShowAiPreview] = useState(false);
  const [generatedTransactions, setGeneratedTransactions] = useState<any[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);

  // Generate cloned transactions based on period
  const generateClonedTransactions = (baseTransaction: any, clonePeriod: any) => {
    const transactions: any[] = [];
    
    // Parse base date
    const baseDate = new Date(baseTransaction.dueDate);
    if (isNaN(baseDate.getTime())) {
      console.error("[Clone] Invalid base date:", baseTransaction.dueDate);
      return [baseTransaction];
    }

    const baseDayOfMonth = getDate(baseDate);
    const baseYear = getYear(baseDate);
    const baseMonth = getMonth(baseDate);
    
    // Calculate how many transactions to generate
    let monthsToAdd: number;
    switch (clonePeriod.type) {
      case "month":
        monthsToAdd = clonePeriod.count || 1;
        break;
      case "semester":
        monthsToAdd = 6;
        break;
      case "year":
        monthsToAdd = 12;
        break;
      case "custom":
        monthsToAdd = clonePeriod.count || 1;
        break;
      default:
        monthsToAdd = 1;
    }

    console.log(`[Clone] Generating ${monthsToAdd} transactions starting from ${baseTransaction.dueDate}`);

    // Generate transactions for each month
    for (let i = 0; i < monthsToAdd; i++) {
      // Create target date starting from day 1 to avoid month overflow
      const targetDate = new Date(baseYear, baseMonth + i, 1);
      
      // Get last day of target month
      const lastDayOfTargetMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0
      ).getDate();
      
      // Set day to minimum between desired day and last day of month
      const adjustedDay = Math.min(baseDayOfMonth, lastDayOfTargetMonth);
      targetDate.setDate(adjustedDay);

      // Format as YYYY-MM-DD
      const formattedDate = format(targetDate, "yyyy-MM-dd");

      transactions.push({
        ...baseTransaction,
        dueDate: formattedDate,
      });
    }

    console.log(`[Clone] Generated ${transactions.length} transactions`);
    return transactions;
  };

  // AI command analysis mutation (batch version - supports multiple transactions)
  const analyzeCommandMutation = useMutation({
    mutationFn: async (command: string) => {
      if (!selectedCompanyId) throw new Error("Nenhuma empresa selecionada");
      
      const res = await apiRequest("POST", "/api/transactions/analyze-batch-command", { 
        command, 
        companyId: selectedCompanyId 
      });
      return res.json();
    },
    onSuccess: (data) => {
      console.log("[AI Batch Command] Analysis result:", data);
      setAiCommandResult(data);
      setShowAiForm(true); // Show form first to review AI interpretation
      
      const count = data.transactions?.length || 0;
      toast({
        title: "Comando analisado",
        description: count > 1 
          ? `${count} lançamentos detectados. Revise os dados antes de continuar.`
          : "Revise os dados antes de continuar",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao analisar comando",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper function to convert date string (yyyy-MM-dd) to ISO string with proper timezone
  const convertDateToISO = (dateStr: string): string => {
    // Parse yyyy-MM-dd and create Date at noon UTC to avoid timezone shifts
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return date.toISOString();
  };

  // Batch transaction creation mutation
  const createBatchMutation = useMutation({
    mutationFn: async (params: { transactions: any[], cloneConfig?: any }) => {
      if (!selectedCompanyId) throw new Error("Nenhuma empresa selecionada");
      
      const { transactions, cloneConfig } = params;
      
      // Add companyId and convert dates to ISO strings
      const transactionsWithCompany = transactions.map(t => ({
        ...t,
        companyId: selectedCompanyId,
        issueDate: t.issueDate ? convertDateToISO(t.issueDate) : undefined,
        dueDate: t.dueDate ? convertDateToISO(t.dueDate) : undefined,
        paidDate: t.paidDate ? convertDateToISO(t.paidDate) : undefined,
      }));
      
      const requestBody: any = { 
        transactions: transactionsWithCompany
      };
      
      // Add cloneConfig if present
      if (cloneConfig) {
        requestBody.cloneConfig = {
          ...cloneConfig,
          companyId: selectedCompanyId
        };
      }
      
      console.log("[Batch Transaction] Request body:", requestBody);
      
      const res = await apiRequest("POST", "/api/transactions/batch", requestBody);
      return res.json();
    },
    onSuccess: (data) => {
      console.log("[Batch Transaction] Created:", data);
      toast({
        title: "Lançamentos criados",
        description: `${data.count} lançamento(s) criado(s) com sucesso!`,
      });
      // Close sheet and reset state
      setAiAssistOpen(false);
      setShowAiPreview(false);
      setShowAiForm(false);
      setAiCommandResult(null);
      setGeneratedTransactions([]);
      // Invalidate queries to refresh the list and analytics
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dre-hierarchical'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/yearly-evolution'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar lançamentos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update transaction date mutation (for drag-and-drop)
  const updateTransactionDateMutation = useMutation({
    mutationFn: async ({ transactionId, companyId, newDate }: { transactionId: string, companyId: string, newDate: string }) => {
      const res = await apiRequest("PATCH", `/api/transactions/${transactionId}?companyId=${companyId}`, {
        dueDate: convertDateToISO(newDate),
        issueDate: convertDateToISO(newDate),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dre-hierarchical'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/yearly-evolution'] });
      toast({
        title: "Data atualizada",
        description: "A transação foi movida com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar data",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle drag end event (when dropping a transaction on another day)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return; // Dropped outside a valid drop zone
    
    const transactionData = active.data.current?.transaction as Transaction;
    const newDate = over.data.current?.date as string;
    
    if (!transactionData || !newDate) return;
    
    // Only update if the date actually changed
    const currentDate = transactionData.dueDate ? format(new Date(transactionData.dueDate), 'yyyy-MM-dd') : null;
    if (currentDate === newDate) return;
    
    // Update the transaction date
    updateTransactionDateMutation.mutate({
      transactionId: transactionData.id,
      companyId: transactionData.companyId,
      newDate: newDate,
    });
  };

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('fincontrol_transactions_view_mode', viewMode);
  }, [viewMode]);

  // Calculate date range from selected month/year (with buffer for week view)
  const startDate = useMemo(() => {
    const monthStart = new Date(selectedYear, selectedMonth, 1);
    // Include buffer days for complete weeks
    return format(startOfWeek(monthStart, { locale: ptBR }), 'yyyy-MM-dd');
  }, [selectedMonth, selectedYear]);

  const endDate = useMemo(() => {
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth, 1));
    // Include buffer days for complete weeks
    return format(endOfWeek(monthEnd, { locale: ptBR }), 'yyyy-MM-dd');
  }, [selectedMonth, selectedYear]);

  // Sync week when month/year changes
  useEffect(() => {
    const today = new Date();
    const isCurrentMonth = selectedMonth === getMonth(today) && selectedYear === getYear(today);
    
    if (isCurrentMonth) {
      // Se estamos no mês atual, vai para a semana atual
      setSelectedWeekStart(startOfWeek(today, { locale: ptBR }));
    } else {
      // Se não, vai para a primeira semana do mês selecionado
      const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
      setSelectedWeekStart(startOfWeek(firstDayOfMonth, { locale: ptBR }));
    }
  }, [selectedMonth, selectedYear]);

  // Go to current week when activating week view in current month
  useEffect(() => {
    if (viewMode === 'week') {
      const today = new Date();
      const isCurrentMonth = selectedMonth === getMonth(today) && selectedYear === getYear(today);
      
      if (isCurrentMonth) {
        setSelectedWeekStart(startOfWeek(today, { locale: ptBR }));
      }
    }
  }, [viewMode]);

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
    setSelectedWeekStart(startOfWeek(now, { locale: ptBR }));
  };

  // Week navigation functions
  const goToPreviousWeek = () => {
    setSelectedWeekStart(subWeeks(selectedWeekStart, 1));
  };

  const goToNextWeek = () => {
    setSelectedWeekStart(addWeeks(selectedWeekStart, 1));
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

  // Filter transactions to only current month (for accurate KPIs, excluding buffer days)
  const monthOnlyTransactions = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth, 1));
    
    return transactions.filter(t => {
      if (!t.dueDate) return true; // Include transactions without dueDate
      const dueDate = new Date(t.dueDate);
      return dueDate >= monthStart && dueDate <= monthEnd;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Calculate KPIs (exclude cancelled transactions) - use only month transactions
  const kpis = {
    openExpenses: monthOnlyTransactions
      .filter(t => t.type === 'expense' && t.status === 'pending')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0),
    openRevenues: monthOnlyTransactions
      .filter(t => t.type === 'revenue' && t.status === 'pending')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0),
    overdue: monthOnlyTransactions
      .filter(t => t.status === 'pending' && t.dueDate && new Date(t.dueDate) < new Date())
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0),
    result: monthOnlyTransactions
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

  // Calculate monthly totals for percentage calculation (use only month transactions)
  const monthlyTotals = useMemo(() => {
    const totalRevenues = monthOnlyTransactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    
    const totalExpenses = monthOnlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    
    return { totalRevenues, totalExpenses };
  }, [monthOnlyTransactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    // Start with month-only transactions for non-week views
    let baseTransactions = viewMode === 'week' ? transactions : monthOnlyTransactions;
    
    let filtered = baseTransactions.filter(transaction => {
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

    // Additional filter for week view - filter by selected week range
    if (viewMode === 'week' && filtered.length > 0) {
      const weekStart = selectedWeekStart;
      const weekEnd = endOfWeek(selectedWeekStart, { locale: ptBR });
      
      filtered = filtered.filter(transaction => {
        if (!transaction.dueDate) return false;
        const dueDate = new Date(transaction.dueDate);
        return dueDate >= weekStart && dueDate <= weekEnd;
      });
    }

    return filtered;
  }, [transactions, monthOnlyTransactions, typeFilter, statusFilter, searchQuery, viewMode, selectedWeekStart]);

  // Group transactions by full date (YYYY-MM-DD) to avoid collisions
  const transactionsByDay = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    const noDueDateKey = 'no-date';
    
    filteredTransactions.forEach(transaction => {
      let key: string;
      
      if (transaction.dueDate && isValid(new Date(transaction.dueDate))) {
        // Use full date format to avoid collisions between different months
        key = format(new Date(transaction.dueDate), 'yyyy-MM-dd');
      } else {
        // Fallback for transactions without dueDate
        key = noDueDateKey;
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(transaction);
    });
    
    // Sort: dates first (chronologically), then "no-date" section last
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (a === noDueDateKey) return 1;
      if (b === noDueDateKey) return -1;
      return a.localeCompare(b); // Chronological sort of YYYY-MM-DD strings
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

  // Extra dictionaries for enriched read view (detalhes)
  const { data: costCenters = [] } = useQuery<any[]>({
    queryKey: ["/api/cost-centers", { companyId: selectedCompanyId }],
    enabled: !!selectedCompanyId,
  });
  const { data: chartAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/chart-of-accounts", { companyId: selectedCompanyId }],
    enabled: !!selectedCompanyId,
  });
  const { data: bankAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/bank-accounts", { companyId: selectedCompanyId }],
    enabled: !!selectedCompanyId,
  });
  const { data: paymentMethods = [] } = useQuery<any[]>({
    queryKey: ["/api/payment-methods", { companyId: selectedCompanyId }],
    enabled: !!selectedCompanyId,
  });

  const handleCardClick = (transaction: Transaction) => {
    setDetailTransaction(transaction);
    setDetailSheetOpen(true);
  };

  // Update detailTransaction when transactions data changes
  useEffect(() => {
    if (detailTransaction && transactions.length > 0) {
      const updatedTransaction = transactions.find(t => t.id === detailTransaction.id);
      if (updatedTransaction) {
        setDetailTransaction(updatedTransaction);
      }
    }
  }, [transactions, detailTransaction?.id]);

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
      {/* Header with inline KPIs */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-6 p-3 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg border">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Lançamentos</h1>
            <p className="text-xs text-muted-foreground">
              {MONTHS[selectedMonth].full} de {selectedYear}
            </p>
          </div>
        </div>
        
        {/* Inline KPI Cards - Discretos e centralizados */}
        <div className="flex items-center justify-center flex-wrap px-4 divide-x divide-border/40">
          {/* Open Expenses */}
          <div className="flex items-center gap-2 px-3 py-2 bg-transparent flex-shrink-0">
            <TrendingDown className="w-3.5 h-3.5 text-destructive" />
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Desp. Abertas</span>
              <span className="text-sm font-medium text-destructive">
                R$ {kpis.openExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Open Revenues */}
          <div className="flex items-center gap-2 px-3 py-2 bg-transparent flex-shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Rec. Abertas</span>
              <span className="text-sm font-medium text-blue-600">
                R$ {kpis.openRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Overdue */}
          <div className="flex items-center gap-2 px-3 py-2 bg-transparent flex-shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Em Atraso</span>
              <span className="text-sm font-medium text-orange-600">
                R$ {kpis.overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Result */}
          <div className="flex items-center gap-2 px-3 py-2 bg-transparent flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Resultado</span>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-medium ${kpis.result >= 0 ? 'text-blue-600' : 'text-destructive'}`}>
                  R$ {kpis.result.toLocaleString('pt-BR', { minimumFractionDigits: 2, signDisplay: 'always' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm"
            variant="outline"
            onClick={() => setAiAssistOpen(true)}
            data-testid="button-ai-assist"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Assistência IA</span>
          </Button>
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
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Month Navigation Sidebar - Desktop Only */}
        <div className="hidden lg:flex flex-col w-32 border-r bg-background">
          {/* Year selector - compact */}
          <div className="p-2 border-b">
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
          <div className="lg:hidden border-b">
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

          {/* Compact Filters */}
          <div className="p-2 border-b">
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
                <Button 
                  variant={viewMode === 'week' ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode('week')}
                  data-testid="button-view-week"
                >
                  <CalendarDays className="w-3 h-3" />
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
            ) : viewMode === 'week' ? (
              // WEEK VIEW
              <DndContext onDragEnd={handleDragEnd}>
                <div className="flex flex-col h-full">
                  {/* Week Navigation */}
                  <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousWeek}
                    className="h-9"
                    data-testid="button-prev-week"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  
                  <div className="text-center">
                    <h3 className="text-base font-semibold tracking-tight">
                      {format(selectedWeekStart, "d 'de' MMMM", { locale: ptBR })} - {format(endOfWeek(selectedWeekStart, { locale: ptBR }), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </h3>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextWeek}
                    className="h-9"
                    data-testid="button-next-week"
                  >
                    Próxima
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {/* Week Grid - 7 columns */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-2 min-h-0">
                  {eachDayOfInterval({
                    start: selectedWeekStart,
                    end: endOfWeek(selectedWeekStart, { locale: ptBR })
                  }).map((day, dayIndex, allDays) => {
                    const dayTransactions = filteredTransactions.filter(t => 
                      t.dueDate && isSameDay(new Date(t.dueDate), day)
                    );
                    
                    const dayRevenues = dayTransactions
                      .filter(t => t.type === 'revenue')
                      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
                    
                    const dayExpenses = dayTransactions
                      .filter(t => t.type === 'expense')
                      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
                    
                    const dayBalance = dayRevenues - dayExpenses;
                    
                    // Calcular saldo acumulado (soma progressiva desde início da semana)
                    let accumulatedBalance = 0;
                    for (let i = 0; i <= dayIndex; i++) {
                      const prevDay = allDays[i];
                      const prevDayTransactions = filteredTransactions.filter(t => 
                        t.dueDate && isSameDay(new Date(t.dueDate), prevDay)
                      );
                      const prevRevenues = prevDayTransactions
                        .filter(t => t.type === 'revenue')
                        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
                      const prevExpenses = prevDayTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
                      accumulatedBalance += (prevRevenues - prevExpenses);
                    }
                    
                    // Calcular variação percentual vs dia anterior
                    let percentChange: number | null = null;
                    if (dayIndex > 0) {
                      const previousDay = allDays[dayIndex - 1];
                      const previousDayTransactions = filteredTransactions.filter(t => 
                        t.dueDate && isSameDay(new Date(t.dueDate), previousDay)
                      );
                      const prevRevenues = previousDayTransactions
                        .filter(t => t.type === 'revenue')
                        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
                      const prevExpenses = previousDayTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
                      const previousDayBalance = prevRevenues - prevExpenses;
                      
                      if (previousDayBalance !== 0) {
                        percentChange = ((dayBalance - previousDayBalance) / Math.abs(previousDayBalance)) * 100;
                      } else if (dayBalance !== 0) {
                        // Se dia anterior era 0 e hoje não é, consideramos crescimento infinito (usamos 100%)
                        percentChange = dayBalance > 0 ? 100 : -100;
                      }
                    }
                    
                    const isCurrentDay = isToday(day);
                    
                    return (
                      <div 
                        key={day.toISOString()} 
                        className={`flex flex-col min-h-0 rounded-3xl shadow-md ring-1 ring-black/5 backdrop-blur-xl bg-white/80 dark:bg-white/10 transition-all duration-200 ${isCurrentDay ? 'ring-2 ring-[hsl(var(--ios-blue)/0.3)]' : ''}`}
                        data-testid={`week-day-${format(day, 'yyyy-MM-dd')}`}
                      >
                        {/* Day Header - FIXO */}
                        <div className="flex-shrink-0 p-3 rounded-t-3xl bg-muted/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {format(day, 'EEE', { locale: ptBR })}
                            </span>
                          </div>
                          
                          {/* Compact Layout: Number + Day/Acum */}
                          <div className="flex items-start gap-3">
                            {/* Day Number - Large */}
                            <div className="text-3xl font-normal tracking-tight leading-none">
                              {format(day, 'd')}
                            </div>
                            
                            {/* Day and Accumulated - Compact Column */}
                            <div className="flex-1 space-y-0.5 text-[11px]">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Dia:</span>
                                <span className={`font-semibold tabular-nums ${
                                  dayBalance > 0 ? 'text-blue-600' : dayBalance < 0 ? 'text-destructive' : 'text-muted-foreground'
                                }`}>
                                  {formatCompactCurrency(dayBalance, true)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Acum:</span>
                                <span className={`font-semibold tabular-nums ${
                                  accumulatedBalance > 0 ? 'text-blue-600' : accumulatedBalance < 0 ? 'text-destructive' : 'text-muted-foreground'
                                }`}>
                                  {formatCompactCurrency(accumulatedBalance, true)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Transactions List - SCROLLÁVEL com Drag & Drop */}
                        <DroppableDayColumn dayDate={day}>
                          {dayTransactions.map((transaction) => {
                            const isPaid = transaction.status === 'paid';
                            const isOverdue = transaction.status !== 'paid' && transaction.dueDate && new Date(transaction.dueDate) < new Date();
                            const isFuture = transaction.status !== 'paid' && transaction.dueDate && new Date(transaction.dueDate) > new Date();
                            const amount = parseFloat(transaction.amount || '0');
                            const person = customersSuppliers.find(p => p.id === transaction.personId);
                            const statusLabel = isPaid
                              ? (transaction.type === 'revenue' ? 'Recebido' : 'Pago')
                              : (transaction.status === 'cancelled' ? 'Cancelado' : (isOverdue ? 'Vencido' : 'Pendente'));
                            const statusBarClass = isPaid
                              ? ''
                              : (transaction.status === 'cancelled' 
                                  ? 'text-red-700 dark:text-red-500'
                                  : (isOverdue ? 'text-orange-600 dark:text-orange-400' : ''));
                            const showStatusBar = (transaction.status === 'cancelled' || isOverdue);
                            
                            return (
                              <DraggableTransactionCard
                                key={transaction.id}
                                transaction={transaction}
                                onClick={() => handleCardClick(transaction)}
                              >
                                <div
                                  className={`group p-3 rounded-3xl cursor-pointer transition-all duration-200 hover-elevate active-elevate-2 backdrop-blur-xl ${
                                    isOverdue 
                                      ? 'bg-[hsl(var(--ios-red)/0.08)] dark:bg-[hsl(var(--ios-red)/0.15)]' 
                                      : 'bg-[#F5F5F7]/80 dark:bg-white/10'
                                  }`}
                                  data-testid={`week-transaction-${transaction.id}`}
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      {isPaid ? (
                                        <CheckCircle className="w-4 h-4 text-[hsl(var(--ios-green))]" strokeWidth={2} />
                                      ) : isOverdue ? (
                                        <AlertTriangle className="w-4 h-4 text-[hsl(var(--ios-yellow))]" strokeWidth={2} />
                                      ) : (
                                        <Clock className="w-4 h-4 text-[hsl(var(--ios-gray))]" strokeWidth={2} />
                                      )}
                                      <Badge 
                                        variant="outline" 
                                        className="text-[11px] h-5 px-2 font-mono bg-transparent"
                                        data-testid={`badge-code-week-${transaction.id}`}
                                      >
                                        {formatTransactionCode(transaction)}
                                      </Badge>
                                      {isPaid && (
                                        <Badge className="text-[10px] h-5 px-2 bg-[hsl(var(--ios-green)/0.15)] text-[hsl(var(--ios-green))] border-0">
                                          Pago
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {/* Person - direto sem label */}
                                    {person && (
                                      <div className="text-sm font-semibold leading-tight text-foreground/90">
                                        {person.name}
                                      </div>
                                    )}
                                    
                                    {/* Amount */}
                                    <div className={`text-base font-semibold tabular-nums ${
                                      isPaid 
                                        ? (transaction.type === 'revenue' ? 'text-[hsl(var(--ios-green))]' : 'text-[hsl(var(--ios-gray))]') 
                                        : isOverdue
                                          ? 'text-[hsl(var(--ios-red))]'
                                          : 'text-foreground'
                                    }`}>
                                      {isPaid ? (transaction.type === 'revenue' ? '+' : '−') : ''} R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                    
                                    {/* Overdue indicator */}
                                    {isOverdue && !isPaid && transaction.dueDate && (
                                      <div className="text-[11px] text-[hsl(var(--ios-red))] italic">
                                        Vencido há {Math.floor((new Date().getTime() - new Date(transaction.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </DraggableTransactionCard>
                            );
                          })}
                        </DroppableDayColumn>
                      </div>
                    );
                  })}
                </div>
                </div>
              </DndContext>
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
                  const dayDate = isNoDate ? null : new Date(dayKey);
                  const day = isNoDate ? null : (dayDate ? getDate(dayDate) : null);
                  const dayMonth = isNoDate ? null : (dayDate ? getMonth(dayDate) : null);
                  const dayLabel = isNoDate 
                    ? 'Sem data de vencimento' 
                    : `Dia ${day} de ${dayMonth !== null ? MONTHS[dayMonth].full : ''}`;
                  
                  return (
                    <div key={dayKey}>
                      {/* Day Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold text-muted-foreground">
                          {dayLabel}
                        </h2>
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">
                          {dayTransactions.length} {dayTransactions.length === 1 ? 'lançamento' : 'lançamentos'}
                        </span>
                      </div>

                    {viewMode === 'cards' ? (
                      <div className="grid gap-y-3 gap-x-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                      {dayTransactions.map((transaction) => {
                        const isOverdue = transaction.status !== 'paid' && transaction.dueDate && new Date(transaction.dueDate) < new Date();
                        const isPaid = transaction.status === 'paid';
                        const amount = parseFloat(transaction.amount || '0');
                        const total = transaction.type === 'revenue' ? monthlyTotals.totalRevenues : monthlyTotals.totalExpenses;
                        const percentage = total > 0 ? (amount / total) * 100 : 0;
                        const person = customersSuppliers.find(p => p.id === transaction.personId);
                        const statusLabel = isPaid
                          ? (transaction.type === 'revenue' ? 'Recebido' : 'Pago')
                          : (transaction.status === 'cancelled' ? 'Cancelado' : (isOverdue ? 'Vencido' : 'Pendente'));
                        const statusBarClass = isPaid
                          ? ''
                          : (transaction.status === 'cancelled' 
                              ? 'text-red-700 dark:text-red-500' 
                              : (isOverdue ? 'text-orange-600 dark:text-orange-400' : ''));
                        const showStatusBar = (transaction.status === 'cancelled' || isOverdue);

                        return (
                          <Card
                            key={transaction.id}
                            className={`cursor-pointer rounded-3xl hover-elevate active-elevate-2 transition-all duration-200 backdrop-blur-xl border-0 ${
                              isOverdue 
                                ? 'bg-[hsl(var(--ios-red)/0.08)] dark:bg-[hsl(var(--ios-red)/0.15)]' 
                                : 'bg-[#F5F5F7]/80 dark:bg-white/10'
                            }`}
                            onClick={() => handleCardClick(transaction)}
                            data-testid={`card-transaction-${transaction.id}`}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                {isPaid ? (
                                  <CheckCircle className="w-4 h-4 text-[hsl(var(--ios-green))]" strokeWidth={2} />
                                ) : isOverdue ? (
                                  <AlertTriangle className="w-4 h-4 text-[hsl(var(--ios-yellow))]" strokeWidth={2} />
                                ) : (
                                  <Clock className="w-4 h-4 text-[hsl(var(--ios-gray))]" strokeWidth={2} />
                                )}
                                <Badge 
                                  variant="outline" 
                                  className="text-[11px] h-5 px-2 font-mono bg-transparent"
                                  data-testid={`badge-code-${transaction.id}`}
                                >
                                  {formatTransactionCode(transaction)}
                                </Badge>
                                {isPaid && (
                                  <Badge className="text-[10px] h-5 px-2 bg-[hsl(var(--ios-green)/0.15)] text-[hsl(var(--ios-green))] border-0">
                                    Pago
                                  </Badge>
                                )}
                              </div>

                              {/* Person - direto sem label */}
                              {person && (
                                <div className="text-sm font-semibold leading-tight text-foreground/90">
                                  {person.name}
                                </div>
                              )}

                              {/* Amount */}
                              <div className={`text-base font-semibold tabular-nums ${
                                isPaid 
                                  ? (transaction.type === 'revenue' ? 'text-[hsl(var(--ios-green))]' : 'text-[hsl(var(--ios-gray))]') 
                                  : isOverdue
                                    ? 'text-[hsl(var(--ios-red))]'
                                    : 'text-foreground'
                              }`}>
                                {isPaid ? (transaction.type === 'revenue' ? '+' : '−') : ''} R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              
                              {/* Overdue indicator */}
                              {isOverdue && !isPaid && transaction.dueDate && (
                                <div className="text-[11px] text-[hsl(var(--ios-red))] italic">
                                  Vencido há {Math.floor((new Date().getTime() - new Date(transaction.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                                </div>
                              )}

                              {/* Progress Bar with Percentage */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[hsl(var(--ios-gray))]">% do mês</span>
                                  <span className="font-medium">{percentage.toFixed(1)}%</span>
                                </div>
                                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      transaction.type === 'expense' 
                                        ? 'bg-[hsl(var(--ios-red))]' 
                                        : 'bg-[hsl(var(--ios-blue))]'
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
                      <div className="space-y-3">
                        {dayTransactions.map((transaction) => {
                          const isOverdue = transaction.status !== 'paid' && transaction.dueDate && new Date(transaction.dueDate) < new Date();
                          const isPaid = transaction.status === 'paid';
                          const amount = parseFloat(transaction.amount || '0');
                          const total = transaction.type === 'revenue' ? monthlyTotals.totalRevenues : monthlyTotals.totalExpenses;
                          const percentage = total > 0 ? (amount / total) * 100 : 0;
                          const person = customersSuppliers.find(p => p.id === transaction.personId);

                          return (
                            <div
                              key={transaction.id}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-3xl hover-elevate cursor-pointer transition-all duration-150 backdrop-blur-xl ${
                                isOverdue
                                  ? 'bg-[hsl(var(--ios-red)/0.08)] dark:bg-[hsl(var(--ios-red)/0.15)]'
                                  : 'bg-[#F5F5F7]/80 dark:bg-white/10'
                              }`}
                              onClick={() => handleCardClick(transaction)}
                              data-testid={`row-transaction-${transaction.id}`}
                            >
                              {/* Code & Status Icon */}
                              <div className="w-[90px] flex-shrink-0 flex items-center gap-2">
                                {isPaid ? (
                                  <CheckCircle className="w-4 h-4 text-[hsl(var(--ios-green))]" strokeWidth={2} />
                                ) : isOverdue ? (
                                  <AlertTriangle className="w-4 h-4 text-[hsl(var(--ios-yellow))]" strokeWidth={2} />
                                ) : (
                                  <Clock className="w-4 h-4 text-[hsl(var(--ios-gray))]" strokeWidth={2} />
                                )}
                                <Badge 
                                  variant="outline" 
                                  className="text-[11px] h-5 px-2 font-mono bg-transparent"
                                  data-testid={`badge-code-list-${transaction.id}`}
                                >
                                  {formatTransactionCode(transaction)}
                                </Badge>
                              </div>

                              {/* Type */}
                              <div className="w-[70px] flex-shrink-0">
                                <Badge 
                                  className={`text-[11px] h-6 px-2 border-0 ${
                                    transaction.type === 'expense' 
                                      ? 'bg-[hsl(var(--ios-red)/0.15)] text-[hsl(var(--ios-red))]' 
                                      : 'bg-[hsl(var(--ios-blue)/0.15)] text-[hsl(var(--ios-blue))]'
                                  }`}
                                >
                                  {transaction.type === 'expense' ? 'Despesa' : 'Receita'}
                                </Badge>
                              </div>

                              {/* Person */}
                              <div className="w-44 flex-shrink-0 hidden md:block">
                                <div className="flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 text-muted-foreground/60" />
                                  <span className="truncate font-semibold text-[13px] tracking-tight">{person?.name || '-'}</span>
                                </div>
                              </div>

                              {/* Description/Title */}
                              <div className="flex-1 min-w-0 hidden lg:block">
                                <p className="text-muted-foreground/70 truncate text-[11px] tracking-normal">
                                  {transaction.title ? `(${transaction.title})` : ''}
                                </p>
                              </div>

                              {/* Payment Date */}
                              <div className="w-24 flex-shrink-0 hidden lg:block">
                                {isPaid && transaction.paidDate ? (
                                  <span className={`${transaction.type === 'expense' ? 'text-[hsl(var(--ios-gray))]' : 'text-[hsl(var(--ios-green))]'} font-medium text-[11px]`}>
                                    {format(new Date(transaction.paidDate), "dd/MM/yy")}
                                  </span>
                                ) : (
                                  <span className="text-[hsl(var(--ios-gray))] text-[11px]">-</span>
                                )}
                              </div>

                              {/* Percentage with Progress Bar */}
                              <div className="w-36 flex-shrink-0 hidden xl:block">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-[11px] tracking-tight">{percentage.toFixed(1)}%</span>
                                  </div>
                                  <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-300 ease-out ${
                                        transaction.type === 'expense' 
                                          ? 'bg-[hsl(var(--ios-red))]' 
                                          : 'bg-[hsl(var(--ios-blue))]'
                                      }`}
                                      style={{ width: `${Math.min(percentage, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Amount */}
                              <div className="w-32 flex-shrink-0 text-right">
                                <span className={`font-semibold text-[13px] tracking-tight tabular-nums ${
                                  isPaid
                                    ? (transaction.type === 'expense' ? 'text-[hsl(var(--ios-gray))]' : 'text-[hsl(var(--ios-green))]')
                                    : isOverdue
                                      ? 'text-[hsl(var(--ios-red))]'
                                      : 'text-foreground'
                                }`}>
                                  {transaction.type === 'expense' ? '−' : '+'} R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              {/* Status */}
                              <div className="w-24 flex-shrink-0 hidden sm:block">
                                <Badge 
                                  className={`text-[10px] h-5 px-2 border-0 ${
                                    isPaid ? 'bg-[hsl(var(--ios-green)/0.15)] text-[hsl(var(--ios-green))]' : 
                                    isOverdue ? 'bg-[hsl(var(--ios-yellow)/0.15)] text-[hsl(var(--ios-yellow))]' : 
                                    'bg-muted/30 text-[hsl(var(--ios-gray))]'
                                  }`}
                                >
                                  {isPaid ? 'Pago' : transaction.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                                </Badge>
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
      {/* Transaction Detail Sheet with Inline Editing */}
      <TransactionDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        transaction={detailTransaction}
        monthlyTotals={monthlyTotals}
      />

      <TransactionDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={selectedTransaction}
      />

      {/* AI Assistance Sheet */}
      <Sheet open={aiAssistOpen} onOpenChange={(open) => {
        setAiAssistOpen(open);
        if (!open) {
          // Reset state when closing
          setShowAiForm(false);
          setShowAiPreview(false);
          setAiCommandResult(null);
          setGeneratedTransactions([]);
        }
      }}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Assistência de IA para Lançamentos
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {!showAiForm && !showAiPreview ? (
              <AITransactionInput
                onProcess={(input) => analyzeCommandMutation.mutate(input)}
                isProcessing={analyzeCommandMutation.isPending}
                placeholder="Descreva o lançamento que deseja criar..."
              />
            ) : showAiForm && aiCommandResult ? (
              <AITransactionForm
                command={aiCommandResult}
                onSubmit={(data) => {
                  console.log("[AI Form] Submitted data:", data);
                  console.log("[AI Form] aiCommandResult:", aiCommandResult);
                  
                  // Check if this is a clone_by_code operation
                  if (aiCommandResult.operation === 'clone_by_code' && aiCommandResult.cloneConfig?.sourceCode) {
                    // For clone_by_code, create transaction from form data for preview
                    const transaction = {
                      type: data.type,
                      amount: data.amount,
                      title: data.title,
                      description: data.description,
                      personName: data.personName,
                      personId: data.personId,
                      chartAccountId: data.chartAccountId,
                      costCenterId: data.costCenterId,
                      paymentMethodId: data.paymentMethodId,
                      issueDate: data.issueDate || data.dueDate,
                      dueDate: data.dueDate,
                    };
                    
                    console.log("[AI Form] Clone transaction for preview:", transaction);
                    
                    // Store cloneConfig for backend processing
                    const overrides: any = {};
                    if (data.type) overrides.type = data.type;
                    if (data.amount) overrides.amount = data.amount;
                    if (data.title) overrides.title = data.title;
                    if (data.description) overrides.description = data.description;
                    if (data.personName) overrides.personName = data.personName;
                    
                    const cloneConfigWithOverrides = {
                      ...aiCommandResult.cloneConfig,
                      overrides: {
                        ...aiCommandResult.cloneConfig.overrides,
                        ...overrides
                      }
                    };
                    
                    console.log("[AI Form] Clone config with overrides:", cloneConfigWithOverrides);
                    
                    // Pass transaction to preview
                    setGeneratedTransactions([transaction]);
                    // Store cloneConfig in aiCommandResult for backend use
                    setAiCommandResult({
                      ...aiCommandResult,
                      cloneConfig: cloneConfigWithOverrides
                    });
                  } else {
                    // Apply edited data from form to all AI-generated transactions
                    // IMPORTANT: Preserve AI-specific dates for each transaction
                    const transactions = (aiCommandResult.transactions || []).map((aiTx: any, index: number) => ({
                      type: data.type,
                      amount: data.amount,
                      title: data.title,
                      description: data.description,
                      personName: data.personName,
                      issueDate: aiTx.issueDate || aiTx.dueDate || data.issueDate || data.dueDate, // Use AI's dueDate if issueDate not specified
                      dueDate: aiTx.dueDate || data.dueDate, // Preserve AI-specific due date
                      personId: aiTx.personId || data.personId,
                      chartAccountId: aiTx.chartAccountId || data.chartAccountId,
                      costCenterId: aiTx.costCenterId || data.costCenterId,
                      paymentMethodId: data.paymentMethodId,
                    }));
                    
                    console.log("[AI Form] Prepared transactions for preview:", transactions);
                    setGeneratedTransactions(transactions);
                  }
                  
                  setShowAiForm(false);
                  setShowAiPreview(true);
                }}
                onCancel={() => {
                  setShowAiForm(false);
                  setAiCommandResult(null);
                }}
              />
            ) : showAiPreview ? (
              <AITransactionPreview
                transactions={generatedTransactions}
                clonePeriod={aiCommandResult?.clonePeriod}
                isSubmitting={createBatchMutation.isPending}
                onConfirm={(updatedTransactions) => {
                  console.log("[AI Preview] Confirmed - creating transactions:", updatedTransactions);
                  console.log("[AI Preview] aiCommandResult:", aiCommandResult);
                  
                  // Pass cloneConfig if present (for clone_by_code operations)
                  createBatchMutation.mutate({
                    transactions: updatedTransactions,
                    cloneConfig: aiCommandResult?.cloneConfig
                  });
                }}
                onEdit={() => {
                  setShowAiPreview(false);
                  setShowAiForm(true);
                }}
                onCancel={() => {
                  setShowAiPreview(false);
                  setShowAiForm(false);
                  setAiCommandResult(null);
                  setGeneratedTransactions([]);
                }}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}






