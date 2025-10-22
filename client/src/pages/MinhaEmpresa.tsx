import { useState } from "react";
import { Building2, MapPin, Phone, Mail, Globe, Edit2, User, FileText, Calendar, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const initialCompanyData = {
  nomeFantasia: "FinControl",
  razaoSocial: "FinControl Soluções Financeiras LTDA",
  cnpj: "12.345.678/0001-90",
  ie: "123.456.789.012",
  im: "987.654.321",
  dataAbertura: "15 de Janeiro de 2020",
  cnae: "6204-0/00",
  cnaeDescricao: "Consultoria em Tecnologia da Informação",
  regimeTributario: "Simples Nacional",
  porte: "Microempresa (ME)",
  
  // Endereço
  logradouro: "Av. Paulista, 1000",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
  cep: "01310-100",
  
  // Contato
  telefone: "(11) 3456-7890",
  email: "contato@fincontrol.com.br",
  website: "www.fincontrol.com.br",
  
  // Responsável
  responsavel: {
    nome: "Carlos Eduardo Silva",
    cargo: "Diretor Financeiro",
    telefone: "(11) 98765-4321",
    email: "carlos@fincontrol.com.br"
  }
};

export default function MinhaEmpresa() {
  const { toast } = useToast();
  const [companyData, setCompanyData] = useState(initialCompanyData);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(initialCompanyData);

  const handleOpenEdit = () => {
    setEditFormData({ ...companyData });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    setCompanyData({ ...editFormData });
    setIsEditDialogOpen(false);
    toast({
      title: "Alterações salvas",
      description: "As informações da empresa foram atualizadas com sucesso.",
    });
  };

  const handleCancelEdit = () => {
    setEditFormData({ ...companyData });
    setIsEditDialogOpen(false);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleResponsavelChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      responsavel: { ...prev.responsavel, [field]: value }
    }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Hero Section - Company Profile */}
      <Card className="border-0 bg-gradient-to-br from-primary/5 via-card to-primary/5 shadow-lg overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Logo */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full opacity-50 group-hover:opacity-70 transition-opacity" />
              <Avatar className="relative h-24 w-24 border-4 border-background shadow-2xl">
                <AvatarImage src="" alt="Logo da empresa" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-3xl font-bold">
                  {companyData.nomeFantasia.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Company Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2" data-testid="text-company-name">
                {companyData.nomeFantasia}
              </h1>
              <p className="text-muted-foreground text-sm mb-3" data-testid="text-company-legal-name">
                {companyData.razaoSocial}
              </p>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="font-medium">
                  Ativa
                </Badge>
                <Badge variant="outline" className="font-medium">
                  {companyData.regimeTributario}
                </Badge>
                <Badge variant="outline" className="font-medium">
                  {companyData.porte}
                </Badge>
                <Badge variant="outline" className="font-medium">
                  Desde {companyData.dataAbertura}
                </Badge>
              </div>
            </div>

            {/* Edit Button */}
            <Button variant="outline" size="sm" onClick={handleOpenEdit} data-testid="button-edit-company">
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Informações da Empresa</DialogTitle>
            <DialogDescription>
              Atualize as informações cadastrais da sua empresa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="edit-fantasia">Nome Fantasia</Label>
                <Input 
                  id="edit-fantasia" 
                  value={editFormData.nomeFantasia}
                  onChange={(e) => handleEditChange('nomeFantasia', e.target.value)}
                  data-testid="input-edit-fantasia"
                />
              </div>
              <div>
                <Label htmlFor="edit-razao">Razão Social</Label>
                <Input 
                  id="edit-razao" 
                  value={editFormData.razaoSocial}
                  onChange={(e) => handleEditChange('razaoSocial', e.target.value)}
                  data-testid="input-edit-razao"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-cnpj">CNPJ</Label>
                  <Input 
                    id="edit-cnpj" 
                    value={editFormData.cnpj}
                    onChange={(e) => handleEditChange('cnpj', e.target.value)}
                    data-testid="input-edit-cnpj"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-abertura">Data de Abertura</Label>
                  <Input 
                    id="edit-abertura" 
                    value={editFormData.dataAbertura}
                    onChange={(e) => handleEditChange('dataAbertura', e.target.value)}
                    data-testid="input-edit-abertura"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-ie">Inscrição Estadual</Label>
                  <Input 
                    id="edit-ie" 
                    value={editFormData.ie}
                    onChange={(e) => handleEditChange('ie', e.target.value)}
                    data-testid="input-edit-ie"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-im">Inscrição Municipal</Label>
                  <Input 
                    id="edit-im" 
                    value={editFormData.im}
                    onChange={(e) => handleEditChange('im', e.target.value)}
                    data-testid="input-edit-im"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-email">E-mail</Label>
                <Input 
                  id="edit-email" 
                  type="email" 
                  value={editFormData.email}
                  onChange={(e) => handleEditChange('email', e.target.value)}
                  data-testid="input-edit-email"
                />
              </div>
              <div>
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input 
                  id="edit-telefone" 
                  value={editFormData.telefone}
                  onChange={(e) => handleEditChange('telefone', e.target.value)}
                  data-testid="input-edit-telefone"
                />
              </div>
              <div>
                <Label htmlFor="edit-website">Website</Label>
                <Input 
                  id="edit-website" 
                  value={editFormData.website}
                  onChange={(e) => handleEditChange('website', e.target.value)}
                  data-testid="input-edit-website"
                />
              </div>

              {/* Endereço */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Endereço</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="edit-logradouro">Logradouro</Label>
                    <Input 
                      id="edit-logradouro" 
                      value={editFormData.logradouro}
                      onChange={(e) => handleEditChange('logradouro', e.target.value)}
                      data-testid="input-edit-logradouro"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-bairro">Bairro</Label>
                      <Input 
                        id="edit-bairro" 
                        value={editFormData.bairro}
                        onChange={(e) => handleEditChange('bairro', e.target.value)}
                        data-testid="input-edit-bairro"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-cep">CEP</Label>
                      <Input 
                        id="edit-cep" 
                        value={editFormData.cep}
                        onChange={(e) => handleEditChange('cep', e.target.value)}
                        data-testid="input-edit-cep"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-cidade">Cidade</Label>
                      <Input 
                        id="edit-cidade" 
                        value={editFormData.cidade}
                        onChange={(e) => handleEditChange('cidade', e.target.value)}
                        data-testid="input-edit-cidade"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-uf">UF</Label>
                      <Input 
                        id="edit-uf" 
                        value={editFormData.uf}
                        onChange={(e) => handleEditChange('uf', e.target.value)}
                        data-testid="input-edit-uf"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Responsável */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Responsável</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="edit-resp-nome">Nome</Label>
                    <Input 
                      id="edit-resp-nome" 
                      value={editFormData.responsavel.nome}
                      onChange={(e) => handleResponsavelChange('nome', e.target.value)}
                      data-testid="input-edit-resp-nome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-resp-cargo">Cargo</Label>
                    <Input 
                      id="edit-resp-cargo" 
                      value={editFormData.responsavel.cargo}
                      onChange={(e) => handleResponsavelChange('cargo', e.target.value)}
                      data-testid="input-edit-resp-cargo"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-resp-telefone">Telefone</Label>
                      <Input 
                        id="edit-resp-telefone" 
                        value={editFormData.responsavel.telefone}
                        onChange={(e) => handleResponsavelChange('telefone', e.target.value)}
                        data-testid="input-edit-resp-telefone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-resp-email">E-mail</Label>
                      <Input 
                        id="edit-resp-email" 
                        type="email"
                        value={editFormData.responsavel.email}
                        onChange={(e) => handleResponsavelChange('email', e.target.value)}
                        data-testid="input-edit-resp-email"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCancelEdit} data-testid="button-cancel-edit">
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} data-testid="button-save-edit">
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados Fiscais */}
          <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Dados Fiscais</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">CNPJ</p>
                  <p className="font-medium" data-testid="text-cnpj">{companyData.cnpj}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Inscrição Estadual</p>
                  <p className="font-medium" data-testid="text-ie">{companyData.ie}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Inscrição Municipal</p>
                  <p className="font-medium" data-testid="text-im">{companyData.im}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Data de Abertura</p>
                  <p className="font-medium" data-testid="text-data-abertura">{companyData.dataAbertura}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atividade Econômica */}
          <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Atividade Econômica</h3>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">CNAE Principal</p>
                <p className="font-medium" data-testid="text-cnae">{companyData.cnae} - {companyData.cnaeDescricao}</p>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Endereço</h3>
              </div>
              <div className="space-y-2">
                <p className="font-medium" data-testid="text-logradouro">{companyData.logradouro}</p>
                <p className="text-muted-foreground" data-testid="text-bairro">{companyData.bairro}</p>
                <p className="text-muted-foreground" data-testid="text-cidade-uf-cep">{companyData.cidade} - {companyData.uf}, CEP {companyData.cep}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Contato</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium" data-testid="text-telefone">{companyData.telefone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium" data-testid="text-email">{companyData.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium text-primary hover:underline cursor-pointer" data-testid="text-website">
                    {companyData.website}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Responsável */}
        <div className="space-y-6">
          <Card className="border-0 bg-gradient-to-br from-primary/10 via-card to-primary/5 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Responsável</h3>
              </div>

              {/* Foto do Responsável */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative group mb-4">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-40 group-hover:opacity-60 transition-opacity" />
                  <Avatar className="relative h-20 w-20 border-4 border-background shadow-lg">
                    <AvatarImage src="" alt={companyData.responsavel.nome} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-xl font-bold">
                      {companyData.responsavel.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h4 className="font-bold text-lg text-center" data-testid="text-responsavel-nome">{companyData.responsavel.nome}</h4>
                <p className="text-sm text-muted-foreground text-center" data-testid="text-responsavel-cargo">{companyData.responsavel.cargo}</p>
              </div>

              {/* Contato do Responsável */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-medium text-sm" data-testid="text-responsavel-telefone">{companyData.responsavel.telefone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="font-medium text-sm" data-testid="text-responsavel-email">{companyData.responsavel.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Cadastro atualizado</p>
                    <p className="font-medium text-sm">22 de Outubro de 2025</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="secondary" className="font-medium text-xs mt-1">
                      Empresa Ativa
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
