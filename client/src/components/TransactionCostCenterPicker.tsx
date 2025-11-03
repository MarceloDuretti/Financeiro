import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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
    console.log('[TransactionCostCenterPicker] Value changed:', value);
    setDistributions(value);
  }, [value]);

  // Calculate total percentage
  const totalPercentage = distributions.reduce((sum, d) => sum + d.percentage, 0);
  const remaining = 100 - totalPercentage;
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
  const handlePercentageChange = (costCenterId: string, value: string) => {
    const percentage = parseInt(value) || 0;
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    
    const newDistributions = distributions.map(d =>
      d.costCenterId === costCenterId ? { ...d, percentage: clampedPercentage } : d
    );
    setDistributions(newDistributions);
    onChange(newDistributions);
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
    <div className="space-y-3">
      {/* Header with Total and Progress */}
      <Card className={isValid ? "border-green-600" : hasSelections ? "border-destructive" : ""}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasSelections && (
                <>
                  {isValid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </>
              )}
              <span className="text-sm font-semibold">
                Total: {totalPercentage}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasSelections && remaining !== 0 && (
                <Badge variant={remaining > 0 ? "outline" : "destructive"} className="text-xs">
                  {remaining > 0 ? `Faltam ${remaining}%` : `Excesso de ${Math.abs(remaining)}%`}
                </Badge>
              )}
              {isValid && (
                <Badge variant="default" className="bg-green-600 text-xs">
                  Completo ✓
                </Badge>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {hasSelections && (
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isValid ? "bg-green-600" : remaining > 0 ? "bg-primary" : "bg-destructive"
                }`}
                style={{ width: `${Math.min(totalPercentage, 100)}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unified Grid - 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
        {costCenters.map((costCenter) => {
          const distribution = distributions.find(d => d.costCenterId === costCenter.id);
          const isSelected = !!distribution;
          
          return (
            <Card
              key={costCenter.id}
              className={cn(
                "transition-all hover-elevate",
                isSelected && "bg-accent/50 border-primary"
              )}
              data-testid={`card-cost-center-${costCenter.id}`}
            >
              <CardContent className="p-2.5">
                <div className="flex items-center gap-2">
                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(costCenter.id)}
                    data-testid={`checkbox-cost-center-${costCenter.id}`}
                  />
                  
                  {/* Cost Center Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0">
                        {String(costCenter.code).padStart(4, '0')}
                      </Badge>
                      <p className="text-sm font-medium truncate">
                        {costCenter.name}
                      </p>
                    </div>
                  </div>
                  
                  {/* Percentage Input - Always visible */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={isSelected ? distribution.percentage : ""}
                      onChange={(e) => handlePercentageChange(costCenter.id, e.target.value)}
                      className="w-16 h-8 text-center text-sm font-medium"
                      placeholder="0"
                      disabled={!isSelected}
                      data-testid={`input-percentage-${costCenter.id}`}
                    />
                    <span className="text-xs font-medium text-muted-foreground w-4">%</span>
                  </div>
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
