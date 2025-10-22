import { Building2, MapPin, Phone, Mail, FileText, Users, Calendar, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function MinhaEmpresa() {
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
        <Button data-testid="button-edit-company">
          Editar Dados
        </Button>
      </div>

      <Separator />

      {/* Company Info Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Details */}
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Dados da Empresa</CardTitle>
                <CardDescription>Informações cadastrais principais</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Razão Social</p>
                  <p className="font-semibold" data-testid="text-company-name">FinControl Soluções Financeiras LTDA</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">CNPJ</p>
                  <p className="font-semibold" data-testid="text-cnpj">12.345.678/0001-90</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Inscrição Estadual</p>
                  <p className="font-semibold" data-testid="text-ie">123.456.789.012</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Data de Abertura</p>
                  <p className="font-semibold" data-testid="text-opening-date">15 de Janeiro de 2020</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Contato</CardTitle>
                <CardDescription>Informações de contato</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Endereço</p>
                  <p className="font-semibold" data-testid="text-address">
                    Av. Paulista, 1000 - Bela Vista<br />
                    São Paulo - SP, 01310-100
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="font-semibold" data-testid="text-phone">(11) 3456-7890</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="font-semibold" data-testid="text-email">contato@fincontrol.com.br</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax and Legal Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Regime Tributário</CardTitle>
            <CardDescription>Enquadramento fiscal</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20" data-testid="badge-tax-regime">
              Simples Nacional
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Faturamento anual até R$ 4,8 milhões
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Porte da Empresa</CardTitle>
            <CardDescription>Classificação legal</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" data-testid="badge-company-size">
              Microempresa (ME)
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Receita bruta anual até R$ 360 mil
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Atividade Principal</CardTitle>
            <CardDescription>CNAE</CardDescription>
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

      {/* Partners */}
      <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-500">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Sócios</CardTitle>
              <CardDescription>Quadro societário da empresa</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-muted/30 hover-elevate" data-testid="partner-card-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-semibold text-sm">
                  JS
                </div>
                <div>
                  <p className="font-semibold">João Silva</p>
                  <p className="text-xs text-muted-foreground">CPF: 123.456.789-00</p>
                </div>
              </div>
              <Badge variant="secondary">60% - Sócio Administrador</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-muted/30 hover-elevate" data-testid="partner-card-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white font-semibold text-sm">
                  MS
                </div>
                <div>
                  <p className="font-semibold">Maria Santos</p>
                  <p className="text-xs text-muted-foreground">CPF: 987.654.321-00</p>
                </div>
              </div>
              <Badge variant="secondary">40% - Sócia</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
