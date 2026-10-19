// Keep this module behind a dynamic import: no diagram code on unrelated pages.
import { register } from 'pele/core';
import flowchart from 'pele/diagrams/flowchart';

register(flowchart);

export { mount, render } from 'pele/core';

// Diagram source is authored in the repository. Links and images stay disabled,
// matching the old strict renderer; walkthrough navigation belongs to React.
export const flowchartOptions = {
  links: false,
  images: false,
  zoom: 'auto',
  autoDirection: false,
} as const;
