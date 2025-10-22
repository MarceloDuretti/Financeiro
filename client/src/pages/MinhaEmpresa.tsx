import { useState } from "react";
import { Building2, MapPin, Phone, Mail, FileText, Users, Shield, Calendar, Edit2, Save, X, Scale, Briefcase, FileCheck, Check, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type EditableCardProps = {
  title: string;
  description?: string;
  icon: React.ReactNode;
  fields: Array<{
    label: string;
    value: string;
    key: string;
    icon?: React.ReactNode;
  }>;
  onSave: (data: Record<string, string>) => void;
  iconGradient: string;
  testIdPrefix: string;
};

function EditableCard({ title, description, icon, fields, onSave, iconGradient, testIdPrefix }: EditableCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>(
    Object.fromEntries(fields.map(f => [f.key, f.value]))
  );
  const [backupData, setBackupData] = useState<Record<string, string>>(
    Object.fromEntries(fields.map(f => [f.key, f.value]))
  );

  const handleEdit = () => {
    setBackupData({ ...formData });
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({ ...backupData });
    setIsEditing(false);
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-sm overflow-visible hover-elevate transition-all">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-shrink-0">
              <div className={`absolute inset-0 ${iconGradient} blur-xl rounded-full opacity-30`} />
              <div className={`relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${iconGradient}`}>
                {icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">{title}</CardTitle>
              {description && <CardDescription className="text-xs mt-0.5">{description}</CardDescription>}
            </div>
          </div>
          {!isEditing ? (
            <Button
              onClick={handleEdit}
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              data-testid={`${testIdPrefix}-edit`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-1 flex-shrink-0">
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid={`${testIdPrefix}-cancel`}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSave}
                variant="default"
                size="icon"
                className="h-8 w-8"
                data-testid={`${testIdPrefix}-save`}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-0">
        {fields.map((field, index) => (
          <div key={field.key}>
            <div className="py-3">
              <Label htmlFor={field.key} className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                {field.icon}
                {field.label}
              </Label>
              {isEditing ? (
                <Input
                  id={field.key}
                  value={formData[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="h-9"
                  data-testid={`${testIdPrefix}-input-${field.key}`}
                />
              ) : (
                <p className="text-sm font-medium" data-testid={`${testIdPrefix}-text-${field.key}`}>
                  {formData[field.key]}
                </p>
              )}
            </div>
            {index < fields.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function MinhaEmpresa() {
  const handleSaveCompanyData = (data: Record<string, string>) => {
    console.log("Saving company data:", data);
    // Implementar lógica de salvamento no backend
  };

  const handleSaveTaxData = (data: Record<string, string>) => {
    console.log("Saving tax data:", data);
  };

  const handleSaveContactData = (data: Record<string, string>) => {
    console.log("Saving contact data:", data);
  };

  const handleSaveAddressData = (data: Record<string, string>) => {
    console.log("Saving address data:", data);
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

      {/* Company Identity Band */}
      <Card className="border-0 bg-gradient-to-br from-primary/5 via-card to-muted/10 shadow-lg overflow-visible">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <Avatar className="relative h-20 w-20 border-4 border-background shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-2xl font-bold">
                  FC
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight" data-testid="text-company-identity-name">
                  FinControl Soluções Financeiras LTDA
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-medium" data-testid="badge-company-status">
                    <Check className="h-3 w-3 mr-1 text-green-600" />
                    Ativa
                  </Badge>
                  <Badge variant="outline" className="font-medium">
                    <Calendar className="h-3 w-3 mr-1" />
                    Desde 15/01/2020
                  </Badge>
                  <Badge variant="outline" className="font-medium">
                    <Globe className="h-3 w-3 mr-1" />
                    Nacional
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Empresa especializada em soluções financeiras e consultoria, oferecendo 
                serviços de gestão, planejamento tributário e tecnologia da informação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Data Grid - Segmented Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Data Card */}
        <EditableCard
          title="Dados da Empresa"
          description="Informações de registro"
          icon={<Building2 className="h-5 w-5 text-white" />}
          iconGradient="from-blue-500 to-indigo-600"
          testIdPrefix="company-data"
          fields={[
            { label: "Razão Social", value: "FinControl Soluções Financeiras LTDA", key: "razaoSocial", icon: <Building2 className="h-3 w-3" /> },
            { label: "CNPJ", value: "12.345.678/0001-90", key: "cnpj", icon: <FileText className="h-3 w-3" /> },
            { label: "Data de Abertura", value: "15 de Janeiro de 2020", key: "dataAbertura", icon: <Calendar className="h-3 w-3" /> },
          ]}
          onSave={handleSaveCompanyData}
        />

        {/* Tax Data Card */}
        <EditableCard
          title="Dados Tributários"
          description="Informações fiscais"
          icon={<Scale className="h-5 w-5 text-white" />}
          iconGradient="from-green-500 to-emerald-600"
          testIdPrefix="tax-data"
          fields={[
            { label: "Inscrição Estadual", value: "123.456.789.012", key: "ie", icon: <FileText className="h-3 w-3" /> },
            { label: "Inscrição Municipal", value: "987.654.321", key: "im", icon: <FileText className="h-3 w-3" /> },
            { label: "CNAE Secundário", value: "6201-5/00", key: "cnaeSecundario", icon: <FileCheck className="h-3 w-3" /> },
          ]}
          onSave={handleSaveTaxData}
        />

        {/* Contact Card */}
        <EditableCard
          title="Contato"
          description="Informações de comunicação"
          icon={<Mail className="h-5 w-5 text-white" />}
          iconGradient="from-orange-500 to-red-600"
          testIdPrefix="contact-data"
          fields={[
            { label: "Telefone", value: "(11) 3456-7890", key: "telefone", icon: <Phone className="h-3 w-3" /> },
            { label: "E-mail", value: "contato@fincontrol.com.br", key: "email", icon: <Mail className="h-3 w-3" /> },
            { label: "Website", value: "www.fincontrol.com.br", key: "website", icon: <Globe className="h-3 w-3" /> },
          ]}
          onSave={handleSaveContactData}
        />

        {/* Address Card */}
        <EditableCard
          title="Endereço"
          description="Localização da empresa"
          icon={<MapPin className="h-5 w-5 text-white" />}
          iconGradient="from-purple-500 to-violet-600"
          testIdPrefix="address-data"
          fields={[
            { label: "Logradouro", value: "Av. Paulista, 1000 - Bela Vista", key: "endereco", icon: <MapPin className="h-3 w-3" /> },
            { label: "Cidade/UF", value: "São Paulo - SP", key: "cidade", icon: <MapPin className="h-3 w-3" /> },
            { label: "CEP", value: "01310-100", key: "cep", icon: <MapPin className="h-3 w-3" /> },
          ]}
          onSave={handleSaveAddressData}
        />
      </div>

      {/* Partners Section */}
      <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg overflow-visible">
        <CardHeader className="border-b bg-gradient-to-r from-transparent via-muted/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl">Quadro Societário</CardTitle>
              <CardDescription>Sócios e participação na empresa</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border border-muted/30 bg-gradient-to-br from-background to-muted/5 overflow-visible hover-elevate transition-all" data-testid="partner-card-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full" />
                    <Avatar className="relative h-14 w-14 border-2 border-background shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-lg">
                        JS
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-base">João Silva</h3>
                      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold text-sm shrink-0">
                        60%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">CPF: 123.456.789-00</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      Sócio Administrador
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-muted/30 bg-gradient-to-br from-background to-muted/5 overflow-visible hover-elevate transition-all" data-testid="partner-card-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-pink-500/20 blur-lg rounded-full" />
                    <Avatar className="relative h-14 w-14 border-2 border-background shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-600 text-white font-semibold text-lg">
                        MS
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-base">Maria Santos</h3>
                      <Badge className="bg-pink-500/10 text-pink-600 border-pink-500/20 font-bold text-sm shrink-0">
                        40%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">CPF: 987.654.321-00</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      Sócia
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
