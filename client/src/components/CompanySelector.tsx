import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Company } from "@shared/schema";
import { formatCompanyCode } from "@/lib/formatters";

const SELECTED_COMPANY_KEY = "fincontrol_selected_company_id";

export function CompanySelector() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(() => {
    return localStorage.getItem(SELECTED_COMPANY_KEY);
  });

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Auto-select if only one company exists
  useEffect(() => {
    if (!isLoading && companies.length === 1 && !selectedCompanyId) {
      const firstCompany = companies[0];
      setSelectedCompanyId(firstCompany.id);
      localStorage.setItem(SELECTED_COMPANY_KEY, firstCompany.id);
      // Force reload to update all queries that depend on selectedCompanyId
      window.location.reload();
    }
  }, [companies, isLoading, selectedCompanyId]);

  // Update localStorage when selection changes
  useEffect(() => {
    if (selectedCompanyId) {
      localStorage.setItem(SELECTED_COMPANY_KEY, selectedCompanyId);
      // Trigger page reload to update all queries
      const currentSelection = localStorage.getItem(SELECTED_COMPANY_KEY);
      if (currentSelection !== selectedCompanyId) {
        window.location.reload();
      }
    } else {
      localStorage.removeItem(SELECTED_COMPANY_KEY);
    }
  }, [selectedCompanyId]);

  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
    localStorage.setItem(SELECTED_COMPANY_KEY, companyId);
    // Reload page to update all queries with new company
    window.location.reload();
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md animate-pulse">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Sem empresas</span>
      </div>
    );
  }

  if (!selectedCompany) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2 h-9"
            data-testid="button-select-company"
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden md:inline">Selecione uma empresa</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[280px]">
          <DropdownMenuLabel>Empresas Disponíveis</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {companies.map((company) => (
            <DropdownMenuItem
              key={company.id}
              onClick={() => handleSelectCompany(company.id)}
              className="gap-2 cursor-pointer"
              data-testid={`menu-company-${company.id}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={company.tradeName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {company.tradeName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate">{company.tradeName}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatCompanyCode(company.code)}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 h-9"
          data-testid="button-current-company"
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src="" alt={selectedCompany.tradeName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {selectedCompany.tradeName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium leading-none">
              {selectedCompany.tradeName}
            </span>
            <span className="text-xs text-muted-foreground font-mono leading-none mt-0.5">
              {formatCompanyCode(selectedCompany.code)}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel>Trocar Empresa</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => handleSelectCompany(company.id)}
            className="gap-2 cursor-pointer"
            data-testid={`menu-company-${company.id}`}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={company.tradeName} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {company.tradeName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{company.tradeName}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {formatCompanyCode(company.code)}
              </span>
            </div>
            {company.id === selectedCompanyId && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
