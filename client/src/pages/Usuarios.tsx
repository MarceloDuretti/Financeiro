import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UserPlus, Mail, Building2, ToggleLeft, ToggleRight, Send, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCollaboratorSchema, type CreateCollaboratorData, type User, type Company } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";

interface CollaboratorWithCompanies extends Omit<User, "password"> {
  companies: Company[];
}

export default function Usuarios() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: collaborators = [], isLoading } = useQuery<CollaboratorWithCompanies[]>({
    queryKey: ["/api/collaborators"],
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const form = useForm<CreateCollaboratorData>({
    resolver: zodResolver(createCollaboratorSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      companyIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateCollaboratorData) => {
      return await apiRequest("POST", "/api/collaborators", data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaborators"] });
      setIsCreateDialogOpen(false);
      form.reset();
      
      if (data.emailSent) {
        toast({
          title: "Colaborador criado!",
          description: `Convite enviado para ${data.email}`,
        });
      } else {
        toast({
          title: "Colaborador criado",
          description: "Mas houve erro ao enviar o email. Configure as credenciais do Gmail.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar colaborador",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/collaborators/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaborators"] });
      toast({
        title: "Status atualizado",
        description: "O status do colaborador foi alterado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status",
        variant: "destructive",
      });
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/collaborators/${id}/resend-invite`, {});
    },
    onSuccess: (data: any) => {
      if (data.emailSent) {
        toast({
          title: "Convite reenviado",
          description: "O email foi enviado novamente",
        });
      } else {
        toast({
          title: "Erro ao enviar email",
          description: "Configure as credenciais do Gmail nas variáveis de ambiente",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível reenviar o convite",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateCollaboratorData) => {
    createMutation.mutate(data);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="secondary" className="gap-1.5 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" data-testid={`badge-status-active`}>
            <CheckCircle2 className="h-3 w-3" />
            Ativo
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary" className="gap-1.5 bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" data-testid={`badge-status-inactive`}>
            <XCircle className="h-3 w-3" />
            Inativo
          </Badge>
        );
      case "pending_first_access":
        return (
          <Badge variant="secondary" className="gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" data-testid={`badge-status-pending`}>
            <Clock className="h-3 w-3" />
            Aguardando
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" data-testid={`badge-status-unknown`}>
            Desconhecido
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight" data-testid="heading-usuarios">Usuários</h1>
          <p className="text-muted-foreground" data-testid="text-description">
            Gerencie colaboradores e suas permissões de acesso às empresas
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-collaborator">
              <UserPlus className="h-4 w-4" />
              Adicionar Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Colaborador</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="João" data-testid="input-firstName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Silva" data-testid="input-lastName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="joao@exemplo.com" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresas Permitidas</FormLabel>
                      <div className="border rounded-md p-4 space-y-3 max-h-[200px] overflow-y-auto">
                        {companies.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada</p>
                        ) : (
                          companies.map((company) => (
                            <div key={company.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`company-${company.id}`}
                                checked={field.value?.includes(company.id)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...(field.value || []), company.id]
                                    : field.value?.filter((id) => id !== company.id) || [];
                                  field.onChange(newValue);
                                }}
                                data-testid={`checkbox-company-${company.id}`}
                              />
                              <label
                                htmlFor={`company-${company.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {company.tradeName || company.legalName}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createMutation.isPending ? "Criando..." : "Criar e Enviar Convite"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="title-collaborators">
            <UserPlus className="h-5 w-5" />
            Colaboradores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-loading">
              Carregando colaboradores...
            </div>
          ) : collaborators.length === 0 ? (
            <div className="text-center py-12" data-testid="text-empty">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-2">Nenhum colaborador cadastrado</p>
              <p className="text-sm text-muted-foreground">
                Clique em "Adicionar Colaborador" para convidar o primeiro membro da equipe
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium" data-testid="header-name">Nome</th>
                    <th className="text-left p-3 font-medium" data-testid="header-email">Email</th>
                    <th className="text-left p-3 font-medium" data-testid="header-companies">Empresas</th>
                    <th className="text-left p-3 font-medium" data-testid="header-status">Status</th>
                    <th className="text-right p-3 font-medium" data-testid="header-actions">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {collaborators.map((collaborator) => (
                    <tr key={collaborator.id} className="border-b hover-elevate" data-testid={`row-collaborator-${collaborator.id}`}>
                      <td className="p-3" data-testid={`text-name-${collaborator.id}`}>
                        <div className="font-medium">
                          {collaborator.firstName} {collaborator.lastName}
                        </div>
                      </td>
                      <td className="p-3" data-testid={`text-email-${collaborator.id}`}>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {collaborator.email}
                        </div>
                      </td>
                      <td className="p-3" data-testid={`text-companies-${collaborator.id}`}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {collaborator.companies.length} {collaborator.companies.length === 1 ? "empresa" : "empresas"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3" data-testid={`status-${collaborator.id}`}>
                        {getStatusBadge(collaborator.status)}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          {collaborator.status === "pending_first_access" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => resendInviteMutation.mutate(collaborator.id)}
                              disabled={resendInviteMutation.isPending}
                              className="gap-1.5"
                              data-testid={`button-resend-${collaborator.id}`}
                            >
                              <Send className="h-3.5 w-3.5" />
                              Reenviar
                            </Button>
                          )}
                          
                          {collaborator.status === "active" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleStatusMutation.mutate({ id: collaborator.id, status: "inactive" })}
                              disabled={toggleStatusMutation.isPending}
                              className="gap-1.5"
                              data-testid={`button-deactivate-${collaborator.id}`}
                            >
                              <ToggleRight className="h-3.5 w-3.5" />
                              Desativar
                            </Button>
                          )}
                          
                          {collaborator.status === "inactive" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleStatusMutation.mutate({ id: collaborator.id, status: "active" })}
                              disabled={toggleStatusMutation.isPending}
                              className="gap-1.5"
                              data-testid={`button-activate-${collaborator.id}`}
                            >
                              <ToggleLeft className="h-3.5 w-3.5" />
                              Ativar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && collaborators.length > 0 && (
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Sobre os Convites
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Colaboradores com status "Aguardando" receberão um email com link para definir sua senha.
                  O convite expira em 7 dias. Use "Reenviar" para gerar um novo link caso necessário.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
