
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
    company: "Nvidia",
    role: "Technical Incident Manager",
    period: "January 2026 – Present",
    description: "Inference Incident Management and Operational Resilience, Supporting both cloud and onsite inference hardware.",
    highlights: [
      "Lead incident response for Nvidia's inference infrastructure, coordinating across cloud and on-premises environments",
      "Build operational resilience frameworks for AI inference workloads at scale",
      "Drive incident management processes for mission-critical inference hardware deployments"
    ]
  },
  {
    company: "Groq",
    role: "Technical Incident Manager",
    period: "July 2025 – January 2026",
    description: "Building zero-to-one incident response capabilities for high-performance AI infrastructure.",
    highlights: [
      "Establish Groq's zero-to-one incident management framework, including policies, runbooks, and onboarding materials that align with security and compliance requirements.",
      "Serve as primary Incident Commander during production outages, guiding distributed engineers through mitigation while delivering clear, timely updates to customers and executives.",
      "Collaborate with engineering, operations, and product teams to turn incident insights into reliability roadmaps, refined service-level objectives, and higher code quality."
    ]
  },
  {
    company: "HashiCorp (IBM)",
    role: "SRE II",
    period: "2024 - 2025",
    description: "Leading initiatives to strengthen service-level infrastructure and optimize availability monitoring in complex cloud environments.",
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
    description: "Developed scalable infrastructure solutions while bridging technical and product perspectives.",
    highlights: [
      "Improved organizational reliability at scale with Synthetic Testing",
      "Optimized on-call practices for incident on-call team",
      "Developed SLO Backstage Plugin and facilitated SLO workshops"
    ]
  }
];
