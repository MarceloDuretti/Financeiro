import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronDown, FolderOpen, Folder, FileText, FolderTree } from "lucide-react";
import { buildAccountTree, type ChartAccountNode } from "@/lib/chartAccountUtils";
import type { ChartAccount } from "@shared/schema";

interface ChartAccountPickerProps {
  accounts: ChartAccount[];
  value: string | null;
  onChange: (accountId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChartAccountPicker({ 
  accounts, 
  value, 
  onChange, 
  placeholder = "Selecione uma conta",
  disabled = false 
}: ChartAccountPickerProps) {
  const [open, setOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Get selected account name
  const selectedAccount = accounts.find(acc => acc.id === value);
  const displayValue = selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : "";

  // Build tree
  const accountTree = buildAccountTree(accounts);

  // Toggle node expansion
  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Handle account selection
  const handleSelect = (node: ChartAccountNode) => {
    // Only allow selection of leaf nodes (accounts without children)
    if (node.children.length === 0) {
      onChange(node.id);
      setOpen(false);
    }
  };

  // Render tree node
  const renderNode = (node: ChartAccountNode, depth: number = 0): JSX.Element => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = node.id === value;
    const isSelectable = !hasChildren;
    const indentSize = 20;

    // Type colors
    const getTypeColor = () => {
      switch (node.type) {
        case "receita":
          return "text-green-600 dark:text-green-400";
        case "despesa":
          return "text-red-600 dark:text-red-400";
        case "ativo":
          return "text-blue-600 dark:text-blue-400";
        case "passivo":
          return "text-amber-600 dark:text-amber-400";
        case "patrimonio_liquido":
          return "text-violet-600 dark:text-violet-400";
        default:
          return "text-muted-foreground";
      }
    };

    const typeColor = getTypeColor();

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 py-1.5 px-2 rounded-md transition-all ${
            isSelected ? 'bg-primary/10 border border-primary/20' : 
            isSelectable ? 'hover-elevate cursor-pointer' : 
            'cursor-default'
          } ${!isSelectable ? 'opacity-60' : ''}`}
          style={{ paddingLeft: `${depth * indentSize + 8}px` }}
          onClick={() => isSelectable && handleSelect(node)}
          data-testid={`chart-account-option-${node.id}`}
        >
          {/* Expand/collapse button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpand(node.id);
            }}
            className="flex-shrink-0 hover:bg-accent rounded p-0.5 transition-colors"
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <div className="w-4" />
            )}
          </button>

          {/* Icon */}
          <div className="flex-shrink-0">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className={`h-4 w-4 ${typeColor}`} />
              ) : (
                <Folder className={`h-4 w-4 ${typeColor}`} />
              )
            ) : (
              <FileText className={`h-4 w-4 ${typeColor}`} />
            )}
          </div>

          {/* Code and Name */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
              {node.code}
            </span>
            <span className={`text-sm truncate ${isSelected ? 'font-medium' : ''}`}>
              {node.name}
            </span>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Input field with trigger button */}
      <div className="flex gap-1">
        <Input
          value={displayValue}
          placeholder={placeholder}
          readOnly
          className="flex-1 cursor-pointer h-6 text-[10px] px-2"
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled}
          data-testid="input-chart-account-picker"
        />
        <Button
          type="button"
          variant="outline"
          className="h-6 w-6 p-0"
          onClick={() => setOpen(true)}
          disabled={disabled}
          data-testid="button-open-chart-account-picker"
        >
          <FolderTree className="h-3 w-3" />
        </Button>
      </div>

      {/* Tree picker dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Selecione uma Conta</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto border rounded-md p-2">
            {accountTree.length > 0 ? (
              <div className="space-y-0.5">
                {accountTree.map((node) => renderNode(node, 0))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhuma conta disponível
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            💡 Apenas contas sem filhos podem ser selecionadas
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
