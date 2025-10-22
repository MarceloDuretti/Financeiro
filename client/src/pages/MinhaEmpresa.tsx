import { useState } from "react";
import { Building2, MapPin, Phone, Mail, FileText, Users, Shield, Calendar, Edit2, Save, X, Scale, Briefcase, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function MinhaEmpresa() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    razaoSocial: "FinControl Soluções Financeiras LTDA",
    cnpj: "12.345.678/0001-90",
    ie: "123.456.789.012",
    dataAbertura: "15 de Janeiro de 2020",
    endereco: "Av. Paulista, 1000 - Bela Vista",
    cidade: "São Paulo - SP, 01310-100",
    telefone: "(11) 3456-7890",
    email: "contato@fincontrol.com.br",
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    // Aqui você adicionaria a lógica para salvar os dados
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Aqui você resetaria os dados para os valores originais
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minha Empresa</h1>
          <p className="text-muted-foreground mt-1">
            Informações cadastrais e configurações da sua empresa
          </p>
        </div>
      </div>

      <Separator />

      {/* Top Cards - Tax and Legal Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg overflow-visible">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                  <Scale className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-base">Regime Tributário</CardTitle>
                <CardDescription className="text-xs">Enquadramento fiscal</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 font-semibold" data-testid="badge-tax-regime">
              Simples Nacional
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Faturamento anual até R$ 4,8 milhões
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg overflow-visible">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-base">Porte da Empresa</CardTitle>
                <CardDescription className="text-xs">Classificação legal</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="font-semibold" data-testid="badge-company-size">
              Microempresa (ME)
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Receita bruta anual até R$ 360 mil
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg overflow-visible">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600">
                  <FileCheck className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-base">Atividade Principal</CardTitle>
                <CardDescription className="text-xs">CNAE</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-sm" data-testid="text-cnae">
              6204-0/00
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Consultoria em tecnologia da informação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Registration Form */}
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Dados Cadastrais</CardTitle>
              <CardDescription>Informações principais da empresa</CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={handleEdit} variant="outline" size="sm" data-testid="button-edit-company">
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleCancel} variant="outline" size="sm" data-testid="button-cancel">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} size="sm" data-testid="button-save">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-8">
            {/* Company Data Section */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
                Dados da Empresa
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="razaoSocial" className="text-xs text-muted-foreground">
                    Razão Social
                  </Label>
                  {isEditing ? (
                    <Input
                      id="razaoSocial"
                      value={formData.razaoSocial}
                      onChange={(e) => handleChange("razaoSocial", e.target.value)}
                      data-testid="input-company-name"
                    />
                  ) : (
                    <p className="text-sm font-medium py-2" data-testid="text-company-name">
                      {formData.razaoSocial}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="text-xs text-muted-foreground">
                    CNPJ
                  </Label>
                  {isEditing ? (
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => handleChange("cnpj", e.target.value)}
                      data-testid="input-cnpj"
                    />
                  ) : (
                    <p className="text-sm font-medium py-2" data-testid="text-cnpj">
                      {formData.cnpj}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ie" className="text-xs text-muted-foreground">
                    Inscrição Estadual
                  </Label>
                  {isEditing ? (
                    <Input
                      id="ie"
                      value={formData.ie}
                      onChange={(e) => handleChange("ie", e.target.value)}
                      data-testid="input-ie"
                    />
                  ) : (
                    <p className="text-sm font-medium py-2" data-testid="text-ie">
                      {formData.ie}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataAbertura" className="text-xs text-muted-foreground">
                    Data de Abertura
                  </Label>
                  {isEditing ? (
                    <Input
                      id="dataAbertura"
                      value={formData.dataAbertura}
                      onChange={(e) => handleChange("dataAbertura", e.target.value)}
                      data-testid="input-opening-date"
                    />
                  ) : (
                    <p className="text-sm font-medium py-2" data-testid="text-opening-date">
                      {formData.dataAbertura}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Section */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
                Contato
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="endereco" className="text-xs text-muted-foreground">
                    Endereço
                  </Label>
                  {isEditing ? (
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => handleChange("endereco", e.target.value)}
                      data-testid="input-address"
                    />
                  ) : (
                    <p className="text-sm font-medium py-2" data-testid="text-address">
                      {formData.endereco}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade" className="text-xs text-muted-foreground">
                    Cidade / Estado / CEP
                  </Label>
                  {isEditing ? (
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => handleChange("cidade", e.target.value)}
                      data-testid="input-city"
                    />
                  ) : (
                    <p className="text-sm font-medium py-2" data-testid="text-city">
                      {formData.cidade}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-xs text-muted-foreground">
                    Telefone
                  </Label>
                  {isEditing ? (
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => handleChange("telefone", e.target.value)}
                      data-testid="input-phone"
                    />
                  ) : (
                    <p className="text-sm font-medium py-2" data-testid="text-phone">
                      {formData.telefone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs text-muted-foreground">
                    E-mail
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      data-testid="input-email"
                    />
                  ) : (
                    <p className="text-sm font-medium py-2" data-testid="text-email">
                      {formData.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partners Section */}
      <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg overflow-visible">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl">Sócios</CardTitle>
              <CardDescription>Quadro societário da empresa</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg border border-muted/30 hover-elevate transition-all" data-testid="partner-card-0">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold shadow-lg">
                  JS
                </div>
                <div>
                  <p className="font-semibold">João Silva</p>
                  <p className="text-xs text-muted-foreground">CPF: 123.456.789-00</p>
                </div>
              </div>
              <Badge variant="secondary" className="font-semibold">60% - Sócio Administrador</Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-muted/30 hover-elevate transition-all" data-testid="partner-card-1">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white font-semibold shadow-lg">
                  MS
                </div>
                <div>
                  <p className="font-semibold">Maria Santos</p>
                  <p className="text-xs text-muted-foreground">CPF: 987.654.321-00</p>
                </div>
              </div>
              <Badge variant="secondary" className="font-semibold">40% - Sócia</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
