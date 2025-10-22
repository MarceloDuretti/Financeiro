import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Phone, Mail, MapPin, FileText, Briefcase, Globe, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Company } from "@shared/schema";

export default function MinhaEmpresa() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: selectedCompany } = useQuery<Company>({
    queryKey: ["/api/companies", selectedCompanyId],
    enabled: !!selectedCompanyId,
  });

  return (
    <div className="h-full overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 h-full p-6">
        {/* Lista de empresas - Esquerda */}
        <div 
          className={`flex-shrink-0 transition-all duration-300 ${
            selectedCompanyId ? 'md:w-[400px]' : 'w-full'
          }`}
        >
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Empresas do Grupo
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  Carregando empresas...
                </div>
              ) : companies.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nenhuma empresa cadastrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow
                        key={company.id}
                        data-testid={`row-company-${company.id}`}
                        className={`cursor-pointer hover-elevate ${
                          selectedCompanyId === company.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedCompanyId(company.id)}
                      >
                        <TableCell data-testid={`text-code-${company.id}`}>
                          {company.code}
                        </TableCell>
                        <TableCell data-testid={`text-name-${company.id}`}>
                          <div className="font-medium">{company.tradeName}</div>
                          <div className="text-xs text-muted-foreground">
                            {company.legalName}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-cnpj-${company.id}`}>
                          {company.cnpj}
                        </TableCell>
                        <TableCell data-testid={`text-phone-${company.id}`}>
                          {company.phone}
                        </TableCell>
                        <TableCell data-testid={`text-status-${company.id}`}>
                          <Badge
                            variant={company.status === "Ativa" ? "default" : "secondary"}
                          >
                            {company.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Card de detalhes - Direita */}
        {selectedCompanyId && selectedCompany && (
          <div className="flex-1 overflow-auto">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
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
    </div>
  );
}
