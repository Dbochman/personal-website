import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';

interface MessageOutputProps {
  title: string;
  message: string;
}

export function MessageOutput({ title, message }: MessageOutputProps) {
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const copyToClipboard = async (text: string, type: 'title' | 'message') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'title') {
        setCopiedTitle(true);
        setTimeout(() => setCopiedTitle(false), 2000);
      } else {
        setCopiedMessage(true);
        setTimeout(() => setCopiedMessage(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle as="h2" className="text-base">Generated Status Update</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Title / Subject</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => copyToClipboard(title, 'title')}
            >
              {copiedTitle ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="p-3 bg-muted rounded-md font-mono text-sm">
            {title}
          </div>
        </div>

        {/* Message body */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Message Body</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => copyToClipboard(message, 'message')}
            >
              {copiedMessage ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="p-3 bg-muted rounded-md font-mono text-sm whitespace-pre-wrap">
            {message}
          </div>
        </div>

        {/* Copy all */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => copyToClipboard(`${title}\n\n${message}`, 'message')}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Title + Message
        </Button>
      </CardContent>
    </Card>
  );
}
