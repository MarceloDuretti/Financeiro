import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChartAccountSchema } from "@shared/schema";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";

type FormValues = z.infer<typeof insertChartAccountSchema>;

export default function PlanoContas() {
  const { toast } = useToast();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [createRootOpen, setCreateRootOpen] = useState(false);
  const [createChildOpen, setCreateChildOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ChartAccount | null>(null);
  const [parentAccount, setParentAccount] = useState<ChartAccount | null>(null);

  // Fetch accounts
  const { data: accounts = [], isLoading } = useQuery<ChartAccount[]>({
    queryKey: ["/api/chart-of-accounts"],
  });

  // Build tree structure
  const accountTree = buildAccountTree(accounts);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("POST", "/api/chart-of-accounts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chart-of-accounts"] });
      toast({
        title: "Conta criada",
        description: "A conta foi criada com sucesso.",
      });
      setCreateRootOpen(false);
      setCreateChildOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro ao criar a conta.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormValues> }) => {
      return await apiRequest("PATCH", `/api/chart-of-accounts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chart-of-accounts"] });
      toast({
        title: "Conta atualizada",
        description: "A conta foi atualizada com sucesso.",
      });
      setEditOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar conta",
        description: error.message || "Ocorreu um erro ao atualizar a conta.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/chart-of-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chart-of-accounts"] });
      toast({
        title: "Conta excluída",
        description: "A conta foi excluída com sucesso.",
      });
      setDeleteOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir conta",
        description: error.message || "Ocorreu um erro ao excluir a conta.",
        variant: "destructive",
      });
    },
  });

  // Form for creating root account
  const createRootForm = useForm<FormValues>({
    resolver: zodResolver(insertChartAccountSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "receita",
      parentId: null,
    },
  });

  // Form for creating child account
  const createChildForm = useForm<FormValues>({
    resolver: zodResolver(insertChartAccountSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "receita",
      parentId: null,
    },
  });

  // Form for editing account
  const editForm = useForm<FormValues>({
    resolver: zodResolver(insertChartAccountSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "receita",
      parentId: null,
    },
  });

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

  // Open create root dialog
  const openCreateRootDialog = () => {
    createRootForm.reset({
      name: "",
      description: "",
      type: "receita",
      parentId: null,
    });
    setCreateRootOpen(true);
  };

  // Open create child dialog
  const openCreateChildDialog = (parent: ChartAccount) => {
    setParentAccount(parent);
    createChildForm.reset({
      name: "",
      description: "",
      type: parent.type, // Inherit parent type
      parentId: parent.id,
    });
    setCreateChildOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (account: ChartAccount) => {
    setSelectedAccount(account);
    editForm.reset({
      name: account.name,
      description: account.description || "",
      type: account.type,
      parentId: account.parentId,
    });
    setEditOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (account: ChartAccount) => {
    setSelectedAccount(account);
    setDeleteOpen(true);
  };

  // Handle create root submit
  const onCreateRootSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  // Handle create child submit
  const onCreateChildSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  // Handle edit submit
  const onEditSubmit = (data: FormValues) => {
    if (!selectedAccount) return;
    updateMutation.mutate({ id: selectedAccount.id, data });
  };

  // Handle delete confirm
  const onDeleteConfirm = () => {
    if (!selectedAccount) return;
    
    // Check if has children
    const childCount = accounts.filter(a => a.parentId === selectedAccount.id).length;
    if (childCount > 0) {
      toast({
        title: "Não é possível excluir",
        description: `Esta conta possui ${childCount} subconta(s). Exclua as subcontas primeiro.`,
        variant: "destructive",
      });
      setDeleteOpen(false);
      return;
    }
    
    deleteMutation.mutate(selectedAccount.id);
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
              onClick={() => openCreateChildDialog(node)}
              data-testid={`button-add-child-${node.id}`}
              title="Adicionar subconta"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openEditDialog(node)}
              data-testid={`button-edit-${node.id}`}
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openDeleteDialog(node)}
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
          <Button onClick={openCreateRootDialog} data-testid="button-create-root">
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
                <Button size="lg" onClick={openCreateRootDialog} data-testid="button-create-first-account">
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

        {/* Create Root Account Dialog */}
        <Dialog open={createRootOpen} onOpenChange={setCreateRootOpen}>
          <DialogContent data-testid="dialog-create-root">
            <DialogHeader>
              <DialogTitle>Nova Conta Raiz</DialogTitle>
              <DialogDescription>
                Crie uma nova conta de nível superior no plano de contas.
              </DialogDescription>
            </DialogHeader>
            <Form {...createRootForm}>
              <form onSubmit={createRootForm.handleSubmit(onCreateRootSubmit)} className="space-y-4">
                <FormField
                  control={createRootForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Conta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Receitas" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createRootForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="receita">Receita</SelectItem>
                          <SelectItem value="despesa">Despesa</SelectItem>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="passivo">Passivo</SelectItem>
                          <SelectItem value="patrimonio_liquido">Patrimônio Líquido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        O tipo define a natureza contábil da conta.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createRootForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a finalidade desta conta..."
                          {...field}
                          value={field.value || ""}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateRootOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createMutation.isPending ? "Criando..." : "Criar Conta"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Create Child Account Dialog */}
        <Dialog open={createChildOpen} onOpenChange={setCreateChildOpen}>
          <DialogContent data-testid="dialog-create-child">
            <DialogHeader>
              <DialogTitle>Nova Subconta</DialogTitle>
              <DialogDescription>
                Crie uma subconta para: {parentAccount?.fullPathName}
              </DialogDescription>
            </DialogHeader>
            <Form {...createChildForm}>
              <form onSubmit={createChildForm.handleSubmit(onCreateChildSubmit)} className="space-y-4">
                <FormField
                  control={createChildForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Subconta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Vendas à Vista" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createChildForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="receita">Receita</SelectItem>
                          <SelectItem value="despesa">Despesa</SelectItem>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="passivo">Passivo</SelectItem>
                          <SelectItem value="patrimonio_liquido">Patrimônio Líquido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Geralmente deve ser o mesmo tipo da conta pai.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createChildForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a finalidade desta conta..."
                          {...field}
                          value={field.value || ""}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateChildOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createMutation.isPending ? "Criando..." : "Criar Subconta"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Account Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent data-testid="dialog-edit">
            <DialogHeader>
              <DialogTitle>Editar Conta</DialogTitle>
              <DialogDescription>
                Editar: {selectedAccount?.fullPathName}
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Conta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Receitas" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="receita">Receita</SelectItem>
                          <SelectItem value="despesa">Despesa</SelectItem>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="passivo">Passivo</SelectItem>
                          <SelectItem value="patrimonio_liquido">Patrimônio Líquido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a finalidade desta conta..."
                          {...field}
                          value={field.value || ""}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-submit"
                  >
                    {updateMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Account AlertDialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent data-testid="dialog-delete">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a conta{" "}
                <strong>{selectedAccount?.fullPathName}</strong>?
                <br />
                <br />
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDeleteConfirm}
                disabled={deleteMutation.isPending}
                data-testid="button-confirm"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
