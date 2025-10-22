import { useState } from "react";
import { Building2, MapPin, Phone, Mail, Calendar, Edit2, Save, X, Check, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const initialData = {
  razaoSocial: "FinControl Soluções Financeiras LTDA",
  cnpj: "12.345.678/0001-90",
  ie: "123.456.789.012",
  im: "987.654.321",
  dataAbertura: "15 de Janeiro de 2020",
  cnaeSecundario: "6201-5/00",
  endereco: "Av. Paulista, 1000 - Bela Vista",
  cidade: "São Paulo - SP",
  cep: "01310-100",
  telefone: "(11) 3456-7890",
  email: "contato@fincontrol.com.br",
  website: "www.fincontrol.com.br",
};

export default function MinhaEmpresa() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [backupData, setBackupData] = useState(initialData);

  const handleEdit = () => {
    setBackupData({ ...formData });
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    console.log("Saving all data:", formData);
  };

  const handleCancel = () => {
    setFormData({ ...backupData });
    setIsEditing(false);
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
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

      {/* Top Info Cards - Compact */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Regime Tributário</p>
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 font-semibold text-xs" data-testid="badge-tax-regime">
              Simples Nacional
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Porte da Empresa</p>
            <Badge variant="secondary" className="font-semibold text-xs" data-testid="badge-company-size">
              Microempresa (ME)
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Atividade Principal</p>
            <p className="font-semibold text-xs" data-testid="text-cnae">
              6204-0/00 - Consultoria em TI
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Single Card with All Data */}
      <Card className="bg-muted/30 shadow-sm border border-primary/20">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Cadastro da Empresa</CardTitle>
            {!isEditing ? (
              <Button
                onClick={handleEdit}
                variant="outline"
                size="sm"
                data-testid="button-edit-all"
              >
                <Edit2 className="h-3.5 w-3.5 mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  data-testid="button-cancel-all"
                >
                  <X className="h-3.5 w-3.5 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  data-testid="button-save-all"
                >
                  <Check className="h-3.5 w-3.5 mr-2" />
                  Salvar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {/* Dados da Empresa Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3">Dados da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 p-3 rounded-md border border-border/40 bg-card/50">
                  <Label htmlFor="razaoSocial" className="text-xs text-muted-foreground">
                    Razão Social
                  </Label>
                  {isEditing ? (
                    <Input
                      id="razaoSocial"
                      value={formData.razaoSocial}
                      onChange={(e) => handleChange("razaoSocial", e.target.value)}
                      className="h-9"
                      data-testid="input-razaoSocial"
                    />
                  ) : (
                    <p className="text-sm font-medium" data-testid="text-razaoSocial">
                      {formData.razaoSocial}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 p-3 rounded-md border border-border/40 bg-card/50">
                  <Label htmlFor="cnpj" className="text-xs text-muted-foreground">
                    CNPJ
                  </Label>
                  {isEditing ? (
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => handleChange("cnpj", e.target.value)}
                      className="h-9"
                      data-testid="input-cnpj"
                    />
                  ) : (
                    <p className="text-sm font-medium" data-testid="text-cnpj">
                      {formData.cnpj}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 p-3 rounded-md border border-border/40 bg-card/50">
                  <Label htmlFor="dataAbertura" className="text-xs text-muted-foreground">
                    Data de Abertura
                  </Label>
                  {isEditing ? (
                    <Input
                      id="dataAbertura"
                      value={formData.dataAbertura}
                      onChange={(e) => handleChange("dataAbertura", e.target.value)}
                      className="h-9"
                      data-testid="input-dataAbertura"
                    />
                  ) : (
                    <p className="text-sm font-medium" data-testid="text-dataAbertura">
                      {formData.dataAbertura}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 p-3 rounded-md border border-border/40 bg-card/50">
                  <Label htmlFor="ie" className="text-xs text-muted-foreground">
                    Inscrição Estadual
                  </Label>
                  {isEditing ? (
                    <Input
                      id="ie"
                      value={formData.ie}
                      onChange={(e) => handleChange("ie", e.target.value)}
                      className="h-9"
                      data-testid="input-ie"
                    />
                  ) : (
                    <p className="text-sm font-medium" data-testid="text-ie">
                      {formData.ie}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 p-3 rounded-md border border-border/40 bg-card/50">
                  <Label htmlFor="im" className="text-xs text-muted-foreground">
                    Inscrição Municipal
                  </Label>
                  {isEditing ? (
                    <Input
                      id="im"
                      value={formData.im}
                      onChange={(e) => handleChange("im", e.target.value)}
                      className="h-9"
                      data-testid="input-im"
                    />
                  ) : (
                    <p className="text-sm font-medium" data-testid="text-im">
                      {formData.im}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 p-3 rounded-md border border-border/40 bg-card/50">
                  <Label htmlFor="cnaeSecundario" className="text-xs text-muted-foreground">
                    CNAE Secundário
                  </Label>
                  {isEditing ? (
                    <Input
                      id="cnaeSecundario"
                      value={formData.cnaeSecundario}
                      onChange={(e) => handleChange("cnaeSecundario", e.target.value)}
                      className="h-9"
                      data-testid="input-cnaeSecundario"
                    />
                  ) : (
                    <p className="text-sm font-medium" data-testid="text-cnaeSecundario">
                      {formData.cnaeSecundario}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Endereço e Contato Section */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3">Endereço e Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 p-3 rounded-md border border-border/40 bg-card/50">
                  <Label htmlFor="endereco" className="text-xs text-muted-foreground">
                    Logradouro
                  </Label>
                  {isEditing ? (
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => handleChange("endereco", e.target.value)}
                      className="h-9"
                      data-testid="input-endereco"
                    />
                  ) : (
                    <p className="text-sm font-medium" data-testid="text-endereco">
                      {formData.endereco}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 p-3 rounded-md border border-border/40 bg-card/50">
                  <Label htmlFor="cidade" className="text-xs text-muted-foreground">
                    Cidade/UF
                  </Label>
                  {isEditing ? (
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => handleChange("cidade", e.target.value)}
                      className="h-9"
                      data-testid="input-cidade"
                    />
                  ) : (
                    <p className="text-sm font-medium" data-testid="text-cidade">
                      {formData.cidade}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 p-3 rounded-md border border-border/40 bg-card/50">
                  <Label htmlFor="cep" className="text-xs text-muted-foreground">
                    CEP
                  </Label>
                  {isEditing ? (
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => handleChange("cep", e.target.value)}
                      className="h-9"
                      data-testid="input-cep"
                    />
                  ) : (
                    <p className="text-sm font-medium" data-testid="text-cep">
                      {formData.cep}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 p-3 rounded-md border border-border/40 bg-card/50">
                  <Label htmlFor="telefone" className="text-xs text-muted-foreground">
                    Telefone
                  </Label>
                  {isEditing ? (
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => handleChange("telefone", e.target.value)}
                      className="h-9"
                      data-testid="input-telefone"
                    />
                  ) : (
                    <p className="text-sm font-medium" data-testid="text-telefone">
                      {formData.telefone}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 p-3 rounded-md border border-border/40 bg-card/50">
                  <Label htmlFor="email" className="text-xs text-muted-foreground">
                    E-mail
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="h-9"
                      data-testid="input-email"
                    />
                  ) : (
                    <p className="text-sm font-medium" data-testid="text-email">
                      {formData.email}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 p-3 rounded-md border border-border/40 bg-card/50">
                  <Label htmlFor="website" className="text-xs text-muted-foreground">
                    Website
                  </Label>
                  {isEditing ? (
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                      className="h-9"
                      data-testid="input-website"
                    />
                  ) : (
                    <p className="text-sm font-medium" data-testid="text-website">
                      {formData.website}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
