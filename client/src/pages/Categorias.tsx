import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Search,
  Lightbulb,
  Target,
  BarChart3,
} from "lucide-react";
import type { Category } from "@shared/schema";
import { formatCategoryCode } from "@/lib/formatters";

const categorySchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  description: z.string().optional(),
  type: z.enum(["receita", "despesa"], { required_error: "Selecione o tipo" }),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor inválida"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const PRESET_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
];

export default function Categorias() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "receita" | "despesa">("all");

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      type: "despesa",
      color: "#3B82F6",
    },
  });

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      return await apiRequest('POST', '/api/categories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Categoria criada",
        description: "A categoria foi criada com sucesso.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro ao criar categoria",
        description: "Ocorreu um erro ao criar a categoria.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryFormData }) => {
      return await apiRequest('PATCH', `/api/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso.",
      });
      setIsDialogOpen(false);
      setEditingCategory(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar categoria",
        description: "Ocorreu um erro ao atualizar a categoria.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });
      setDeletingId(null);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir categoria",
        description: "Ocorreu um erro ao excluir a categoria.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      description: category.description || "",
      type: category.type as "receita" | "despesa",
      color: category.color,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  const onSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const formattedCode = formatCategoryCode(cat.code, cat.type as 'receita' | 'despesa');
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formattedCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || cat.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const receitasCount = categories.filter((c) => c.type === "receita").length;
  const despesasCount = categories.filter((c) => c.type === "despesa").length;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Categorias</h1>
        <p className="text-muted-foreground">
          Organize e categorize suas transações financeiras
        </p>
      </div>

      {/* Educational Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-elevate">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-base">O que são?</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Categorias ajudam a classificar suas receitas e despesas, facilitando
              a análise de onde vem e para onde vai seu dinheiro.
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm">
                <Target className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-base">Exemplos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              <strong>Receitas:</strong> Vendas, Serviços<br />
              <strong>Despesas:</strong> Aluguel, Salários, Marketing
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-sm">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-base">Benefícios</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Relatórios detalhados, controle de gastos por setor e
              identificação de oportunidades de economia.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Categorias</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{receitasCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{despesasCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-category"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
            <SelectTrigger className="w-[150px]" data-testid="select-filter-type">
              <SelectValue placeholder="Filtrar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="receita">Receitas</SelectItem>
              <SelectItem value="despesa">Despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-category">
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Atualize as informações da categoria."
                  : "Preencha os dados para criar uma nova categoria."}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-category-type">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="receita">Receita</SelectItem>
                            <SelectItem value="despesa">Despesa</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Categoria</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ex: Salários"
                          data-testid="input-category-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descreva o uso desta categoria..."
                          rows={3}
                          data-testid="input-category-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor do Badge</FormLabel>
                      <div className="flex gap-2">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => field.onChange(color)}
                            className={`h-8 w-8 rounded-md border-2 transition-all hover-elevate ${
                              field.value === color
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border"
                            }`}
                            style={{ backgroundColor: color }}
                            data-testid={`color-${color}`}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel-category"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-category"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Salvando..."
                      : editingCategory
                      ? "Atualizar"
                      : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <p className="text-muted-foreground">Carregando categorias...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center gap-2">
            <p className="text-muted-foreground">
              {searchTerm || typeFilter !== "all"
                ? "Nenhuma categoria encontrada com os filtros aplicados."
                : "Nenhuma categoria cadastrada ainda."}
            </p>
            {!searchTerm && typeFilter === "all" && (
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(true)}
                data-testid="button-create-first-category"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira categoria
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <Card
              key={category.id}
              className="hover-elevate"
              data-testid={`card-category-${category.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <Badge
                      style={{ backgroundColor: category.color }}
                      className="text-white shrink-0"
                    >
                      {formatCategoryCode(category.code, category.type as 'receita' | 'despesa')}
                    </Badge>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <CardTitle className="text-base truncate">
                        {category.name}
                      </CardTitle>
                      {category.type === "receita" ? (
                        <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                      data-testid={`button-edit-category-${category.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingId(category.id)}
                      data-testid={`button-delete-category-${category.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {category.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              data-testid="button-confirm-delete"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
