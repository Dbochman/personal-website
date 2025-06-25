
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AccordionSection from './AccordionSection';
import { Accordion } from '@/components/ui/accordion';

describe('AccordionSection', () => {
  it('should render the title and summary', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionSection title="Test Title" summary="Test Summary" value="item-1">
          <div>Test Content</div>
        </AccordionSection>
      </Accordion>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Summary')).toBeInTheDocument();
  });
});
