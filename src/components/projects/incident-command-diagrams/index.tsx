import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MermaidDiagram } from './MermaidDiagram';

const DIAGRAMS = [
  {
    id: 'incident-escalation',
    title: 'Incident Escalation Process',
    description:
      'Route incidents based on severity and decide when to involve additional on-call support.',
    code: `---
config:
  layout: fixed
---
flowchart TD
  A[Incident reported] --> B[Triage and classify severity]
  B --> C{High severity?}
  C -->|Yes| D[Page On-Call]
  D --> E[Incident Management Process 🔗]
  click E "#incident-management" "Open Incident Management Process"
  C -->|No| F[Incident team investigates]
  F --> G{Escalation needed?}
  G -->|No| H[Continue response and resolve]
  G -->|Yes, promote to high severity| D
  class E jump;
`,
  },
  {
    id: 'incident-management',
    title: 'Incident Management Process',
    description:
      'Establish roles, keep stakeholders informed, and close the loop on resolution.',
    code: `---
config:
  layout: fixed
---
flowchart TD
  A[On-Call Paged] --> B[Triage and Assess Severity]
  B --> C{Need additional responders?}
  C -->|Yes| D[Page Additional On-Call 🔗]
  C -->|No| E[Proceed with current responders]
  D --> F[Investigate and Mitigate Issues 🔗]
  E --> F
  F --> G[Monitor progress and share updates]
  G --> H{Customer impact?}
  H -->|Yes| I[Post updates to status page]
  H -->|No| J[Issue Mitigated]
  I --> J
  J --> K{Confirm stability}
  K -->|Yes| L[Resolve StatusPage Incident]
  K -->|No| M[Continue mitigation]
  M --> F
  L --> N[Resolve Internal Incident]
  click D "#service-owner-paging" "Open Service Owner Paging Path"
  click F "#service-owner-paging" "Open Service Owner Paging Path"
  class D jump;
  class F jump;
`,
  },
  {
    id: 'service-owner-paging',
    title: 'Service Owner Paging Path',
    description:
      'Find the right on-call responder using the service catalog and escalation paths.',
    code: `---
config:
  layout: fixed
---
flowchart TD
  A[Issue identified in a specific service] --> B[Search service catalog for owner info]
  B -->|On-call link found| C[Page On-Call]
  B -->|No owner info found| D[Search on-call tool for service]
  D -->|Service found| E[Page On-Call]
  D -->|Can't find service| F[Check Slack/Teams/Email]
  F --> G{Service Owner Found}
  G -->|Page On-Call| H[Page On-Call]
  G -->|No On-Call Found| J[Escalate within your team]
`,
  },
];

interface DiagramCardProps {
  title: string;
  description: string;
  code: string;
}

function DiagramCard({ title, description, code }: DiagramCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle as="h2" className="text-xl">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy Mermaid'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <MermaidDiagram code={code} />
        <details className="rounded-md border border-dashed px-4 py-3 text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            View Mermaid source
          </summary>
          <pre className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">
            {code.trim()}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}

export default function IncidentCommandDiagrams() {
  const [activeTab, setActiveTab] = useState(DIAGRAMS[0].id);

  useEffect(() => {
    const updateFromHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (DIAGRAMS.some((diagram) => diagram.id === hash)) {
        setActiveTab(hash);
      }
    };

    updateFromHash();
    window.addEventListener('hashchange', updateFromHash);

    return () => window.removeEventListener('hashchange', updateFromHash);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${value}`);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Three incident command flowcharts that you can reuse, edit, and export as Mermaid.
        Use the tabs to switch views and copy the underlying diagram code.
      </p>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="h-auto w-fit max-w-full flex-wrap justify-start gap-1 rounded-lg bg-zinc-200 p-1 text-muted-foreground dark:bg-zinc-800">
          {DIAGRAMS.map((diagram) => (
            <TabsTrigger
              key={diagram.id}
              value={diagram.id}
              className="rounded-md px-3 py-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:text-sm"
            >
              {diagram.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {DIAGRAMS.map((diagram) => (
          <TabsContent key={diagram.id} value={diagram.id} id={diagram.id}>
            <DiagramCard
              title={diagram.title}
              description={diagram.description}
              code={diagram.code}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
