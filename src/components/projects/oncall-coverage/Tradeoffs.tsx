import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, AlertTriangle } from 'lucide-react';
import type { ModelTradeoffs } from './types';

interface TradeoffsProps {
  tradeoffs: ModelTradeoffs;
}

export function Tradeoffs({ tradeoffs }: TradeoffsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Tradeoffs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Pros */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
              Advantages
            </h4>
            <ul className="space-y-1.5">
              {tradeoffs.pros.map((pro, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              Considerations
            </h4>
            <ul className="space-y-1.5">
              {tradeoffs.cons.map((con, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
