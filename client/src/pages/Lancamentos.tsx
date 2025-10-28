import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search, 
  TrendingDown, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Transaction } from "@shared/schema";

const SELECTED_COMPANY_KEY = "fincontrol_selected_company_id";

export default function Lancamentos() {
  const selectedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const parentRef = useRef<HTMLDivElement>(null);

  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", selectedCompanyId, { 
      startDate, 
      endDate, 
      type: typeFilter === 'all' ? undefined : typeFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      query: searchQuery
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

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;
    if (statusFilter !== 'all' && transaction.status !== statusFilter) return false;
    if (searchQuery && !transaction.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Virtualizer for performance
  const rowVirtualizer = useVirtualizer({
    count: filteredTransactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Lançamentos</h1>
            <p className="text-sm text-muted-foreground">
              Controle financeiro completo
            </p>
          </div>
        </div>
        <Button data-testid="button-new-transaction">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Lançamento</span>
        </Button>
      </div>

      {/* Analytics Card */}
      <div className="p-4 border-b bg-muted/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Open Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Despesas Abertas</p>
              <TrendingDown className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                R$ {kpis.openExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {transactions.filter(t => t.type === 'expense' && t.status === 'pending').length} lançamentos
              </p>
            </CardContent>
          </Card>

          {/* Open Revenues */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Receitas Abertas</p>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {kpis.openRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {transactions.filter(t => t.type === 'revenue' && t.status === 'pending').length} lançamentos
              </p>
            </CardContent>
          </Card>

          {/* Overdue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Em Atraso</p>
              <AlertCircle className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                R$ {kpis.overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {transactions.filter(t => t.status === 'pending' && t.dueDate && new Date(t.dueDate) < new Date()).length} lançamentos
              </p>
            </CardContent>
          </Card>

          {/* Result */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Resultado</p>
              <Calendar className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpis.result >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                R$ {kpis.result.toLocaleString('pt-BR', { minimumFractionDigits: 2, signDisplay: 'always' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {transactions.filter(t => t.status === 'paid').length} pagos/recebidos
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b bg-muted/10">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
              data-testid="input-search-transaction"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-9" data-testid="select-type-filter">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
              <SelectItem value="revenue">Receitas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" data-testid="button-more-filters">
            <Filter className="w-4 h-4" />
            Mais Filtros
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-auto p-4" ref={parentRef}>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
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
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const transaction = filteredTransactions[virtualRow.index];
              const isOverdue = transaction.status !== 'paid' && transaction.dueDate && new Date(transaction.dueDate) < new Date();
              const isPaid = transaction.status === 'paid';
              
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                >
                  <Card 
                    className="hover-elevate cursor-pointer mb-2"
                    data-testid={`card-transaction-${transaction.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant={transaction.type === 'expense' ? 'destructive' : 'default'}
                              className="text-xs"
                            >
                              {transaction.type === 'expense' ? 'Despesa' : 'Receita'}
                            </Badge>
                            {isOverdue && (
                              <Badge variant="outline" className="text-xs border-orange-600 text-orange-600">
                                Em Atraso
                              </Badge>
                            )}
                            {isPaid && (
                              <Badge variant="outline" className="text-xs border-green-600 text-green-600">
                                Pago
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="font-medium truncate" data-testid={`text-description-${transaction.id}`}>
                            {transaction.description || 'Sem descrição'}
                          </h3>
                          
                          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <span>
                              Vencimento: {transaction.dueDate ? format(new Date(transaction.dueDate), "dd 'de' MMMM", { locale: ptBR }) : '-'}
                            </span>
                            {isPaid && transaction.paidDate && (
                              <>
                                <Separator orientation="vertical" className="h-4" />
                                <span>
                                  Pago em: {format(new Date(transaction.paidDate), "dd 'de' MMMM", { locale: ptBR })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-xl font-bold ${
                            transaction.type === 'expense' ? 'text-destructive' : 'text-green-600'
                          }`}>
                            {transaction.type === 'expense' ? '-' : '+'} R$ {parseFloat(transaction.amount || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          {isPaid && transaction.paidAmount && transaction.paidAmount !== transaction.amount && (
                            <div className="text-sm text-muted-foreground">
                              Pago: R$ {parseFloat(transaction.paidAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
