import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Phone, Mail, MapPin, FileText, Briefcase, Globe, User, X, ChevronRight, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Company } from "@shared/schema";

const SELECTED_COMPANY_KEY = "fincontrol_selected_company_id";

export default function MinhaEmpresa() {
  const { toast } = useToast();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(() => {
    return localStorage.getItem(SELECTED_COMPANY_KEY);
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Company>>({});

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: selectedCompany } = useQuery<Company>({
    queryKey: [`/api/companies/${selectedCompanyId}`],
    enabled: !!selectedCompanyId,
  });

  useEffect(() => {
    if (selectedCompanyId) {
      localStorage.setItem(SELECTED_COMPANY_KEY, selectedCompanyId);
    } else {
      localStorage.removeItem(SELECTED_COMPANY_KEY);
    }
  }, [selectedCompanyId]);

  const handleCloseDetails = () => {
    setSelectedCompanyId(null);
  };

  const handleOpenEdit = () => {
    if (selectedCompany) {
      setEditFormData(selectedCompany);
      setIsEditDialogOpen(true);
    }
  };

  const handleEditChange = (field: keyof Company, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!selectedCompanyId) return;

    try {
      await apiRequest("PATCH", `/api/companies/${selectedCompanyId}`, editFormData);

      await queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      await queryClient.invalidateQueries({ queryKey: [`/api/companies/${selectedCompanyId}`] });

      setIsEditDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Dados da empresa atualizados com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados da empresa.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 h-full p-6">
        {/* Lista de empresas - Esquerda */}
        <div 
          className={`flex-shrink-0 transition-all duration-300 ${
            selectedCompanyId ? 'w-[360px]' : 'w-full'
          }`}
        >
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Empresas do Grupo
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  Carregando empresas...
                </div>
              ) : companies.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nenhuma empresa cadastrada
                </div>
              ) : (
                <div className={`grid gap-4 ${selectedCompanyId ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      data-testid={`row-company-${company.id}`}
                      onClick={() => setSelectedCompanyId(company.id)}
                      className={`group relative rounded-xl border transition-all duration-200 cursor-pointer hover-elevate active-elevate-2 overflow-hidden ${
                        selectedCompanyId === company.id 
                          ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-md' 
                          : 'bg-card border-border hover:border-primary/20 hover:shadow-sm'
                      }`}
                    >
                      {/* Header do Card */}
                      <div className="p-4 pb-3 border-b border-border/50">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-sm">
                              <AvatarImage src="" alt={company.tradeName} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                                {company.tradeName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 
                                className="font-bold text-base text-foreground truncate"
                                data-testid={`text-name-${company.id}`}
                              >
                                {company.tradeName}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">
                                {company.legalName}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-all ${
                            selectedCompanyId === company.id ? 'text-primary rotate-90' : 'group-hover:translate-x-1'
                          }`} />
                        </div>
                      </div>

                      {/* Body do Card - Grid de informações */}
                      {!selectedCompanyId && (
                        <div className="p-4 pt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            {/* Código */}
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Código</p>
                              <p 
                                className="text-sm font-semibold font-mono text-foreground"
                                data-testid={`text-code-${company.id}`}
                              >
                                #{company.code}
                              </p>
                            </div>

                            {/* Status */}
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Status</p>
                              <Badge 
                                variant={company.status === "Ativa" ? "default" : "secondary"}
                                className="text-xs w-fit"
                                data-testid={`text-status-${company.id}`}
                              >
                                {company.status}
                              </Badge>
                            </div>

                            {/* CNPJ */}
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                CNPJ
                              </p>
                              <p 
                                className="text-sm font-medium text-foreground"
                                data-testid={`text-cnpj-${company.id}`}
                              >
                                {company.cnpj}
                              </p>
                            </div>

                            {/* Telefone */}
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                Telefone
                              </p>
                              <p 
                                className="text-sm font-medium text-foreground"
                                data-testid={`text-phone-${company.id}`}
                              >
                                {company.phone}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Indicador de seleção */}
                      {selectedCompanyId === company.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary via-primary to-primary/50" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Card de detalhes - Direita */}
        {selectedCompanyId && selectedCompany && (
          <div className="flex-1 overflow-auto">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="" alt={selectedCompany.tradeName} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {selectedCompany.tradeName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl" data-testid="text-detail-trade-name">
                        {selectedCompany.tradeName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground" data-testid="text-detail-legal-name">
                        {selectedCompany.legalName}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{selectedCompany.status}</Badge>
                        {selectedCompany.porte && (
                          <Badge variant="outline">{selectedCompany.porte}</Badge>
                        )}
                        {selectedCompany.isActive && (
                          <Badge className="bg-green-500">Empresa Ativa</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenEdit}
                      data-testid="button-edit-company"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCloseDetails}
                      data-testid="button-close-details"
                      className="flex-shrink-0"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dados Fiscais */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <FileText className="h-5 w-5" />
                    <h3 className="font-semibold">Dados Fiscais</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                    <div>
                      <p className="text-xs text-muted-foreground">CNPJ</p>
                      <p className="font-medium" data-testid="text-detail-cnpj">{selectedCompany.cnpj}</p>
                    </div>
                    {selectedCompany.ie && (
                      <div>
                        <p className="text-xs text-muted-foreground">Inscrição Estadual</p>
                        <p className="font-medium" data-testid="text-detail-ie">{selectedCompany.ie}</p>
                      </div>
                    )}
                    {selectedCompany.im && (
                      <div>
                        <p className="text-xs text-muted-foreground">Inscrição Municipal</p>
                        <p className="font-medium" data-testid="text-detail-im">{selectedCompany.im}</p>
                      </div>
                    )}
                    {selectedCompany.dataAbertura && (
                      <div>
                        <p className="text-xs text-muted-foreground">Data de Abertura</p>
                        <p className="font-medium" data-testid="text-detail-data-abertura">
                          {selectedCompany.dataAbertura}
                        </p>
                      </div>
                    )}
                    {selectedCompany.regimeTributario && (
                      <div>
                        <p className="text-xs text-muted-foreground">Regime Tributário</p>
                        <p className="font-medium" data-testid="text-detail-regime">
                          {selectedCompany.regimeTributario}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Atividade Econômica */}
                {selectedCompany.cnaePrincipal && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Briefcase className="h-5 w-5" />
                      <h3 className="font-semibold">Atividade Econômica</h3>
                    </div>
                    <div className="pl-7">
                      <p className="text-xs text-muted-foreground">CNAE Principal</p>
                      <p className="font-medium" data-testid="text-detail-cnae">{selectedCompany.cnaePrincipal}</p>
                    </div>
                  </div>
                )}

                {/* Endereço */}
                {selectedCompany.logradouro && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <MapPin className="h-5 w-5" />
                      <h3 className="font-semibold">Endereço</h3>
                    </div>
                    <div className="pl-7">
                      <p className="font-medium" data-testid="text-detail-address">
                        {selectedCompany.logradouro}
                        {selectedCompany.numero && `, ${selectedCompany.numero}`}
                        {selectedCompany.complemento && ` - ${selectedCompany.complemento}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedCompany.bairro && `${selectedCompany.bairro}, `}
                        {selectedCompany.cidade}/{selectedCompany.uf}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        CEP: {selectedCompany.cep}
                      </p>
                    </div>
                  </div>
                )}

                {/* Contato */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Phone className="h-5 w-5" />
                    <h3 className="font-semibold">Contato</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Telefone</p>
                        <p className="font-medium" data-testid="text-detail-phone">{selectedCompany.phone}</p>
                      </div>
                    </div>
                    {selectedCompany.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">E-mail</p>
                          <p className="font-medium" data-testid="text-detail-email">{selectedCompany.email}</p>
                        </div>
                      </div>
                    )}
                    {selectedCompany.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Website</p>
                          <p className="font-medium" data-testid="text-detail-website">{selectedCompany.website}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Responsável */}
                {selectedCompany.responsavelNome && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <User className="h-5 w-5" />
                      <h3 className="font-semibold">Responsável</h3>
                    </div>
                    <div className="pl-7">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={selectedCompany.responsavelFoto || ""} />
                          <AvatarFallback>
                            {selectedCompany.responsavelNome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium" data-testid="text-detail-responsavel-nome">
                            {selectedCompany.responsavelNome}
                          </p>
                          {selectedCompany.responsavelCargo && (
                            <p className="text-sm text-muted-foreground" data-testid="text-detail-responsavel-cargo">
                              {selectedCompany.responsavelCargo}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        {selectedCompany.responsavelTelefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Telefone</p>
                              <p className="text-sm" data-testid="text-detail-responsavel-telefone">
                                {selectedCompany.responsavelTelefone}
                              </p>
                            </div>
                          </div>
                        )}
                        {selectedCompany.responsavelEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">E-mail</p>
                              <p className="text-sm" data-testid="text-detail-responsavel-email">
                                {selectedCompany.responsavelEmail}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Informações da Empresa</DialogTitle>
            <DialogDescription>
              Atualize os dados cadastrais da empresa selecionada.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-primary">Informações Básicas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-tradeName">Nome Fantasia</Label>
                  <Input
                    id="edit-tradeName"
                    value={editFormData.tradeName || ''}
                    onChange={(e) => handleEditChange('tradeName', e.target.value)}
                    data-testid="input-edit-tradeName"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-legalName">Razão Social</Label>
                  <Input
                    id="edit-legalName"
                    value={editFormData.legalName || ''}
                    onChange={(e) => handleEditChange('legalName', e.target.value)}
                    data-testid="input-edit-legalName"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cnpj">CNPJ</Label>
                  <Input
                    id="edit-cnpj"
                    value={editFormData.cnpj || ''}
                    onChange={(e) => handleEditChange('cnpj', e.target.value)}
                    data-testid="input-edit-cnpj"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    value={editFormData.phone || ''}
                    onChange={(e) => handleEditChange('phone', e.target.value)}
                    data-testid="input-edit-phone"
                  />
                </div>
              </div>
            </div>

            {/* Dados Fiscais */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-primary">Dados Fiscais</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-ie">Inscrição Estadual</Label>
                  <Input
                    id="edit-ie"
                    value={editFormData.ie || ''}
                    onChange={(e) => handleEditChange('ie', e.target.value)}
                    data-testid="input-edit-ie"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-im">Inscrição Municipal</Label>
                  <Input
                    id="edit-im"
                    value={editFormData.im || ''}
                    onChange={(e) => handleEditChange('im', e.target.value)}
                    data-testid="input-edit-im"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-dataAbertura">Data de Abertura</Label>
                  <Input
                    id="edit-dataAbertura"
                    value={editFormData.dataAbertura || ''}
                    onChange={(e) => handleEditChange('dataAbertura', e.target.value)}
                    data-testid="input-edit-dataAbertura"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-primary">Endereço</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit-logradouro">Logradouro</Label>
                  <Input
                    id="edit-logradouro"
                    value={editFormData.logradouro || ''}
                    onChange={(e) => handleEditChange('logradouro', e.target.value)}
                    data-testid="input-edit-logradouro"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-numero">Número</Label>
                  <Input
                    id="edit-numero"
                    value={editFormData.numero || ''}
                    onChange={(e) => handleEditChange('numero', e.target.value)}
                    data-testid="input-edit-numero"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-complemento">Complemento</Label>
                  <Input
                    id="edit-complemento"
                    value={editFormData.complemento || ''}
                    onChange={(e) => handleEditChange('complemento', e.target.value)}
                    data-testid="input-edit-complemento"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-bairro">Bairro</Label>
                  <Input
                    id="edit-bairro"
                    value={editFormData.bairro || ''}
                    onChange={(e) => handleEditChange('bairro', e.target.value)}
                    data-testid="input-edit-bairro"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cidade">Cidade</Label>
                  <Input
                    id="edit-cidade"
                    value={editFormData.cidade || ''}
                    onChange={(e) => handleEditChange('cidade', e.target.value)}
                    data-testid="input-edit-cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-uf">UF</Label>
                  <Input
                    id="edit-uf"
                    value={editFormData.uf || ''}
                    onChange={(e) => handleEditChange('uf', e.target.value)}
                    data-testid="input-edit-uf"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cep">CEP</Label>
                  <Input
                    id="edit-cep"
                    value={editFormData.cep || ''}
                    onChange={(e) => handleEditChange('cep', e.target.value)}
                    data-testid="input-edit-cep"
                  />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-primary">Contato</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-email">E-mail</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => handleEditChange('email', e.target.value)}
                    data-testid="input-edit-email"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-website">Website</Label>
                  <Input
                    id="edit-website"
                    value={editFormData.website || ''}
                    onChange={(e) => handleEditChange('website', e.target.value)}
                    data-testid="input-edit-website"
                  />
                </div>
              </div>
            </div>

            {/* Responsável */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-primary">Responsável</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-responsavelNome">Nome</Label>
                  <Input
                    id="edit-responsavelNome"
                    value={editFormData.responsavelNome || ''}
                    onChange={(e) => handleEditChange('responsavelNome', e.target.value)}
                    data-testid="input-edit-responsavelNome"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-responsavelCargo">Cargo</Label>
                  <Input
                    id="edit-responsavelCargo"
                    value={editFormData.responsavelCargo || ''}
                    onChange={(e) => handleEditChange('responsavelCargo', e.target.value)}
                    data-testid="input-edit-responsavelCargo"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-responsavelTelefone">Telefone</Label>
                  <Input
                    id="edit-responsavelTelefone"
                    value={editFormData.responsavelTelefone || ''}
                    onChange={(e) => handleEditChange('responsavelTelefone', e.target.value)}
                    data-testid="input-edit-responsavelTelefone"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-responsavelEmail">E-mail</Label>
                  <Input
                    id="edit-responsavelEmail"
                    type="email"
                    value={editFormData.responsavelEmail || ''}
                    onChange={(e) => handleEditChange('responsavelEmail', e.target.value)}
                    data-testid="input-edit-responsavelEmail"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              data-testid="button-save-edit"
            >
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
