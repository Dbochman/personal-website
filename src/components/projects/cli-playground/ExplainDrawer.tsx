import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Lightbulb, ArrowRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { CommandExplanation } from './types';

interface ExplainDrawerProps {
  explanation: CommandExplanation | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTryCommand: (command: string) => void;
}

export function ExplainDrawer({
  explanation,
  isOpen,
  onOpenChange,
  onTryCommand,
}: ExplainDrawerProps) {
  if (!explanation) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-2 px-3 bg-muted/30 hover:bg-muted/50 border rounded-lg"
        >
          <div className="flex items-center gap-2 text-sm">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span>Explain this command</span>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-4 bg-muted/20 border rounded-lg space-y-4">
          {/* Summary */}
          <div>
            <h4 className="text-sm font-medium mb-1">What it does</h4>
            <p className="text-sm text-muted-foreground">{explanation.summary}</p>
          </div>

          {/* Flags */}
          {explanation.flags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Flags used</h4>
              <div className="space-y-1.5">
                {explanation.flags.map((f) => (
                  <div key={f.flag} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono shrink-0">
                      {f.flag}
                    </code>
                    <span className="text-muted-foreground">{f.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Try next */}
          {explanation.tryNext.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Try next</h4>
              <div className="flex flex-wrap gap-2">
                {explanation.tryNext.map((item) => (
                  <Button
                    key={item.label}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => onTryCommand(item.command)}
                  >
                    {item.label}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
