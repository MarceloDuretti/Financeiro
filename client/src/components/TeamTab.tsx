import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Plus, Mail, Phone, Briefcase, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertCompanyMemberSchema, type CompanyMember } from "@shared/schema";

const memberFormSchema = insertCompanyMemberSchema.extend({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.string().min(2, "Cargo é obrigatório"),
  phone: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberFormSchema>;

interface TeamTabProps {
  companyId: string;
  companyName: string;
}

export function TeamTab({ companyId, companyName }: TeamTabProps) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CompanyMember | null>(null);

  const { data: members = [], isLoading } = useQuery<CompanyMember[]>({
    queryKey: ["/api/companies", companyId, "members"],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}/members`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch members");
      return response.json();
    },
  });

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      phone: "",
      status: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      return await apiRequest("POST", `/api/companies/${companyId}/members`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "members"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Membro adicionado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar o membro.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MemberFormData> }) => {
      return await apiRequest("PATCH", `/api/companies/${companyId}/members/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "members"] });
      setEditingMember(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Membro atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o membro.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/companies/${companyId}/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "members"] });
      toast({
        title: "Sucesso",
        description: "Membro removido com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o membro.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (data: MemberFormData) => {
    createMutation.mutate(data);
  };

  const handleEditClick = (member: CompanyMember) => {
    setEditingMember(member);
    form.reset({
      name: member.name,
      email: member.email,
      role: member.role,
      phone: member.phone || "",
      status: member.status,
    });
  };

  const handleEditSubmit = (data: MemberFormData) => {
    if (!editingMember) return;
    updateMutation.mutate({ id: editingMember.id, data });
  };

  const handleDeleteClick = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Carregando equipe...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Equipe de {companyName}</h3>
          <p className="text-sm text-muted-foreground">{members.length} {members.length === 1 ? 'membro' : 'membros'}</p>
        </div>
        <Dialog 
          open={editingMember ? true : isCreateDialogOpen} 
          onOpenChange={(open) => {
            if (!open) {
              setEditingMember(null);
              setIsCreateDialogOpen(false);
              form.reset();
            } else if (!editingMember) {
              setIsCreateDialogOpen(true);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button data-testid="button-add-member">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMember ? "Editar Membro" : "Novo Membro"}</DialogTitle>
              <DialogDescription>
                {editingMember ? "Atualize os dados do membro" : "Adicione um novo membro à equipe"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit(editingMember ? handleEditSubmit : handleCreateSubmit)} 
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="João Silva" data-testid="input-member-name" />
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
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="joao@empresa.com" data-testid="input-member-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Gerente Financeiro" data-testid="input-member-role" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(11) 99999-9999" data-testid="input-member-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-member">
                    {(createMutation.isPending || updateMutation.isPending) ? "Salvando..." : (editingMember ? "Atualizar" : "Adicionar")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-2">Nenhum membro na equipe</p>
            <p className="text-sm text-muted-foreground/70">Adicione membros para gerenciar sua equipe</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <Card key={member.id} className="hover-elevate" data-testid={`card-member-${member.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate" data-testid={`text-member-name-${member.id}`}>
                      {member.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-member-role-${member.id}`}>
                        <Briefcase className="h-3 w-3 mr-1" />
                        {member.role}
                      </Badge>
                      <Badge 
                        variant={member.status === "active" ? "default" : "secondary"}
                        className="text-xs"
                        data-testid={`badge-member-status-${member.id}`}
                      >
                        {member.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate" data-testid={`text-member-email-${member.id}`}>{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span data-testid={`text-member-phone-${member.id}`}>{member.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(member)}
                        data-testid={`button-edit-member-${member.id}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-delete-member-${member.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover {member.name} da equipe? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid={`button-cancel-delete-member-${member.id}`}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteClick(member.id)}
                              data-testid={`button-confirm-delete-member-${member.id}`}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
