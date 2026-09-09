
export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  highlights: string[];
  logo?: string;
}

export const experiences: Experience[] = [
  {
    company: "NVIDIA",
    role: "Sr. Site Reliability Engineer - Technical Incident Manager",
    period: "January 2026 – Present",
    description: "Incident response and operational resilience for cloud and on-premises AI inference infrastructure.",
    highlights: [
      "Lead incident response for NVIDIA's inference infrastructure, coordinating across cloud and on-premises environments",
      "Build operational resilience frameworks for AI inference workloads at scale",
      "Drive incident management processes for mission-critical inference hardware deployments"
    ]
  },
  {
    company: "Groq",
    role: "Technical Incident Manager",
    period: "July 2025 – January 2026",
    description: "Built incident response practices for AI inference infrastructure.",
    highlights: [
      "Established Groq's zero-to-one incident management framework, including policies, runbooks, and onboarding materials that align with security and compliance requirements.",
      "Served as primary Incident Commander during production outages, guiding distributed engineers through mitigation while delivering clear, timely updates to customers and executives.",
      "Collaborated with engineering, operations, and product teams to turn incident insights into reliability roadmaps, refined service-level objectives, and higher code quality."
    ]
  },
  {
    company: "HashiCorp (IBM)",
    role: "SRE II",
    period: "2024 - 2025",
    description: "Worked on availability monitoring, incident coordination, and customer communication for cloud services.",
    highlights: [
      "Presented incident and reliability metrics to senior leadership to guide prioritization and clarify operational risk",
      "Partnered with Legal and Comms to standardize customer-facing emergency messaging",
      "Acted as primary Incident Commander for high-severity incidents involving engineering, product, and support teams"
    ]
  },
  {
    company: "Spotify",
    role: "SRE & Reliability PM",
    period: "2017 - 2023",
    description: "Worked across engineering and product management on synthetic testing, on-call practices, and SLO tooling.",
    highlights: [
      "Improved organizational reliability at scale with Synthetic Testing",
      "Optimized on-call practices for incident on-call team",
      "Developed SLO Backstage Plugin and facilitated SLO workshops"
    ]
  }
];
