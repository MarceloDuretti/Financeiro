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
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="relative flex-shrink-0">
              <div className={`absolute inset-0 ${iconGradient} blur-lg rounded-full opacity-30`} />
              <div className={`relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${iconGradient}`}>
                {icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm">{title}</CardTitle>
              {description && <CardDescription className="text-xs mt-0.5">{description}</CardDescription>}
            </div>
          </div>
          {!isEditing ? (
            <Button
              onClick={handleEdit}
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              data-testid={`${testIdPrefix}-edit`}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <div className="flex gap-1 flex-shrink-0">
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                data-testid={`${testIdPrefix}-cancel`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={handleSave}
                variant="default"
                size="icon"
                className="h-7 w-7"
                data-testid={`${testIdPrefix}-save`}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {fields.length === 6 ? (
          // Grid layout for 6 fields (2 rows x 3 columns)
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key} className="text-xs text-muted-foreground flex items-center gap-1.5">
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
            ))}
          </div>
        ) : (
          // Vertical layout with separators for other cards
          <div className="space-y-0">
            {fields.map((field, index) => (
              <div key={field.key}>
                <div className="py-2.5">
                  <Label htmlFor={field.key} className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
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
          </div>
        )}
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
    <div className="space-y-4 p-4">
      {/* Company Identity Band - Compact */}
      <Card className="border-0 bg-gradient-to-br from-primary/5 via-card to-muted/10 shadow-lg overflow-visible">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <Avatar className="relative h-12 w-12 border-2 border-background shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-lg font-bold">
                  FC
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight" data-testid="text-company-identity-name">
                FinControl Soluções Financeiras LTDA
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <Badge variant="secondary" className="font-medium text-xs" data-testid="badge-company-status">
                  <Check className="h-3 w-3 mr-1 text-green-600" />
                  Ativa
                </Badge>
                <Badge variant="outline" className="font-medium text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Desde 15/01/2020
                </Badge>
                <Badge variant="outline" className="font-medium text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  Nacional
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Cards - Tax and Legal Info - Compact */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-sm overflow-visible">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 blur-lg rounded-full" />
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                  <Scale className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-sm">Regime Tributário</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 font-semibold text-xs" data-testid="badge-tax-regime">
              Simples Nacional
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-sm overflow-visible">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full" />
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Briefcase className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-sm">Porte da Empresa</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <Badge variant="secondary" className="font-semibold text-xs" data-testid="badge-company-size">
              Microempresa (ME)
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-sm overflow-visible">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-lg rounded-full" />
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600">
                  <FileCheck className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-sm">Atividade Principal</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="font-semibold text-xs" data-testid="text-cnae">
              6204-0/00 - Consultoria em TI
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Cards - Compact Layout */}
      <div className="space-y-4">
        {/* Company Data Card - Full Width */}
        <EditableCard
          title="Dados da Empresa"
          description="Informações de registro e tributárias"
          icon={<Building2 className="h-5 w-5 text-white" />}
          iconGradient="from-blue-500 to-indigo-600"
          testIdPrefix="company-data"
          fields={[
            { label: "Razão Social", value: "FinControl Soluções Financeiras LTDA", key: "razaoSocial", icon: <Building2 className="h-3 w-3" /> },
            { label: "CNPJ", value: "12.345.678/0001-90", key: "cnpj", icon: <FileText className="h-3 w-3" /> },
            { label: "Data de Abertura", value: "15 de Janeiro de 2020", key: "dataAbertura", icon: <Calendar className="h-3 w-3" /> },
            { label: "Inscrição Estadual", value: "123.456.789.012", key: "ie", icon: <FileText className="h-3 w-3" /> },
            { label: "Inscrição Municipal", value: "987.654.321", key: "im", icon: <FileText className="h-3 w-3" /> },
            { label: "CNAE Secundário", value: "6201-5/00", key: "cnaeSecundario", icon: <FileCheck className="h-3 w-3" /> },
          ]}
          onSave={handleSaveCompanyData}
        />

        {/* Contact and Address - Side by Side */}
        <div className="grid gap-4 lg:grid-cols-2">
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
      </div>
    </div>
  );
}
