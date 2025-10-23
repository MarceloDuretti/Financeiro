import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PiggyBank,
  Folder,
  FolderOpen,
  FileText,
} from "lucide-react";
import { buildAccountTree, hasChildren, type ChartAccountNode } from "@/lib/chartAccountUtils";
import type { ChartAccount } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlanoContas() {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Fetch accounts
  const { data: accounts = [], isLoading } = useQuery<ChartAccount[]>({
    queryKey: ["/api/chart-of-accounts"],
  });

  // Build tree structure
  const accountTree = buildAccountTree(accounts);

  // Toggle node expansion
  const toggleExpand = (accountId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  // Get icon based on account type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "receita":
        return <TrendingUp className="h-4 w-4" />;
      case "despesa":
        return <TrendingDown className="h-4 w-4" />;
      case "ativo":
        return <Wallet className="h-4 w-4" />;
      case "passivo":
        return <CreditCard className="h-4 w-4" />;
      case "patrimonio_liquido":
        return <PiggyBank className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get type color
  const getTypeColor = (type: string): string => {
    switch (type) {
      case "receita":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "despesa":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      case "ativo":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "passivo":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "patrimonio_liquido":
        return "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  // Get type label
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case "receita":
        return "Receita";
      case "despesa":
        return "Despesa";
      case "ativo":
        return "Ativo";
      case "passivo":
        return "Passivo";
      case "patrimonio_liquido":
        return "Patrimônio Líquido";
      default:
        return type;
    }
  };

  // Render tree node
  const renderNode = (node: ChartAccountNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildNodes = node.children.length > 0;

    return (
      <div key={node.id} data-testid={`account-node-${node.id}`}>
        <div
          className="flex items-center gap-2 py-2 px-3 hover-elevate rounded-md"
          style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
        >
          {/* Expand/collapse button */}
          <button
            onClick={() => toggleExpand(node.id)}
            className="flex-shrink-0"
            data-testid={`button-toggle-${node.id}`}
            disabled={!hasChildNodes}
          >
            {hasChildNodes ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <div className="w-4" />
            )}
          </button>

          {/* Folder/File icon */}
          <div className="flex-shrink-0 text-muted-foreground">
            {hasChildNodes ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4" />
              ) : (
                <Folder className="h-4 w-4" />
              )
            ) : (
              getTypeIcon(node.type)
            )}
          </div>

          {/* Code */}
          <span
            className="font-mono text-sm text-muted-foreground min-w-[60px]"
            data-testid={`text-code-${node.id}`}
          >
            {node.code}
          </span>

          {/* Name */}
          <span
            className="font-medium flex-1"
            data-testid={`text-name-${node.id}`}
          >
            {node.name}
          </span>

          {/* Type badge */}
          <Badge
            variant="outline"
            className={getTypeColor(node.type)}
            data-testid={`badge-type-${node.id}`}
          >
            {getTypeLabel(node.type)}
          </Badge>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              data-testid={`button-add-child-${node.id}`}
              title="Adicionar subconta"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              data-testid={`button-edit-${node.id}`}
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              data-testid={`button-delete-${node.id}`}
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildNodes && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
          <Card className="p-6">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
              Plano de Contas
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
              Estrutura hierárquica de contas contábeis
            </p>
          </div>
          <Button data-testid="button-create-root">
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta Raiz
          </Button>
        </div>

        {/* Educational section (only show when no accounts) */}
        {accounts.length === 0 && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Folder className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    O que é o Plano de Contas?
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    O Plano de Contas é uma estrutura hierárquica que organiza todas as
                    contas contábeis da sua empresa. Ele funciona como uma árvore, onde
                    cada conta pode ter subcontas, facilitando o controle financeiro.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-medium">Tipos de contas:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm"><strong>Receita:</strong> Entradas de dinheiro</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm"><strong>Despesa:</strong> Saídas de dinheiro</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-blue-600" />
                        <span className="text-sm"><strong>Ativo:</strong> Bens e direitos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-amber-600" />
                        <span className="text-sm"><strong>Passivo:</strong> Obrigações</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PiggyBank className="h-4 w-4 text-violet-600" />
                        <span className="text-sm"><strong>Patrimônio:</strong> Capital da empresa</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center pt-2">
                <Button size="lg" data-testid="button-create-first-account">
                  <Plus className="h-5 w-5 mr-2" />
                  Criar primeira conta
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Account tree */}
        {accounts.length > 0 && (
          <Card className="p-4">
            <div className="space-y-1">
              {accountTree.map(node => renderNode(node, 0))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
