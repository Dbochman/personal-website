import { useState } from 'react';
import { SloConfigInputs } from './SloConfigInputs';
import { IncidentList } from './IncidentList';
import { BurndownChart } from './BurndownChart';
import { SummaryCards } from './SummaryCards';
import {
  type SloConfig,
  type Incident,
  calculateBudget,
  generateChartData,
  toLocalDateString,
} from './calculations';

// Get first day of current month as default start date
function getDefaultStartDate(): string {
  const now = new Date();
  return toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
}

export default function ErrorBudgetBurndown() {
  const [config, setConfig] = useState<SloConfig>({
    target: 99.9,
    period: 'monthly',
    startDate: getDefaultStartDate(),
  });

  const [incidents, setIncidents] = useState<Incident[]>([]);

  const calculation = calculateBudget(config, incidents);
  const chartData = generateChartData(config, incidents, calculation);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Visualize how quickly you're consuming your error budget. Configure your SLO target,
        add incidents, and see your burn rate with projections.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <SloConfigInputs config={config} onChange={setConfig} />
        <IncidentList
          incidents={incidents}
          onChange={setIncidents}
          periodStartDate={config.startDate}
        />
      </div>

      <SummaryCards calculation={calculation} />

      <BurndownChart
        data={chartData}
        daysElapsed={calculation.daysElapsed}
        isOnTrack={calculation.isOnTrack}
      />
    </div>
  );
}
