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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, ChevronDown, Check, Loader2, FileText, Mic, Plus, X, Lock } from "lucide-react";
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
  onAccountsChange: (accounts: GeneratedAccount[]) => void;
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

export function ChartPreviewTree({ open, onOpenChange, accounts, onAccountsChange, onRetry }: ChartPreviewTreeProps) {
  const { toast } = useToast();
  // Start with all nodes expanded
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => 
    new Set(accounts.map(acc => acc.code))
  );
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Add account dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: '',
    description: '',
    parentCode: '',
  });

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

  // Delete account
  const handleDeleteAccount = (code: string) => {
    // Block deletion of root accounts (1-5)
    const rootCodes = ['1', '2', '3', '4', '5'];
    if (rootCodes.includes(code)) {
      toast({
        title: "Conta protegida",
        description: "As contas raízes (Ativo, Passivo, Patrimônio Líquido, Receitas, Despesas) não podem ser excluídas.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if account has children
    const hasChildren = accounts.some(acc => acc.parentCode === code);
    
    if (hasChildren) {
      toast({
        title: "Não é possível excluir",
        description: "Esta conta possui subcontas. Exclua as subcontas primeiro.",
        variant: "destructive",
      });
      return;
    }
    
    // Remove account
    const updatedAccounts = accounts.filter(acc => acc.code !== code);
    onAccountsChange(updatedAccounts);
    
    toast({
      title: "Conta removida",
      description: "A conta foi removida do preview",
    });
  };

  // Generate next code for a parent
  const generateNextCode = (parentCode: string): string => {
    // Get all children of this parent
    const siblings = accounts.filter(acc => acc.parentCode === parentCode);
    
    if (siblings.length === 0) {
      // First child - determine format based on parent level
      const parentLevel = parentCode.split('.').length;
      
      if (parentLevel === 1) {
        // Level 2: X.1
        return `${parentCode}.1`;
      } else if (parentLevel === 2) {
        // Level 3: X.X.1
        return `${parentCode}.1`;
      } else if (parentLevel === 3) {
        // Level 4: X.X.X.01
        return `${parentCode}.01`;
      } else {
        // Level 5: X.X.X.XX.001
        return `${parentCode}.001`;
      }
    }
    
    // Find the highest number among siblings
    const siblingNumbers = siblings.map(sibling => {
      const parts = sibling.code.split('.');
      const lastPart = parts[parts.length - 1];
      return parseInt(lastPart, 10);
    }).filter(n => !isNaN(n));
    
    const maxNumber = Math.max(...siblingNumbers, 0);
    const nextNumber = maxNumber + 1;
    
    // Format based on level
    const parentLevel = parentCode.split('.').length;
    let formattedNumber: string;
    
    if (parentLevel === 1 || parentLevel === 2) {
      formattedNumber = nextNumber.toString();
    } else if (parentLevel === 3) {
      formattedNumber = nextNumber.toString().padStart(2, '0');
    } else {
      formattedNumber = nextNumber.toString().padStart(3, '0');
    }
    
    return `${parentCode}.${formattedNumber}`;
  };

  // Add new account
  const handleAddAccount = () => {
    if (!newAccount.name || !newAccount.type || !newAccount.parentCode) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, tipo e conta pai",
        variant: "destructive",
      });
      return;
    }
    
    // Normalize parent code (trim and remove empty segments)
    const normalizedParentCode = newAccount.parentCode.trim().replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
    
    // Validate parent code format
    if (!/^[0-9]+(\.[0-9]+)*$/.test(normalizedParentCode)) {
      toast({
        title: "Código inválido",
        description: "O código da conta pai deve conter apenas números separados por pontos (ex: 2.1 ou 2.1.1)",
        variant: "destructive",
      });
      return;
    }
    
    // Verify parent exists
    const parentExists = accounts.some(acc => acc.code === normalizedParentCode) || 
                        ['1', '2', '3', '4', '5'].includes(normalizedParentCode);
    
    if (!parentExists) {
      toast({
        title: "Conta pai inválida",
        description: "A conta pai especificada não existe",
        variant: "destructive",
      });
      return;
    }
    
    // Check depth limit (max 5 levels)
    const parentLevel = normalizedParentCode.split('.').length;
    if (parentLevel >= 5) {
      toast({
        title: "Limite de níveis atingido",
        description: "O plano de contas permite no máximo 5 níveis hierárquicos. Esta conta já está no nível máximo.",
        variant: "destructive",
      });
      return;
    }
    
    // Generate code
    const code = generateNextCode(normalizedParentCode);
    
    // Create account
    const account: GeneratedAccount = {
      code,
      name: newAccount.name,
      type: newAccount.type,
      description: newAccount.description,
      parentCode: normalizedParentCode,
    };
    
    // Add to accounts
    const updatedAccounts = [...accounts, account];
    onAccountsChange(updatedAccounts);
    
    // Reset form
    setNewAccount({
      name: '',
      type: '',
      description: '',
      parentCode: '',
    });
    setShowAddDialog(false);
    
    // Expand parent to show new account
    setExpandedNodes(prev => new Set([...Array.from(prev), normalizedParentCode]));
    
    toast({
      title: "Conta adicionada",
      description: `Conta ${code} - ${newAccount.name} adicionada com sucesso`,
    });
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
    const isRootAccount = ['1', '2', '3', '4', '5'].includes(node.code);

    return (
      <div key={node.code}>
        <div
          className={`flex items-start gap-2 p-2 rounded group relative ${
            depth > 0 ? 'ml-6' : ''
          }`}
        >
          {/* Expand/Collapse icon */}
          <div 
            className="w-5 h-5 flex items-center justify-center flex-shrink-0 cursor-pointer"
            onClick={() => hasChildren && toggleNode(node.code)}
          >
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
              {isRootAccount && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span className="text-[10px]">Protegida</span>
                </div>
              )}
            </div>
            <div className="text-sm font-medium mt-0.5">{node.name}</div>
            {node.description && (
              <div className="text-xs text-muted-foreground mt-0.5">{node.description}</div>
            )}
          </div>
          
          {/* Delete button - shown on hover, hidden for root accounts */}
          {!isRootAccount && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteAccount(node.code);
              }}
              data-testid={`button-delete-account-${node.code}`}
            >
              <X className="h-3 w-3 text-destructive" />
            </Button>
          )}
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
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            size="sm" 
            variant="default" 
            onClick={() => setShowAddDialog(true)}
            data-testid="button-add-account"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Conta
          </Button>
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

      {/* Add Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Conta</DialogTitle>
            <DialogDescription>
              Adicione uma nova conta ao plano. O código será gerado automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="account-name">
                Nome da Conta <span className="text-destructive">*</span>
              </Label>
              <Input
                id="account-name"
                value={newAccount.name}
                onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Material de Escritório"
                data-testid="input-account-name"
              />
            </div>

            <div>
              <Label htmlFor="account-type">
                Tipo <span className="text-destructive">*</span>
              </Label>
              <Select
                value={newAccount.type}
                onValueChange={(value) => setNewAccount(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="account-type" data-testid="select-account-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="passivo">Passivo</SelectItem>
                  <SelectItem value="patrimonio_liquido">Patrimônio Líquido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="parent-code">
                Conta Pai <span className="text-destructive">*</span>
              </Label>
              <Input
                id="parent-code"
                value={newAccount.parentCode}
                onChange={(e) => setNewAccount(prev => ({ ...prev, parentCode: e.target.value }))}
                placeholder="Ex: 2.1 ou 2.1.1"
                data-testid="input-parent-code"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Digite o código da conta pai (ex: 1, 2, 2.1, 2.1.1)
              </p>
            </div>

            <div>
              <Label htmlFor="account-description">Descrição</Label>
              <Textarea
                id="account-description"
                value={newAccount.description}
                onChange={(e) => setNewAccount(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição da conta (opcional)"
                rows={3}
                data-testid="input-account-description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewAccount({ name: '', type: '', description: '', parentCode: '' });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddAccount} data-testid="button-confirm-add">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
