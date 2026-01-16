import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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

export default function ErrorBudgetBurndown() {
  const [searchParams] = useSearchParams();

  // Input allows full range; slider focuses on high-availability targets
  const MIN_SLO = 0;
  const MAX_SLO = 99.999;
  const MIN_INCIDENTS = 0;
  const MAX_INCIDENTS = 20;

  // Parse URL params for cross-tool linking
  const getInitialParams = () => {
    const sloParam = searchParams.get('slo');
    const incidentsParam = searchParams.get('incidents');

    let slo = 99.9;
    if (sloParam) {
      const parsed = parseFloat(sloParam);
      if (!isNaN(parsed)) {
        slo = Math.min(MAX_SLO, Math.max(MIN_SLO, parsed));
      }
    }

    let incidents = 4;
    if (incidentsParam) {
      const parsed = parseInt(incidentsParam, 10);
      if (!isNaN(parsed)) {
        incidents = Math.min(MAX_INCIDENTS, Math.max(MIN_INCIDENTS, parsed));
      }
    }

    return { slo, incidents };
  };

  const initialParams = getInitialParams();

  const [config, setConfig] = useState<SloConfig>({
    target: initialParams.slo,
    period: 'monthly',
    startDate: getDefaultStartDate(),
  });

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentFrequency, setIncidentFrequency] = useState(initialParams.incidents);

  // Update config if URL params change (e.g., from cross-tool navigation)
  useEffect(() => {
    const params = getInitialParams();
    setConfig((prev) => ({ ...prev, target: params.slo }));
    setIncidentFrequency(params.incidents);
  }, [searchParams]);

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
          initialFrequency={incidentFrequency}
          onFrequencyChange={setIncidentFrequency}
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
          to={`/projects/uptime-calculator?slo=${config.target}&mode=target&incidents=${incidentFrequency}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Improve your incident response times
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
