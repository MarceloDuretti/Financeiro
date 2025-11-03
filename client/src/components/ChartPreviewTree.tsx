import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, ChevronDown, Check, Loader2, FileText, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface GeneratedAccount {
  code: string;
  name: string;
  type: string;
  description: string;
  parentCode: string | null;
}

interface ChartPreviewTreeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: GeneratedAccount[];
  onRetry?: () => void;
}

interface AccountNode extends GeneratedAccount {
  children: AccountNode[];
}

// Build tree structure
function buildTree(accounts: GeneratedAccount[]): AccountNode[] {
  const nodeMap = new Map<string, AccountNode>();
  const roots: AccountNode[] = [];

  // Create all nodes
  accounts.forEach(acc => {
    nodeMap.set(acc.code, { ...acc, children: [] });
  });

  // Build hierarchy
  accounts.forEach(acc => {
    const node = nodeMap.get(acc.code)!;
    if (acc.parentCode && nodeMap.has(acc.parentCode)) {
      const parent = nodeMap.get(acc.parentCode)!;
      parent.children.push(node);
    } else {
      // Root level accounts
      roots.push(node);
    }
  });

  // Sort by code
  const sortByCode = (nodes: AccountNode[]) => {
    nodes.sort((a, b) => a.code.localeCompare(b.code));
    nodes.forEach(node => {
      if (node.children.length > 0) {
        sortByCode(node.children);
      }
    });
  };

  sortByCode(roots);
  return roots;
}

// Get type badge color
function getTypeBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    'receita': 'bg-green-600',
    'despesa': 'bg-red-600',
    'ativo': 'bg-blue-600',
    'passivo': 'bg-orange-600',
    'patrimonio_liquido': 'bg-purple-600',
  };
  return colors[type] || 'bg-gray-600';
}

// Get type label
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'receita': 'Receita',
    'despesa': 'Despesa',
    'ativo': 'Ativo',
    'passivo': 'Passivo',
    'patrimonio_liquido': 'Patrimônio',
  };
  return labels[type] || type;
}

export function ChartPreviewTree({ open, onOpenChange, accounts, onRetry }: ChartPreviewTreeProps) {
  const { toast } = useToast();
  // Start with all nodes expanded
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => 
    new Set(accounts.map(acc => acc.code))
  );
  const [isConfirming, setIsConfirming] = useState(false);

  // Build tree
  const tree = buildTree(accounts);

  // Toggle node expansion
  const toggleNode = (code: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      return newSet;
    });
  };

  // Expand all
  const expandAll = () => {
    const allCodes = new Set(accounts.map(acc => acc.code));
    setExpandedNodes(allCodes);
  };

  // Collapse all
  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Confirm and insert accounts
  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const response = await fetch('/api/chart-of-accounts/confirm-ai-generated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao confirmar plano');
      }

      const data = await response.json();

      toast({
        title: "Plano criado!",
        description: data.message || "Plano de contas criado com sucesso",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/chart-of-accounts"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error confirming accounts:', error);
      toast({
        title: "Erro ao confirmar",
        description: error.message || "Não foi possível criar o plano",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // Render tree node
  const renderNode = (node: AccountNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.code);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.code}>
        <div
          className={`flex items-start gap-2 p-2 rounded hover-elevate cursor-pointer ${
            depth > 0 ? 'ml-6' : ''
          }`}
          onClick={() => hasChildren && toggleNode(node.code)}
        >
          {/* Expand/Collapse icon */}
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <FileText className="h-3 w-3 text-muted-foreground" />
            )}
          </div>

          {/* Account info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted-foreground">{node.code}</span>
              {depth === 0 && (
                <Badge className={`text-[10px] h-5 px-1.5 ${getTypeBadgeColor(node.type)}`}>
                  {getTypeLabel(node.type)}
                </Badge>
              )}
            </div>
            <div className="text-sm font-medium mt-0.5">{node.name}</div>
            {node.description && (
              <div className="text-xs text-muted-foreground mt-0.5">{node.description}</div>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Group accounts by root type
  const accountsByType = accounts.reduce((acc, account) => {
    const rootCode = account.code.split('.')[0];
    if (!acc[rootCode]) acc[rootCode] = [];
    acc[rootCode].push(account);
    return acc;
  }, {} as Record<string, GeneratedAccount[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pré-visualização do Plano de Contas</DialogTitle>
          <DialogDescription>
            Revise o plano gerado pela IA. Você pode expandir/recolher níveis para visualizar melhor.
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.entries(accountsByType).map(([rootCode, accs]) => {
            const sampleType = accs[0]?.type || '';
            return (
              <Card key={rootCode} className="p-2">
                <div className="text-xs text-muted-foreground">
                  {getTypeLabel(sampleType)}
                </div>
                <div className="text-lg font-bold">{accs.length}</div>
              </Card>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={expandAll}>
            Expandir Tudo
          </Button>
          <Button size="sm" variant="outline" onClick={collapseAll}>
            Recolher Tudo
          </Button>
          <div className="ml-auto text-sm text-muted-foreground">
            Total: {accounts.length} contas
          </div>
        </div>

        {/* Tree */}
        <ScrollArea className="h-[400px] border rounded-lg p-2">
          <div className="space-y-1">
            {tree.map(node => renderNode(node))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            Cancelar
          </Button>
          {onRetry && (
            <Button
              variant="outline"
              onClick={onRetry}
              disabled={isConfirming}
              className="mr-auto"
            >
              <Mic className="h-4 w-4 mr-2" />
              Nova Gravação
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmar e Criar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
