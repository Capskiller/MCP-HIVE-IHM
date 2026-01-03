/**
 * Model selector dropdown for the header.
 */

import { useModels, useSelectedModel } from '@/hooks/useModels';
import { useModelStore } from '@/stores/modelStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Cpu, Check, Loader2 } from 'lucide-react';

export function ModelSelector() {
  const { isLoading } = useModels();
  const { selectedModel, setSelectedModel, installedModels } = useSelectedModel();
  const modelStatus = useModelStore((s) => s.modelStatus);

  const currentStatus = selectedModel ? modelStatus[selectedModel] : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 min-w-[140px] justify-between"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5" />
            <span className="truncate max-w-[100px]">
              {isLoading ? 'Loading...' : selectedModel || 'Select model'}
            </span>
          </div>
          {currentStatus === 'loading' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[200px]">
        {installedModels.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground text-center">
            No models installed
          </div>
        ) : (
          installedModels.map((model) => (
            <DropdownMenuItem
              key={model.name}
              onClick={() => setSelectedModel(model.name)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate">{model.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {modelStatus[model.name] === 'pulling' && (
                  <Badge variant="secondary" className="text-xs">
                    Pulling...
                  </Badge>
                )}
                {selectedModel === model.name && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
