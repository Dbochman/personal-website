
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
