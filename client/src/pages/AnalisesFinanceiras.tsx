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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  FileDown,
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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
  const [aiAnalysis, setAIAnalysis] = useState<any>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("mensal");
  const [regime, setRegime] = useState<'caixa' | 'competencia'>('caixa');
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);

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
    setAIAnalysis(null);
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

  // AI Insights mutation - Professional consultative analysis
  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/analytics/ai-insights', {
        companyId: activeCompanyId,
        month: selectedMonth,
        year: selectedYear,
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      setAIAnalysis(data);
      toast({
        title: "Análise gerada com sucesso",
        description: "Relatório consultivo completo disponível.",
      });
    },
    onError: (err) => {
      toast({
        title: "Erro ao gerar análise",
        description: (err as Error).message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingDRE || isLoadingYearly;

  // Extract current month data from yearly evolution (source of truth for totals)
  const currentMonthData = yearlyEvolution?.data?.find((m: any) => m.month === selectedMonth) || { revenues: 0, expenses: 0, profit: 0 };

  // Export PDF function
  const exportToPDF = () => {
    if (!aiAnalysis) return;

    const doc = new jsPDF();
    const monthName = months.find(m => m.value === selectedMonth)?.label || '';
    
    // Add header and title
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246); // primary color
    doc.text('Relatório Consultivo Financeiro', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(`${monthName} ${selectedYear}`, 105, 28, { align: 'center' });
    
    if (aiAnalysis.metadata?.companyName) {
      doc.setFontSize(11);
      doc.text(aiAnalysis.metadata.companyName, 105, 35, { align: 'center' });
    }
    
    let yPos = 50;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    
    // Helper function to add text with word wrap
    const addSection = (title: string, content: string, color: [number, number, number] = [0, 0, 0]) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Title
      doc.setFontSize(12);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, yPos);
      yPos += 7;
      
      // Content
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(content, maxWidth);
      doc.text(lines, margin, yPos);
      yPos += (lines.length * 5) + 8;
    };
    
    // Add sections
    if (aiAnalysis.executiveSummary) {
      addSection('Resumo Executivo', aiAnalysis.executiveSummary, [59, 130, 246]);
    }
    
    if (aiAnalysis.revenueAnalysis) {
      addSection('Análise de Receitas', aiAnalysis.revenueAnalysis, [34, 197, 94]);
    }
    
    if (aiAnalysis.expenseAnalysis) {
      addSection('Análise de Despesas', aiAnalysis.expenseAnalysis, [239, 68, 68]);
    }
    
    if (aiAnalysis.indicators) {
      addSection('Indicadores Financeiros', aiAnalysis.indicators, [59, 130, 246]);
    }
    
    if (aiAnalysis.trends) {
      addSection('Tendências', aiAnalysis.trends, [168, 85, 247]);
    }
    
    if (aiAnalysis.alerts) {
      addSection('Alertas e Riscos', aiAnalysis.alerts, [245, 158, 11]);
    }
    
    if (aiAnalysis.recommendations) {
      addSection('Recomendações Estratégicas', aiAnalysis.recommendations, [6, 182, 212]);
    }
    
    // Add insights table if available
    if (aiAnalysis.insights && aiAnalysis.insights.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Insights Rápidos', margin, yPos);
      yPos += 5;
      
      const tableData = aiAnalysis.insights.map((insight: any) => [
        insight.type === 'warning' ? 'ALERTA' : insight.type === 'success' ? 'SUCESSO' : insight.type === 'tip' ? 'DICA' : 'INFO',
        insight.title,
        insight.description
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Tipo', 'Insight', 'Descrição']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 50 },
          2: { cellWidth: 110 }
        }
      });
    }
    
    // Add footer with metadata
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        margin,
        doc.internal.pageSize.getHeight() - 10
      );
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth - margin,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );
    }
    
    // Save PDF
    doc.save(`Relatorio_Consultivo_${monthName}_${selectedYear}.pdf`);
    
    toast({
      title: "PDF exportado com sucesso",
      description: "O relatório foi salvo em seu computador.",
    });
  };

  // Helper: flatten hierarchical DRE into table rows
  const flattenDRE = (
    nodes: AccountNode[],
    rows: any[] = [],
    type: 'revenue' | 'expense' = 'revenue',
    totalRevenueForPctRevenue: number = 0
  ) => {
    nodes.forEach((n) => {
      const pctParent = isFinite(n.percentOfParent) ? n.percentOfParent : 0;
      const pctRoot = isFinite(n.percentOfRoot) ? n.percentOfRoot : 0;
      const pctRevenue = type === 'expense' && totalRevenueForPctRevenue > 0
        ? (n.total / totalRevenueForPctRevenue) * 100
        : undefined;

      // Skip zero-total nodes for analytical PDF
      if (n.total && Math.abs(n.total) > 0.000001) {
        rows.push({
          code: n.code,
          name: `${' '.repeat(Math.max(0, n.depth) * 2)}${n.name}`,
          total: n.total,
          pctParent,
          pctRoot,
          pctRevenue,
          depth: n.depth,
        });
      }

      if (n.children && n.children.length > 0) {
        flattenDRE(n.children as AccountNode[], rows, type, totalRevenueForPctRevenue);
      }
    });
    return rows;
  };

  // Helper: simple bar chart (revenues vs expenses) drawn directly on jsPDF
  const drawBarChart = (
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    monthsData: any[]
  ) => {
    const padding = 10;
    const chartX = x + padding;
    const chartY = y + padding;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const dataRevenues = monthsData.map((m) => m.revenues || 0);
    const dataExpenses = monthsData.map((m) => m.expenses || 0);
    const maxVal = Math.max(1, ...dataRevenues, ...dataExpenses);

    const barGroupW = chartW / Math.max(1, monthsData.length || 12);
    const barW = Math.max(2, (barGroupW - 6) / 2);

    // Axes
    doc.setDrawColor(200);
    doc.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);
    doc.line(chartX, chartY, chartX, chartY + chartH);

    // Bars
    monthsData.forEach((m, i) => {
      const rx = chartX + i * barGroupW + 2;
      const ex = rx + barW + 2;
      const rH = (dataRevenues[i] / maxVal) * chartH;
      const eH = (dataExpenses[i] / maxVal) * chartH;

      // Revenues (green)
      doc.setFillColor(34, 197, 94);
      doc.rect(rx, chartY + chartH - rH, barW, rH, 'F');
      // Expenses (red)
      doc.setFillColor(239, 68, 68);
      doc.rect(ex, chartY + chartH - eH, barW, eH, 'F');
    });

    // Legend
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.setFillColor(34, 197, 94);
    doc.rect(chartX, chartY - 2, 3, 3, 'F');
    doc.text('Receitas', chartX + 5, chartY + 1);
    doc.setFillColor(239, 68, 68);
    doc.rect(chartX + 40, chartY - 2, 3, 3, 'F');
    doc.text('Despesas', chartX + 45, chartY + 1);
  };

  // Export Analytical PDF (consultative and detailed)
  const exportToPDFAnalitico = () => {
    if (!aiAnalysis) return;

    const doc = new jsPDF();
    const monthName = months.find(m => m.value === selectedMonth)?.label || '';

    // Header
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text('Relatório Consultivo Financeiro (Analítico)', 105, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(100);
    const companyName = aiAnalysis.metadata?.companyName || '';
    const regimeLabel = regime === 'caixa' ? 'Regime de Caixa' : 'Regime de Competência';
    doc.text(`${companyName} • ${monthName} ${selectedYear} • ${regimeLabel}`, 105, 26, { align: 'center' });

    let yPos = 36;
    const margin = 14;
    const pageWidth = doc.internal.pageSize.getWidth();

    // KPIs block
    const kpis = [
      { label: 'Receitas', value: currentMonthData.revenues || 0, color: [34,197,94] as [number,number,number] },
      { label: 'Despesas', value: currentMonthData.expenses || 0, color: [239,68,68] as [number,number,number] },
      { label: 'Lucro', value: currentMonthData.profit || 0, color: [59,130,246] as [number,number,number] },
      { label: 'Margem Líquida', value: (currentMonthData.revenues ? (currentMonthData.profit/currentMonthData.revenues)*100 : 0), color: [99,102,241] as [number,number,number], isPercent: true },
    ];
    const boxW = (pageWidth - margin * 2 - 9) / 4;
    kpis.forEach((k, i) => {
      const x = margin + i * (boxW + 3);
      doc.setDrawColor(k.color[0], k.color[1], k.color[2]);
      doc.setLineWidth(0.6);
      doc.rect(x, yPos, boxW, 16);
      doc.setFontSize(9);
      doc.setTextColor(90);
      doc.text(k.label, x + 2, yPos + 6);
      doc.setFontSize(11);
      doc.setTextColor(k.color[0], k.color[1], k.color[2]);
      const text = (k as any).isPercent ? `${(k.value as number).toFixed(1)}%`
        : `R$ ${(k.value as number).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      doc.text(text, x + 2, yPos + 13);
    });
    yPos += 22;

    // Narrative sections (keep current AI texts)
    const writeSection = (title: string, content?: string, color: [number,number,number] = [0,0,0]) => {
      if (!content) return;
      if (yPos > 270) { doc.addPage(); yPos = 16; }
      doc.setFontSize(12); doc.setTextColor(color[0], color[1], color[2]); doc.setFont('helvetica','bold');
      doc.text(title, margin, yPos); yPos += 6;
      doc.setFontSize(10); doc.setTextColor(40); doc.setFont('helvetica','normal');
      const lines = doc.splitTextToSize(content, pageWidth - margin*2);
      doc.text(lines, margin, yPos); yPos += lines.length * 5 + 6;
    };

    writeSection('Resumo Executivo', aiAnalysis.executiveSummary, [59,130,246]);
    writeSection('Análise de Receitas', aiAnalysis.revenueAnalysis, [34,197,94]);
    writeSection('Análise de Despesas', aiAnalysis.expenseAnalysis, [239,68,68]);
    writeSection('Indicadores Financeiros', aiAnalysis.indicators, [59,130,246]);
    writeSection('Tendências', aiAnalysis.trends, [168,85,247]);
    writeSection('Alertas e Riscos', aiAnalysis.alerts, [245,158,11]);
    writeSection('Recomendações Estratégicas', aiAnalysis.recommendations, [6,182,212]);

    // DRE - Receitas
    if (dreHierarchical?.revenues?.length) {
      if (yPos > 240) { doc.addPage(); yPos = 16; }
      doc.setFontSize(12); doc.setTextColor(34,197,94); doc.setFont('helvetica','bold');
      doc.text('DRE - Receitas (hierárquico)', margin, yPos); yPos += 4;
      const revenueRows = flattenDRE(dreHierarchical.revenues as AccountNode[], [], 'revenue', currentMonthData.revenues);
      autoTable(doc, {
        startY: yPos,
        head: [["Código", "Conta", "Valor (R$)", "% Pai", "% Total"]],
        body: revenueRows.map(r => [
          r.code,
          r.name,
          (r.total as number).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          `${(r.pctParent as number).toFixed(1)}%`,
          `${(r.pctRoot as number).toFixed(1)}%`,
        ]),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [34,197,94], textColor: 255 },
        columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 78 }, 2: { cellWidth: 28, halign: 'right' }, 3: { cellWidth: 16, halign: 'right' }, 4: { cellWidth: 16, halign: 'right' } },
      });
      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // DRE - Despesas
    if (dreHierarchical?.expenses?.length) {
      if (yPos > 240) { doc.addPage(); yPos = 16; }
      doc.setFontSize(12); doc.setTextColor(239,68,68); doc.setFont('helvetica','bold');
      doc.text('DRE - Despesas (hierárquico)', margin, yPos); yPos += 4;
      const expenseRows = flattenDRE(dreHierarchical.expenses as AccountNode[], [], 'expense', currentMonthData.revenues);
      autoTable(doc, {
        startY: yPos,
        head: [["Código", "Conta", "Valor (R$)", "% Pai", "% Total", "% Receita"]],
        body: expenseRows.map(r => [
          r.code,
          r.name,
          (r.total as number).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          `${(r.pctParent as number).toFixed(1)}%`,
          `${(r.pctRoot as number).toFixed(1)}%`,
          `${(r.pctRevenue ?? 0).toFixed(1)}%`,
        ]),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [239,68,68], textColor: 255 },
        columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 70 }, 2: { cellWidth: 28, halign: 'right' }, 3: { cellWidth: 16, halign: 'right' }, 4: { cellWidth: 16, halign: 'right' }, 5: { cellWidth: 18, halign: 'right' } },
      });
      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // Top 5 tables
    const getTop = (nodes: AccountNode[]) => {
      const rows: { name: string, total: number }[] = [];
      const add = (n: AccountNode) => {
        if (n.children && n.children.length > 0) {
          (n.children as AccountNode[]).forEach((c) => rows.push({ name: c.name, total: c.total }));
        } else {
          rows.push({ name: n.name, total: n.total });
        }
      };
      nodes.forEach(add);
      return rows.sort((a,b) => b.total - a.total).slice(0,5);
    };

    const topRevenues = dreHierarchical?.revenues ? getTop(dreHierarchical.revenues as AccountNode[]) : [];
    const topExpenses = dreHierarchical?.expenses ? getTop(dreHierarchical.expenses as AccountNode[]) : [];

    if (topRevenues.length || topExpenses.length) {
      if (yPos > 230) { doc.addPage(); yPos = 16; }
      const colW = (pageWidth - margin * 2 - 6) / 2;
      // Revenues
      doc.setFontSize(11); doc.setTextColor(34,197,94); doc.setFont('helvetica','bold');
      doc.text('Top 5 Receitas', margin, yPos); doc.setTextColor(0);
      autoTable(doc, {
        startY: yPos + 3,
        head: [["Conta", "Valor (R$)"]],
        body: topRevenues.map(r => [r.name, r.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })]),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [34,197,94], textColor: 255 },
        tableWidth: colW,
        columnStyles: { 0: { cellWidth: colW - 28 }, 1: { cellWidth: 28, halign: 'right' } },
        margin: { left: margin },
      });
      // Expenses
      doc.setFontSize(11); doc.setTextColor(239,68,68); doc.setFont('helvetica','bold');
      doc.text('Top 5 Despesas', margin + colW + 6, yPos);
      autoTable(doc, {
        startY: yPos + 3,
        head: [["Conta", "Valor (R$)"]],
        body: topExpenses.map(r => [r.name, r.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })]),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [239,68,68], textColor: 255 },
        tableWidth: colW,
        columnStyles: { 0: { cellWidth: colW - 28 }, 1: { cellWidth: 28, halign: 'right' } },
        margin: { left: margin + colW + 6 },
      });
      yPos = Math.max((doc as any).lastAutoTable.finalY, yPos + 40) + 8;
    }

    // Evolution chart (drawn bars)
    if (yearlyEvolution?.data?.length) {
      if (yPos > 210) { doc.addPage(); yPos = 16; }
      doc.setFontSize(12); doc.setTextColor(59,130,246); doc.setFont('helvetica','bold');
      doc.text('Evolução Anual (Receitas x Despesas)', margin, yPos); yPos += 4;
      drawBarChart(doc, margin, yPos, pageWidth - margin * 2, 60, yearlyEvolution.data);
      yPos += 68;
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        margin,
        doc.internal.pageSize.getHeight() - 8
      );
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth - margin,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'right' }
      );
    }

    doc.save(`Relatorio_Consultivo_Analitico_${monthName}_${selectedYear}.pdf`);
    toast({
      title: 'PDF analítico exportado',
      description: 'Relatório consultivo analítico salvo com sucesso.',
    });
  };

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
    const isZero = !account.total || Math.abs(account.total) < 0.000001;
    const colorClass = isZero
      ? 'text-muted-foreground'
      : (type === 'revenue' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300');
    // Use server-calculated percentages to ensure consistency with DRE totals
    const displayPercentOfRoot = isFinite(account.percentOfRoot) ? account.percentOfRoot : 0;
    const displayPercentOfParent = isFinite(account.percentOfParent) ? account.percentOfParent : 0;

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
              {displayPercentOfRoot.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground w-16 text-right">
              {displayPercentOfParent.toFixed(1)}%
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
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setIsAIDialogOpen(true)}
              data-testid="button-ai-analysis"
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Análise IA
            </Button>
            
            <div className="h-6 w-px bg-border" />
            
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
                      <div className="flex flex-col gap-0.5">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {months.find(m => m.value === selectedMonth)?.label.slice(0, 3)}/{selectedYear}
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] h-4 px-1">
                          {regime === 'caixa' ? 'Caixa' : 'Comp.'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-0.5">Receitas</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      R$ {(currentMonthData.revenues || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </Card>

                  <Card className="p-3 border-t-2 border-t-red-500">
                    <div className="flex items-center justify-between mb-1">
                      <div className="p-1.5 rounded bg-red-100 dark:bg-red-950">
                        <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {months.find(m => m.value === selectedMonth)?.label.slice(0, 3)}/{selectedYear}
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] h-4 px-1">
                          {regime === 'caixa' ? 'Caixa' : 'Comp.'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-0.5">Despesas</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-300">
                      R$ {(currentMonthData.expenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </Card>

                  <Card className="p-3 border-t-2 border-t-blue-500">
                    <div className="flex items-center justify-between mb-1">
                      <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-950">
                        <DollarSign className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {months.find(m => m.value === selectedMonth)?.label.slice(0, 3)}/{selectedYear}
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] h-4 px-1">
                          {regime === 'caixa' ? 'Caixa' : 'Comp.'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-0.5">Lucro</p>
                    <p className={`text-lg font-bold ${(currentMonthData.profit || 0) >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                      R$ {(currentMonthData.profit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                          R$ {(currentMonthData.revenues || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                          R$ {(currentMonthData.expenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {dreHierarchical?.expenses?.map((account: AccountNode) => 
                        renderHierarchicalRow(account, 'expense')
                      )}
                    </div>

                    {/* Net Result */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border-t-2 border-blue-500">
                      <span className="text-sm font-bold">RESULTADO LÍQUIDO</span>
                      <span className={`text-lg font-bold ${(currentMonthData.profit || 0) >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                        R$ {(currentMonthData.profit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

      {/* AI Analysis Dialog - Professional Consultative Report */}
      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Relatório Consultivo - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </DialogTitle>
            <DialogDescription>
              Análise financeira completa gerada por IA com insights estratégicos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              {aiAnalysis && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportToPDF}
                  data-testid="button-export-pdf"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              )}
              {aiAnalysis && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportToPDFAnalitico}
                  data-testid="button-export-pdf-analytic"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar PDF (Analítico)
                </Button>
              )}
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => generateInsightsMutation.mutate()}
                disabled={generateInsightsMutation.isPending}
                data-testid="button-generate-analysis"
              >
                {generateInsightsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Análise
                  </>
                )}
              </Button>
            </div>

            {/* Analysis Display */}
            {aiAnalysis ? (
              <div className="space-y-6">
                {/* Executive Summary */}
                {aiAnalysis.executiveSummary && (
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-primary">Resumo Executivo</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{aiAnalysis.executiveSummary}</p>
                  </div>
                )}

                {/* Revenue Analysis */}
                {aiAnalysis.revenueAnalysis && (
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-green-700 dark:text-green-400">Análise de Receitas</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{aiAnalysis.revenueAnalysis}</p>
                  </div>
                )}

                {/* Expense Analysis */}
                {aiAnalysis.expenseAnalysis && (
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-red-700 dark:text-red-400">Análise de Despesas</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{aiAnalysis.expenseAnalysis}</p>
                  </div>
                )}

                {/* Financial Indicators */}
                {aiAnalysis.indicators && (
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-blue-700 dark:text-blue-400">Indicadores Financeiros</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{aiAnalysis.indicators}</p>
                  </div>
                )}

                {/* Trends */}
                {aiAnalysis.trends && (
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-purple-700 dark:text-purple-400">Tendências</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{aiAnalysis.trends}</p>
                  </div>
                )}

                {/* Alerts */}
                {aiAnalysis.alerts && (
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-amber-700 dark:text-amber-400">Alertas e Riscos</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{aiAnalysis.alerts}</p>
                  </div>
                )}

                {/* Recommendations */}
                {aiAnalysis.recommendations && (
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-cyan-700 dark:text-cyan-400">Recomendações Estratégicas</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{aiAnalysis.recommendations}</p>
                  </div>
                )}

                {/* Quick Insights Cards */}
                {aiAnalysis.insights && aiAnalysis.insights.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-base font-bold">Insights Rápidos</h3>
                    <div className="space-y-2">
                      {aiAnalysis.insights.map((insight: any, index: number) => {
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
                          <div key={index} className={`p-2.5 rounded-md ${bgClass}`}>
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
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h3 className="font-semibold text-lg mb-2">Relatório Consultivo Profissional</h3>
                <p className="text-sm max-w-md mx-auto mb-1">
                  Clique em "Gerar Análise" para criar um relatório completo com:
                </p>
                <ul className="text-xs text-left max-w-md mx-auto mt-3 space-y-1">
                  <li>• Resumo executivo da situação financeira</li>
                  <li>• Análise detalhada de receitas e despesas</li>
                  <li>• Indicadores financeiros calculados</li>
                  <li>• Tendências e comparações históricas</li>
                  <li>• Alertas e pontos de atenção</li>
                  <li>• Recomendações estratégicas acionáveis</li>
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
