import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
  PERIOD_DAYS,
} from './calculations';

// Get first day of current month as default start date
function getDefaultStartDate(): string {
  const now = new Date();
  return toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
}

/**
 * Parse URL params on mount for cross-tool linking
 */
function getSloFromUrl(): number | null {
  const params = new URLSearchParams(window.location.search);
  const slo = params.get('slo');
  return slo ? parseFloat(slo) : null;
}

export default function ErrorBudgetBurndown() {
  const [config, setConfig] = useState<SloConfig>({
    target: 99.9,
    period: 'monthly',
    startDate: getDefaultStartDate(),
  });

  const [incidents, setIncidents] = useState<Incident[]>([]);

  // Read SLO from URL params on mount for cross-tool linking
  useEffect(() => {
    const urlSlo = getSloFromUrl();
    if (urlSlo !== null && !isNaN(urlSlo) && urlSlo >= 90 && urlSlo <= 100) {
      setConfig((prev) => ({ ...prev, target: urlSlo }));
    }
  }, []);

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
          periodDays={PERIOD_DAYS[config.period]}
        />
      </div>

      <SummaryCards calculation={calculation} />

      <BurndownChart
        data={chartData}
        daysElapsed={calculation.daysElapsed}
        isOnTrack={calculation.isOnTrack}
      />

      {/* Cross-tool link */}
      <div className="pt-4 border-t">
        <Link
          to={`/projects/uptime-calculator?slo=${config.target}&mode=target`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Improve your incident response times
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
