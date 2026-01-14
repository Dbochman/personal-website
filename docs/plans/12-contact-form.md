# Contact Form Plan

## Overview

Add a contact form to the site for visitors to send messages. Since GitHub Pages is static-only, requires a form backend service.

## Options

### Option A: Formspree (Recommended)

- Free tier: 50 submissions/month
- No backend code needed
- Spam filtering built-in
- Email notifications

### Option B: Netlify Forms

- Already using Netlify for CMS
- 100 submissions/month free
- Requires Netlify hosting or proxy

### Option C: EmailJS

- Send directly to email
- 200 emails/month free
- Client-side only

### Option D: Custom (AWS SES + Lambda)

- Full control
- More complex setup
- Requires AWS account

## Implementation (Option A: Formspree)

### Phase 1: Formspree Setup

1. Create account at formspree.io
2. Create new form, get form ID
3. Configure email notifications
4. Enable spam protection (reCAPTCHA optional)

### Phase 2: Contact Page

**File:** `src/pages/Contact.tsx`

```tsx
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import PageLayout from '@/components/layout/PageLayout';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function Contact() {
  const [status, setStatus] = useState<FormStatus>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        setStatus('success');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact - Dylan Bochman</title>
        <meta name="description" content="Get in touch with Dylan Bochman" />
      </Helmet>

      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
            <p className="text-muted-foreground mb-8">
              Have a question or want to work together? Send me a message.
            </p>

            {status === 'success' ? (
              <div className="bg-green-500/10 text-green-500 p-4 rounded-lg">
                Thanks for your message! I'll get back to you soon.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Your name"
                    disabled={status === 'submitting'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    disabled={status === 'submitting'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    placeholder="Your message..."
                    disabled={status === 'submitting'}
                  />
                </div>

                {status === 'error' && (
                  <div className="text-destructive text-sm">
                    Something went wrong. Please try again.
                  </div>
                )}

                <Button type="submit" disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            )}

            <div className="mt-16">
              <Footer />
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
```

### Phase 3: Form Validation

Add client-side validation with react-hook-form:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FormData = z.infer<typeof schema>;

function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    // Submit to Formspree
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      {/* ... */}
    </form>
  );
}
```

### Phase 4: Spam Protection

**Option A: Honeypot field**

```tsx
{/* Hidden field - bots fill this, humans don't */}
<input
  type="text"
  name="_gotcha"
  style={{ display: 'none' }}
  tabIndex={-1}
  autoComplete="off"
/>
```

**Option B: Formspree reCAPTCHA**

Enable in Formspree dashboard - automatic integration.

### Phase 5: Add Route

**File:** `src/App.tsx`

```tsx
import Contact from '@/pages/Contact';

<Route path="/contact" element={<Contact />} />
```

### Phase 6: Navigation Link (Optional)

Add Contact link to nav if desired:

```tsx
// Header.tsx
<Link to="/contact">Contact</Link>
```

## Accessibility

```tsx
// Live region for form status
<div aria-live="polite" className="sr-only">
  {status === 'success' && 'Message sent successfully'}
  {status === 'error' && 'Error sending message'}
</div>

// Form labels properly associated
<Label htmlFor="email">Email</Label>
<Input id="email" aria-describedby="email-error" />
{errors.email && <span id="email-error">{errors.email.message}</span>}
```

## Files to Create/Modify

```
src/pages/Contact.tsx      # New: contact page
src/App.tsx               # Add route
src/components/layout/Header.tsx  # Optional: nav link
```

## Environment Variables

```env
VITE_FORMSPREE_ID=your_form_id
```

## Verification

1. Fill out form with valid data - should succeed
2. Submit empty form - should show validation errors
3. Check email notification received
4. Test honeypot - submission with honeypot filled should be rejected
5. Test keyboard navigation and screen reader

## Effort

**Estimate**: Small-Medium

- Formspree setup: 10 min
- Basic form: 30 min
- Validation: 30 min
- Spam protection: 15 min
- Accessibility: 20 min
- Testing: 20 min

## Dependencies

- Formspree account (free tier)
- Optional: react-hook-form, zod for validation
