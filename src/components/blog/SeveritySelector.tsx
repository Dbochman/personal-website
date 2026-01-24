import { useState } from 'react';

interface SeverityData {
  severity: string;
  external: number;
  internal: number;
  description: string;
}

interface SeveritySelectorProps {
  title?: string;
  data?: SeverityData[];
}

const DEFAULT_DATA: SeverityData[] = [
  {
    severity: 'SEV1',
    external: 15,
    internal: 10,
    description: 'Critical outage affecting all users. Maximum urgency.',
  },
  {
    severity: 'SEV2',
    external: 30,
    internal: 15,
    description: 'Major degradation affecting many users. High priority.',
  },
  {
    severity: 'SEV3',
    external: 60,
    internal: 30,
    description: 'Partial impact on subset of users. Standard response.',
  },
];

/**
 * Interactive severity selector showing update cadence
 * Click on a severity to see recommended update intervals
 */
export function SeveritySelector({
  title = 'Update Cadence by Severity',
  data = DEFAULT_DATA,
}: SeveritySelectorProps) {
  const [selected, setSelected] = useState(0);
  const current = data[selected];

  return (
    <figure className="my-8">
      {title && (
        <figcaption className="text-center text-sm font-medium text-muted-foreground mb-4">
          {title}
        </figcaption>
      )}
      <div className="bg-card rounded-lg border border-border p-4">
        {/* Severity tabs */}
        <div className="flex gap-2 justify-center mb-4">
          {data.map((item, i) => (
            <button
              key={item.severity}
              onClick={() => setSelected(i)}
              aria-pressed={selected === i}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selected === i
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {item.severity}
            </button>
          ))}
        </div>

        {/* Current selection display */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {current.external}
              <span className="text-base font-normal text-muted-foreground ml-1">min</span>
            </div>
            <div className="text-sm text-muted-foreground">External Updates</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {current.internal}
              <span className="text-base font-normal text-muted-foreground ml-1">min</span>
            </div>
            <div className="text-sm text-muted-foreground">Internal Updates</div>
          </div>
        </div>

        {/* Description */}
        <p className="text-center text-sm text-muted-foreground">
          {current.description}
        </p>
      </div>
    </figure>
  );
}
