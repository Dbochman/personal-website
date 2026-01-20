# Plan: Add FAQ Section with Schema

## Goal

Add an FAQ section answering SRE-related questions with FAQPage JSON-LD schema markup. This targets featured snippets and voice search queries like "What does an SRE do?"

## Non-Goals

- Creating a separate FAQ page (embed in About page or home page)
- Answering generic questions (focus on SRE-specific)
- Over-optimizing for SEO at expense of usefulness

## Current State

No FAQ section exists. The site doesn't target any question-based queries.

---

## UI Design

```
┌─────────────────────────────────────────────────────────────────┐
│  Frequently Asked Questions                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ▼ What does a Site Reliability Engineer do?               │ │
│  │   ─────────────────────────────────────────────────────── │ │
│  │   A Site Reliability Engineer ensures system reliability, │ │
│  │   scalability, and performance by applying software       │ │
│  │   engineering practices to operations...                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ▶ What is the difference between SRE and DevOps?          │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ▶ What are SLOs, SLIs, and SLAs?                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ▶ What is an error budget?                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ▶ What is a blameless postmortem?                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation

### Step 1: Create FAQ Data File

**File:** `src/data/faq.ts`

```ts
export interface FAQ {
  question: string;
  answer: string;
}

export const faqs: FAQ[] = [
  {
    question: "What does a Site Reliability Engineer do?",
    answer: "A Site Reliability Engineer (SRE) ensures system reliability, scalability, and performance by applying software engineering practices to IT operations. SREs focus on automation, monitoring, incident response, and maintaining service level objectives (SLOs) to balance reliability with feature velocity."
  },
  {
    question: "What is the difference between SRE and DevOps?",
    answer: "While both focus on bridging development and operations, SRE is a specific implementation with measurable objectives. DevOps is a cultural philosophy emphasizing collaboration and automation. SRE uses error budgets and SLOs to make data-driven decisions about reliability vs. feature development, while DevOps focuses on continuous delivery and shared ownership."
  },
  {
    question: "What are SLOs, SLIs, and SLAs?",
    answer: "SLI (Service Level Indicator) is a metric measuring service performance, like latency or availability. SLO (Service Level Objective) is the target value for an SLI, like '99.9% of requests complete in under 200ms.' SLA (Service Level Agreement) is a contract with customers specifying consequences if SLOs aren't met."
  },
  {
    question: "What is an error budget?",
    answer: "An error budget is the inverse of your SLO - the amount of acceptable unreliability. If your SLO is 99.9% availability, your error budget is 0.1% (about 43 minutes per month). When the budget is exhausted, teams prioritize reliability work over new features. This creates a data-driven balance between innovation and stability."
  },
  {
    question: "What is a blameless postmortem?",
    answer: "A blameless postmortem is a post-incident review focused on understanding what happened and preventing recurrence, without assigning personal blame. It assumes that people made reasonable decisions given the information they had. This psychological safety encourages honest reporting and leads to systemic improvements rather than scapegoating."
  },
  {
    question: "What tools do SREs commonly use?",
    answer: "Common SRE tools include Prometheus and Grafana for monitoring, Kubernetes for orchestration, Terraform for infrastructure as code, PagerDuty for on-call management, and platforms like Datadog or New Relic for observability. The specific stack varies by organization, but the focus is always on automation and visibility."
  }
];
```

### Step 2: Create FAQSection Component

**File:** `src/components/sections/FAQSection.tsx`

```tsx
import { Helmet } from 'react-helmet-async';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/data/faq";

interface FAQSectionProps {
  /** Whether to include the FAQPage JSON-LD schema (only include once per page) */
  includeSchema?: boolean;
}

export function FAQSection({ includeSchema = true }: FAQSectionProps) {
  // Generate FAQPage JSON-LD schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section className="py-12" aria-labelledby="faq-heading">
      {includeSchema && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>
        </Helmet>
      )}

      <h2 id="faq-heading" className="text-2xl font-bold mb-6">
        Frequently Asked Questions
      </h2>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`faq-${index}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
```

### Step 3: Add to About Page (or Index)

**Option A: Add to About.tsx** (Recommended)

**File:** `src/pages/About.tsx` (after the Skills section, before CTA)

```diff
+ import { FAQSection } from '@/components/sections/FAQSection';

  ...

          {/* Skills */}
          <section className="mb-12">
            ...
          </section>

+         {/* FAQ */}
+         <FAQSection />

          {/* CTA */}
          <section className="flex flex-wrap gap-4">
```

**Option B: Add to Index.tsx**

**File:** `src/pages/Index.tsx` (before ContactSection)

```diff
+ import { FAQSection } from '@/components/sections/FAQSection';

  ...

          {/* Sidebar Column */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <Sidebar />
          </div>
        </div>
      </div>

+     {/* FAQ Section */}
+     <div className="container mx-auto max-w-6xl px-6 py-12">
+       <FAQSection />
+     </div>

      {/* Contact Section */}
      <ContactSection />
```

---

## FAQ Content Guidelines

### Questions to Target

Target question-based queries people actually search:
- "What does a Site Reliability Engineer do?" (high volume)
- "SRE vs DevOps difference" (common comparison)
- "What is an error budget SRE" (specific SRE concept)
- "Blameless postmortem meaning" (specific term)

### Answer Guidelines

- **Length:** 50-200 words per answer
- **First sentence:** Direct answer to the question
- **Include keywords:** Naturally use SRE terminology
- **Be useful:** Provide real value, not keyword stuffing

---

## JSON-LD Schema Structure

The FAQPage schema enables rich results in Google:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What does a Site Reliability Engineer do?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A Site Reliability Engineer..."
      }
    }
  ]
}
```

---

## Testing

### 1. Visual Check
```bash
npm run dev
# Navigate to the page with FAQ section
# Verify accordion expands/collapses
# Verify all 6 questions are visible
```

### 2. Schema Check
```bash
# View page source
# Search for "FAQPage"
# Verify JSON-LD is present and valid
```

### 3. Accessibility Check
```bash
# Tab through FAQ items
# Verify Enter/Space toggles accordion
# Verify screen reader announces question/answer
```

### 4. Rich Results Test

1. Go to https://search.google.com/test/rich-results
2. Enter the page URL (after deploy)
3. Verify "FAQ" rich result type is detected
4. Verify all questions appear correctly

### 5. Schema.org Validator

1. Go to https://validator.schema.org/
2. Paste the JSON-LD
3. Verify no errors or warnings

---

## Checklist

- [ ] Create `src/data/faq.ts` with 6 SRE questions
- [ ] Create `src/components/sections/FAQSection.tsx`
- [ ] Import and use existing `Accordion` components
- [ ] Add FAQPage JSON-LD schema via Helmet
- [ ] Add FAQSection to About page (after Skills, before CTA)
- [ ] Verify accordion functionality
- [ ] Validate schema with Rich Results Test
- [ ] Test accessibility with keyboard navigation

---

## Future Enhancements

- Add more questions based on Search Console queries
- Track FAQ clicks with GA4 events
- Add internal links within answers (e.g., link to SLO Calculator)
- Consider a dedicated /faq route if content grows

---

## Effort

- **Implementation:** 45 minutes
- **Content writing:** 30 minutes (refine answers)
- **Validation:** 15 minutes
