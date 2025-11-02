import { useState, useEffect } from "react";
import { Check } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface CostCenter {
  id: string;
  code: number;
  name: string;
}

interface MultiCostCenterPickerProps {
  selectedCostCenters: CostCenter[];
  allCostCenters: CostCenter[];
  onSave: (costCenterIds: string[]) => Promise<void>;
  disabled?: boolean;
}

export function MultiCostCenterPicker({
  selectedCostCenters,
  allCostCenters,
  onSave,
  disabled = false,
}: MultiCostCenterPickerProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tempSelected, setTempSelected] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Initialize temp selection with current selection when opening
  useEffect(() => {
    if (open) {
      setTempSelected(new Set(selectedCostCenters.map((cc) => cc.id)));
    }
  }, [open, selectedCostCenters]);

  const toggleCostCenter = (costCenterId: string) => {
    const newSet = new Set(tempSelected);
    if (newSet.has(costCenterId)) {
      newSet.delete(costCenterId);
    } else {
      newSet.add(costCenterId);
    }
    setTempSelected(newSet);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(Array.from(tempSelected));
      setOpen(false);
      toast({
        title: "Centros de custo atualizados",
        description: `${tempSelected.size} centro(s) associado(s)`,
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar os centros de custo",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempSelected(new Set(selectedCostCenters.map((cc) => cc.id)));
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {selectedCostCenters.length > 0 ? (
          selectedCostCenters.map((cc) => (
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
            </Badge>
          ))
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Nenhum centro de custo associado
          </p>
        )}
      </div>

      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              data-testid="button-edit-cost-centers"
            >
              {selectedCostCenters.length > 0 ? "Editar Centros" : "Adicionar Centros"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar centro de custo..." />
              <CommandList className="max-h-[300px]">
                <CommandEmpty>Nenhum centro encontrado</CommandEmpty>
                <CommandGroup heading="Centros de Custo">
                  {allCostCenters.map((cc) => {
                    const isSelected = tempSelected.has(cc.id);
                    return (
                      <CommandItem
                        key={cc.id}
                        onSelect={() => toggleCostCenter(cc.id)}
                        data-testid={`option-cost-center-${cc.id}`}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleCostCenter(cc.id)}
                            data-testid={`checkbox-cost-center-${cc.id}`}
                          />
                          <span className="font-mono text-xs text-muted-foreground">
                            {String(cc.code).padStart(3, "0")}
                          </span>
                          <span className="text-sm flex-1">{cc.name}</span>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
              <div className="border-t p-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1"
                  data-testid="button-save-cost-centers"
                >
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                  data-testid="button-cancel-cost-centers"
                >
                  Cancelar
                </Button>
              </div>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
