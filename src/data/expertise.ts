
export type CompanyId = 'groq' | 'hashicorp' | 'spotify';

export interface ExpertiseItem {
  title: string;
  description: string;
  companies: CompanyId[];
  skills: string[];
}

export const coreExpertise: ExpertiseItem[] = [
  {
    title: "Site Reliability Engineering",
    description: "Building and maintaining reliable, scalable systems with a focus on availability, performance, and operational excellence.",
    companies: ['groq', 'hashicorp', 'spotify'],
    skills: ['Terraform', 'Kubernetes', 'Prometheus', 'Datadog']
  },
  {
    title: "Incident Command & Coordination",
    description: "Leading cross-functional teams through high-severity production incidents with clear communication and structured mitigation.",
    companies: ['groq', 'hashicorp'],
    skills: ['Incident Command', 'Crisis Communication', 'Runbooks']
  },
  {
    title: "Post-Incident Analysis and Reporting",
    description: "Transforming incident data into actionable insights and presenting reliability metrics to senior leadership.",
    companies: ['groq', 'hashicorp', 'spotify'],
    skills: ['Root Cause Analysis', 'Blameless Retrospectives', 'Executive Reporting']
  },
  {
    title: "SLO Monitoring and Strategy",
    description: "Defining service-level objectives and building monitoring infrastructure to track and improve system reliability.",
    companies: ['groq', 'hashicorp', 'spotify'],
    skills: ['SLO/SLI Design', 'Error Budgets', 'Backstage', 'Alerting Strategy']
  },
  {
    title: "Retrospective Preparation and Facilitation",
    description: "Designing and leading blameless retrospectives that drive meaningful reliability improvements.",
    companies: ['groq', 'hashicorp', 'spotify'],
    skills: ['Facilitation', 'Action Item Tracking', 'Learning Culture']
  },
  {
    title: "Cross-functional Stakeholder Communication",
    description: "Partnering with Legal, Comms, Product, and Engineering to align on incident response and customer messaging.",
    companies: ['groq', 'hashicorp'],
    skills: ['Executive Updates', 'Customer Communication', 'Status Pages']
  },
  {
    title: "Operational Readiness & Game Day Planning",
    description: "Establishing zero-to-one incident management frameworks, policies, and chaos engineering practices.",
    companies: ['groq', 'spotify'],
    skills: ['Chaos Engineering', 'Runbook Development', 'Onboarding']
  },
  {
    title: "Automated Incident Response",
    description: "Building synthetic testing and automated detection systems to identify issues before customers do.",
    companies: ['groq', 'spotify'],
    skills: ['Synthetic Testing', 'Automated Remediation', 'Observability']
  }
];
