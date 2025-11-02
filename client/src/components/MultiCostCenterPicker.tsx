import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface CostCenter {
  id: string;
  code: number;
  name: string;
}

interface MultiCostCenterPickerProps {
  selectedCostCenters: CostCenter[];
  allCostCenters: CostCenter[];
  onAdd: (costCenterId: string) => Promise<void> | void;
  onRemove: (costCenterId: string) => Promise<void> | void;
  disabled?: boolean;
}

export function MultiCostCenterPicker({
  selectedCostCenters,
  allCostCenters,
  onAdd,
  onRemove,
  disabled = false,
}: MultiCostCenterPickerProps) {
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Filter out already selected cost centers
  const availableCostCenters = allCostCenters.filter(
    (cc) => !selectedCostCenters.some((selected) => selected.id === cc.id)
  );

  const handleAdd = async (costCenterId: string) => {
    try {
      setIsAdding(true);
      await onAdd(costCenterId);
      setOpen(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (costCenterId: string) => {
    await onRemove(costCenterId);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {selectedCostCenters.map((cc) => (
          <Badge
            key={cc.id}
            variant="secondary"
            className="text-xs h-6 px-2 gap-1"
            data-testid={`badge-cost-center-${cc.id}`}
          >
            <span className="font-mono text-[10px] text-muted-foreground">
              {String(cc.code).padStart(3, "0")}
            </span>
            <span>{cc.name}</span>
            {!disabled && (
              <button
                onClick={() => handleRemove(cc.id)}
                className="ml-1 hover:bg-accent rounded-sm"
                data-testid={`button-remove-cost-center-${cc.id}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        
        {!disabled && availableCostCenters.length > 0 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs gap-1"
                data-testid="button-add-cost-center"
              >
                <Plus className="h-3 w-3" />
                Adicionar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar centro de custo..." />
                <CommandList>
                  <CommandEmpty>Nenhum centro encontrado</CommandEmpty>
                  <CommandGroup>
                    {availableCostCenters.map((cc) => (
                      <CommandItem
                        key={cc.id}
                        onSelect={() => handleAdd(cc.id)}
                        disabled={isAdding}
                        data-testid={`option-cost-center-${cc.id}`}
                      >
                        <span className="font-mono text-xs text-muted-foreground mr-2">
                          {String(cc.code).padStart(3, "0")}
                        </span>
                        <span className="text-sm">{cc.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {selectedCostCenters.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          Nenhum centro de custo associado
        </p>
      )}
    </div>
  );
}
