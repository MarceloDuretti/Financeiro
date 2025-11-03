import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ChevronUp, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import type { CostCenter } from "@shared/schema";

export interface CostCenterDistribution {
  costCenterId: string;
  percentage: number;
}

interface TransactionCostCenterPickerProps {
  value: CostCenterDistribution[];
  onChange: (value: CostCenterDistribution[]) => void;
  companyId?: string;
}

export function TransactionCostCenterPicker({
  value = [],
  onChange,
  companyId,
}: TransactionCostCenterPickerProps) {
  const [distributions, setDistributions] = useState<CostCenterDistribution[]>(value);

  // Fetch cost centers for the company
  const { data: costCenters, isLoading } = useQuery<CostCenter[]>({
    queryKey: ["/api/cost-centers", companyId],
    queryFn: async () => {
      const response = await fetch(`/api/cost-centers?companyId=${companyId}`);
      if (!response.ok) throw new Error("Failed to fetch cost centers");
      return response.json();
    },
    enabled: !!companyId,
  });

  // Sync with parent value changes
  useEffect(() => {
    setDistributions(value);
  }, [value]);

  // Calculate total percentage
  const totalPercentage = distributions.reduce((sum, d) => sum + d.percentage, 0);
  const isValid = totalPercentage === 100;
  const hasSelections = distributions.length > 0;

  // Handle checkbox toggle
  const handleToggle = (costCenterId: string) => {
    const exists = distributions.find(d => d.costCenterId === costCenterId);
    
    if (exists) {
      // Remove from distribution
      const newDistributions = distributions.filter(d => d.costCenterId !== costCenterId);
      setDistributions(newDistributions);
      onChange(newDistributions);
    } else {
      // Add to distribution with automatic percentage
      const newDistributions = [...distributions, { costCenterId, percentage: 0 }];
      const autoPercentage = Math.floor(100 / newDistributions.length);
      const remainder = 100 - (autoPercentage * newDistributions.length);
      
      // Distribute evenly with remainder on first item
      const withPercentages = newDistributions.map((d, idx) => ({
        ...d,
        percentage: idx === 0 ? autoPercentage + remainder : autoPercentage,
      }));
      
      setDistributions(withPercentages);
      onChange(withPercentages);
    }
  };

  // Handle percentage change
  const handlePercentageChange = (costCenterId: string, percentage: number) => {
    const newDistributions = distributions.map(d =>
      d.costCenterId === costCenterId ? { ...d, percentage } : d
    );
    setDistributions(newDistributions);
    onChange(newDistributions);
  };

  // Increment/decrement percentage
  const adjustPercentage = (costCenterId: string, delta: number) => {
    const distribution = distributions.find(d => d.costCenterId === costCenterId);
    if (!distribution) return;
    
    const newPercentage = Math.max(0, Math.min(100, distribution.percentage + delta));
    handlePercentageChange(costCenterId, newPercentage);
  };

  // Auto-distribute equally
  const handleAutoDistribute = () => {
    if (distributions.length === 0) return;
    
    const autoPercentage = Math.floor(100 / distributions.length);
    const remainder = 100 - (autoPercentage * distributions.length);
    
    const withPercentages = distributions.map((d, idx) => ({
      ...d,
      percentage: idx === 0 ? autoPercentage + remainder : autoPercentage,
    }));
    
    setDistributions(withPercentages);
    onChange(withPercentages);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!costCenters || costCenters.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground text-center">
          Nenhum centro de custo disponível para esta empresa
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      {hasSelections && (
        <Card className={isValid ? "border-green-600" : "border-destructive"}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="text-sm font-medium">
                  Total distribuído: {totalPercentage}%
                </span>
              </div>
              {!isValid && (
                <span className="text-xs text-destructive">
                  {totalPercentage < 100 
                    ? `Faltam ${100 - totalPercentage}%` 
                    : `Excesso de ${totalPercentage - 100}%`}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {hasSelections && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoDistribute}
            className="flex-1"
            data-testid="button-auto-distribute"
          >
            Distribuir Igualmente
          </Button>
        </div>
      )}

      {/* Cost Centers List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {costCenters.map((costCenter) => {
          const distribution = distributions.find(d => d.costCenterId === costCenter.id);
          const isSelected = !!distribution;
          
          return (
            <Card
              key={costCenter.id}
              className={cn(
                "transition-all",
                isSelected && "bg-accent/50 border-primary"
              )}
              data-testid={`card-cost-center-${costCenter.id}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(costCenter.id)}
                    data-testid={`checkbox-cost-center-${costCenter.id}`}
                  />
                  
                  {/* Cost Center Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        {String(costCenter.code).padStart(4, '0')}
                      </Badge>
                      <p className="text-sm font-medium truncate">
                        {costCenter.name}
                      </p>
                    </div>
                  </div>
                  
                  {/* Percentage Input (only when selected) */}
                  {isSelected && (
                    <div className="flex items-center gap-1">
                      <div className="flex flex-col gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0"
                          onClick={() => adjustPercentage(costCenter.id, 1)}
                          data-testid={`button-increment-${costCenter.id}`}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0"
                          onClick={() => adjustPercentage(costCenter.id, -1)}
                          data-testid={`button-decrement-${costCenter.id}`}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={distribution.percentage}
                        onChange={(e) => handlePercentageChange(
                          costCenter.id,
                          parseInt(e.target.value) || 0
                        )}
                        className="w-16 h-8 text-center"
                        data-testid={`input-percentage-${costCenter.id}`}
                      />
                      <span className="text-sm font-medium">%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
