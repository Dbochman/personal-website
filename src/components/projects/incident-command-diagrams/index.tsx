import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ResponsiveTabsList } from '@/components/ui/responsive-tabs';
import { AnimatedMermaidDiagram, type AnimationNode } from './AnimatedMermaidDiagram';

const DIAGRAMS: Array<{
  id: string;
  title: string;
  description: string;
  code: string;
  nodes: AnimationNode[];
}> = [
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
    nodes: [
      // 0
      { id: 'A', label: 'Incident reported', description: 'An incident has been identified and reported to the response team.' },
      // 1
      { id: 'B', label: 'Triage and classify severity', description: 'Assess the impact and urgency to determine severity level (P1-P4).' },
      // 2: branches to D(3) or F(5)
      { id: 'C', label: 'High severity?', type: 'decision', branches: [['High Severity', 3], ['Low Severity', 5]], description: 'Is this a P1/P2 incident affecting customers or critical systems?' },
      // 3: link to service-owner-paging diagram
      { id: 'D', label: 'Page On-Call', type: 'link', linkTo: 'service-owner-paging', description: 'Alert the on-call engineer immediately via PagerDuty or similar.' },
      // 4: link to incident-management diagram
      { id: 'E', label: 'Incident Management Process', type: 'link', linkTo: 'incident-management', description: 'Hand off to the formal incident management workflow.' },
      // 5
      { id: 'F', label: 'Incident team investigates', description: 'The current team continues investigating without escalation.' },
      // 6: branches to D(3) or H(7)
      { id: 'G', label: 'Escalation needed?', type: 'decision', branches: [['Escalate', 3], ['Continue', 7]], description: 'Has the situation worsened or stalled? Should we escalate?' },
      // 7: link to incident-management diagram
      { id: 'H', label: 'Continue response and resolve', type: 'link', linkTo: 'incident-management', description: 'Proceed with mitigation and resolution without further escalation.' },
    ],
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
  D --> F[Investigate and Mitigate Issues]
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
  L --> N[Incident Resolution]
  click D "#service-owner-paging" "Open Service Owner Paging Path"
  class D jump;
`,
    nodes: [
      // 0
      { id: 'A', label: 'On-Call Paged', description: 'The on-call engineer has been alerted and is responding.' },
      // 1
      { id: 'B', label: 'Triage and Assess Severity', description: 'Quickly assess what\'s happening and confirm severity level.' },
      // 2: branches to D(3) or E(4)
      { id: 'C', label: 'Need additional responders?', type: 'decision', branches: [['Page More', 3], ['Proceed Solo', 4]], description: 'Can you handle this alone, or do you need specialists?' },
      // 3: link to service-owner-paging diagram
      { id: 'D', label: 'Page Additional On-Call', type: 'link', linkTo: 'service-owner-paging', description: 'Bring in service owners or specialists who can help.' },
      // 4
      { id: 'E', label: 'Proceed with current responders', description: 'Continue with the current team.' },
      // 5
      { id: 'F', label: 'Investigate and Mitigate Issues', description: 'Dig into root cause while working on mitigation.' },
      // 6
      { id: 'G', label: 'Monitor progress and share updates', description: 'Keep stakeholders informed with regular updates.' },
      // 7: branches to I(8) or J(9)
      { id: 'H', label: 'Customer impact?', type: 'decision', branches: [['Yes', 8], ['No', 9]], description: 'Are customers affected by this incident?' },
      // 8: link to statuspage-update tool
      { id: 'I', label: 'Post updates to status page', type: 'link', linkTo: '/projects/statuspage-update', description: 'Communicate externally via status page.' },
      // 9
      { id: 'J', label: 'Issue Mitigated', description: 'The immediate problem has been addressed.' },
      // 10: branches to L(11) or back to F(5) for retry
      { id: 'K', label: 'Confirm stability', type: 'decision', branches: [['Stable', 11], ['Not Stable', 5]], description: 'Are we confident the fix is holding?' },
      // 11
      { id: 'L', label: 'Resolve StatusPage Incident', description: 'Mark the external incident as resolved.' },
      // 12 (M is a loop-back node only reachable via "Not Stable" branch to F, not part of main flow)
      { id: 'N', label: 'Incident Resolution', description: 'Close out the internal incident ticket.' },
    ],
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
    nodes: [
      { id: 'A', label: 'Issue identified in a specific service', description: 'You\'ve identified which service is causing the problem.' },
      { id: 'B', label: 'Search service catalog for owner info', description: 'Check your service catalog/registry for ownership info.' },
      { id: 'C', label: 'Page On-Call', description: 'Use the catalog link to page the service owner.' },
      { id: 'D', label: 'Search on-call tool for service', description: 'Search PagerDuty/OpsGenie directly for the service.' },
      { id: 'E', label: 'Page On-Call', description: 'Found it - page the service owner.' },
      { id: 'F', label: 'Check Slack/Teams/Email', description: 'Try communication channels to find the owner.' },
      // 6: branches to H(7) or J(8)
      { id: 'G', label: 'Service Owner Found', type: 'decision', branches: [['Found', 7], ['Not Found', 8]], description: 'Were you able to locate someone responsible?' },
      { id: 'H', label: 'Page On-Call', description: 'Successfully located owner - page them.' },
      { id: 'J', label: 'Escalate within your team', description: 'No owner found - escalate to your leadership.' },
    ],
  },
];

const DIAGRAM_TABS = DIAGRAMS.map((d) => ({ value: d.id, label: d.title }));

interface DiagramCardProps {
  title: string;
  description: string;
  code: string;
  nodes: AnimationNode[];
  onLinkClick?: (linkTo: string) => void;
}

function DiagramCard({ title, description, code, nodes, onLinkClick }: DiagramCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="text-xl">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatedMermaidDiagram code={code} nodes={nodes} speed={1500} onLinkClick={onLinkClick} />
        <details className="rounded-md border border-dashed px-4 py-3 text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            View Mermaid source
          </summary>
          <div className="mt-3 space-y-3">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy Mermaid'}
            </Button>
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
              {code.trim()}
            </pre>
          </div>
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

  const handleLinkClick = (linkTo: string) => {
    // External links start with / - open in new tab
    if (linkTo.startsWith('/')) {
      window.open(linkTo, '_blank');
    } else {
      // Internal tab links
      handleTabChange(linkTo);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Three incident command flowcharts that you can reuse, edit, and export as Mermaid.
        Use the tabs to switch views and copy the underlying diagram code.
      </p>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <ResponsiveTabsList
          items={DIAGRAM_TABS}
          value={activeTab}
          onValueChange={handleTabChange}
          tabsListClassName="h-auto w-fit max-w-full flex-wrap justify-start gap-1 rounded-lg bg-zinc-200 p-1 text-muted-foreground dark:bg-zinc-800"
          triggerClassName="rounded-md px-3 py-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs sm:text-sm"
        />
        {DIAGRAMS.map((diagram) => (
          <TabsContent key={diagram.id} value={diagram.id} id={diagram.id}>
            <DiagramCard
              title={diagram.title}
              description={diagram.description}
              code={diagram.code}
              nodes={diagram.nodes}
              onLinkClick={handleLinkClick}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
